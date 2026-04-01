import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { logError } from "@/lib/apiError";

export async function GET() {
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
    const order = await Order.create(body);

    // Update product stock in a single batched operation
    if (body.items && Array.isArray(body.items)) {
      const bulkOps = body.items
        .filter((item: { productId?: string }) => item.productId)
        .map((item: { productId: string; quantity: number }) => ({
          updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { stock: -item.quantity } },
          },
        }));
      if (bulkOps.length > 0) {
        await Product.bulkWrite(bulkOps);
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/orders", error);
    return NextResponse.json({ error: "Failed to create order", details }, { status: 500 });
  }
}
