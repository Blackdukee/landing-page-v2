import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";
import { InventoryEngine } from "@/modules/inventory/InventoryEngine";

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

    // Atomically reserve inventory through deep InventoryEngine
    const stockItems = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    const reservation = await InventoryEngine.reserveStock(stockItems);

    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error || "عذراً، فشل حجز الكمية المطلوبة." },
        { status: 400 }
      );
    }

    // Create the order record
    const order = await Order.create(body);

    return NextResponse.json(
      {
        ...order.toObject(),
        lowStockAlerts: reservation.lowStockAlerts || [],
      },
      { status: 201 }
    );
  } catch (error) {
    const details = logError("POST /api/orders", error);
    return NextResponse.json({ error: "Failed to create order", details }, { status: 500 });
  }
}
