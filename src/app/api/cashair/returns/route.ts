import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import { processReturn, ReturnSaleRequest } from "../../../../modules/cashair/ReturnsRefundEngine";
import { logError } from "../../../../lib/apiError";

import { checkAdminAuthResponse } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();

    let body: ReturnSaleRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    if (!body.orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    if (!body.shiftId) {
      return NextResponse.json(
        { success: false, error: "shiftId is required" },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "items array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (!body.paymentMethod) {
      return NextResponse.json(
        { success: false, error: "paymentMethod is required" },
        { status: 400 }
      );
    }

    const result = await processReturn(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Return processing failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const details = logError("POST /api/cashair/returns", error);
    return NextResponse.json(
      { success: false, error: "Failed to process return", details },
      { status: 500 }
    );
  }
}
