import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { logError } from "@/lib/apiError";

export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find().sort({ createdAt: -1 });
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
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/orders", error);
    return NextResponse.json({ error: "Failed to create order", details }, { status: 500 });
  }
}
