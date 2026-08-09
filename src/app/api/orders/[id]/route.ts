import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";
import { InventoryEngine } from "@/modules/inventory/InventoryEngine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    const details = logError("GET /api/orders/[id]", error);
    return NextResponse.json({ error: "Failed to fetch order", details }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const existingOrder = await Order.findById(id).lean();
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, body, { returnDocument: "after" });

    // If order status transitioned to "cancelled", release stock atomically through InventoryEngine
    if (
      body.status === "cancelled" &&
      existingOrder.status !== "cancelled" &&
      existingOrder.items &&
      Array.isArray(existingOrder.items)
    ) {
      const releaseItems = existingOrder.items
        .filter((item: { productId?: string; quantity?: number }) => item.productId && item.quantity && item.quantity > 0)
        .map((item: { productId: string; quantity: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

      await InventoryEngine.releaseStock(releaseItems);
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    const details = logError("PUT /api/orders/[id]", error);
    return NextResponse.json({ error: "Failed to update order", details }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const { id } = await params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Release stock atomically if deleting an order that was not already cancelled
    if (order.status !== "cancelled" && order.items && Array.isArray(order.items)) {
      const releaseItems = order.items
        .filter((item: { productId?: string; quantity?: number }) => item.productId && item.quantity && item.quantity > 0)
        .map((item: { productId: string; quantity: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));

      await InventoryEngine.releaseStock(releaseItems);
    }

    return NextResponse.json({ message: "Order deleted and stock restored" });
  } catch (error) {
    const details = logError("DELETE /api/orders/[id]", error);
    return NextResponse.json({ error: "Failed to delete order", details }, { status: 500 });
  }
}
