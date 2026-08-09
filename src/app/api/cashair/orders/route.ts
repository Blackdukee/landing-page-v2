import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "../../../../lib/mongodb";
import Order from "../../../../models/Order";
import { logError } from "../../../../lib/apiError";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || searchParams.get("search") || searchParams.get("query") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query: any = {};

    if (search.trim()) {
      const term = search.trim();
      if (mongoose.Types.ObjectId.isValid(term) && term.length === 24) {
        query._id = term;
      } else {
        const regex = new RegExp(term, "i");
        query.$or = [
          { "customerInfo.phone": regex },
          { "customerInfo.name": regex },
        ];
      }
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (source && source !== "all") {
      if (source === "pos") {
        query.source = "pos";
      } else {
        // Online / Web orders: anything that is not a POS sale
        query.source = { $ne: "pos" };
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        orders,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    const details = logError("GET /api/cashair/orders", error);
    return NextResponse.json(
      { success: false, error: "Failed to search orders", details },
      { status: 500 }
    );
  }
}
