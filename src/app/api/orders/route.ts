import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json(orders);
  } catch (error) {
    const details = logError("GET /api/orders", error);
    return NextResponse.json({ error: "Failed to fetch orders", details }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const items: Array<{ productId: string; name?: string; quantity: number }> = body.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    // Track successfully reserved items for rollback if a subsequent item fails
    const deductedItems: Array<{ productId: string; quantity: number }> = [];

    // Atomically reserve stock item-by-item using MongoDB atomic filter { stock: { $gte: quantity } }
    // WiredTiger engine ensures document-level atomicity, preventing race conditions
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) continue;

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { returnDocument: "after" }
      );

      if (!updatedProduct) {
        // Stock reservation failed! Either product doesn't exist or stock < item.quantity
        // Roll back any previously reserved items in this order
        if (deductedItems.length > 0) {
          await Promise.all(
            deductedItems.map((d) =>
              Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } })
            )
          );
        }

        const product = await Product.findById(item.productId).lean();
        const productName = item.name || product?.name || "المنتج المطلوب";
        const availableStock = product?.stock ?? 0;

        return NextResponse.json(
          {
            error:
              availableStock > 0
                ? `عذراً، الكمية المتاحة من "${productName}" هي ${availableStock} فقط.`
                : `عذراً، المنتج "${productName}" نفد من المخزن بالكامل.`,
          },
          { status: 400 }
        );
      }

      deductedItems.push({ productId: item.productId, quantity: item.quantity });
    }

    // All items successfully reserved stock atomically! Create the order record.
    const order = await Order.create(body);

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/orders", error);
    return NextResponse.json({ error: "Failed to create order", details }, { status: 500 });
  }
}
