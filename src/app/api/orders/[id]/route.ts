import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";

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

    // If order status transitioned to "cancelled" (and was not already cancelled), restore stock
    if (
      body.status === "cancelled" &&
      existingOrder.status !== "cancelled" &&
      existingOrder.items &&
      Array.isArray(existingOrder.items)
    ) {
      await Promise.all(
        existingOrder.items.map((item: { productId?: string; quantity?: number }) => {
          if (item.productId && item.quantity && item.quantity > 0) {
            return Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: item.quantity },
            });
          }
          return null;
        })
      );
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

    // Restore stock if deleting an order that was not already cancelled
    if (order.status !== "cancelled" && order.items && Array.isArray(order.items)) {
      await Promise.all(
        order.items.map((item: { productId?: string; quantity?: number }) => {
          if (item.productId && item.quantity && item.quantity > 0) {
            return Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: item.quantity },
            });
          }
          return null;
        })
      );
    }

    return NextResponse.json({ message: "Order deleted and stock restored" });
  } catch (error) {
    const details = logError("DELETE /api/orders/[id]", error);
    return NextResponse.json({ error: "Failed to delete order", details }, { status: 500 });
  }
}
