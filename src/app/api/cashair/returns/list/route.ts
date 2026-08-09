import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { logError } from "@/lib/apiError";

import { checkAdminAuthResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || searchParams.get("search") || "";
    const paymentMethod = searchParams.get("paymentMethod") || "";
    const restock = searchParams.get("restock") || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Query orders that have at least one return record
    const query: any = { "returns.0": { $exists: true } };

    if (search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term, "i");
      query.$or = [
        ...(term.length === 24 ? [{ _id: term }] : []),
        { "returns.returnId": regex },
        { "customerInfo.phone": regex },
        { "customerInfo.name": regex },
      ];
    }

    const ordersWithReturns = await Order.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    const flattenedReturns: any[] = [];
    ordersWithReturns.forEach((order: any) => {
      if (order.returns && Array.isArray(order.returns)) {
        order.returns.forEach((ret: any) => {
          if (paymentMethod && paymentMethod !== "all" && ret.paymentMethod !== paymentMethod) return;
          if (restock === "yes" && !ret.restockToInventory) return;
          if (restock === "no" && ret.restockToInventory) return;

          flattenedReturns.push({
            returnId: ret.returnId || ret._id,
            orderId: order._id.toString(),
            customerName: order.customerInfo?.name || "عميل مباشر",
            customerPhone: order.customerInfo?.phone || "",
            shiftId: ret.shiftId || order.shiftId || "افتراضي",
            items: ret.items || [],
            totalRefunded: ret.totalRefunded || 0,
            paymentMethod: ret.paymentMethod || "cash",
            restockToInventory: !!ret.restockToInventory,
            reason: ret.reason || "مرتجع كاشير",
            createdAt: ret.createdAt || order.updatedAt,
          });
        });
      }
    });

    flattenedReturns.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      returns: flattenedReturns,
      total: flattenedReturns.length,
    });
  } catch (error) {
    const details = logError("GET /api/cashair/returns/list", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch returns list", details },
      { status: 500 }
    );
  }
}
