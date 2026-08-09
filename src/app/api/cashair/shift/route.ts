import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import { getActiveShift, startShift, endShift } from "../../../../modules/cashair/ShiftLedgerEngine";
import { logError } from "../../../../lib/apiError";

import { checkAdminAuthResponse } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const shift = await getActiveShift();
    return NextResponse.json({ success: true, shift }, { status: 200 });
  } catch (error) {
    const details = logError("GET /api/cashair/shift", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch active shift", details },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();

    let body: { cashierName?: string; openingFloat?: number };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    if (!body.cashierName || !body.cashierName.trim()) {
      return NextResponse.json(
        { success: false, error: "cashierName is required" },
        { status: 400 }
      );
    }

    if (body.openingFloat === undefined || body.openingFloat === null || typeof body.openingFloat !== "number" || body.openingFloat < 0) {
      return NextResponse.json(
        { success: false, error: "openingFloat must be a non-negative number" },
        { status: 400 }
      );
    }

    const shift = await startShift(body.cashierName, body.openingFloat);
    return NextResponse.json({ success: true, shift }, { status: 200 });
  } catch (error: any) {
    const details = logError("POST /api/cashair/shift", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start shift", details },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();

    let body: { shiftId?: string; actualCash?: number; notes?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    if (!body.shiftId) {
      return NextResponse.json(
        { success: false, error: "shiftId is required" },
        { status: 400 }
      );
    }

    if (body.actualCash === undefined || body.actualCash === null || typeof body.actualCash !== "number" || body.actualCash < 0) {
      return NextResponse.json(
        { success: false, error: "actualCash must be a non-negative number" },
        { status: 400 }
      );
    }

    const shift = await endShift(body.shiftId, body.actualCash, body.notes);
    return NextResponse.json({ success: true, shift }, { status: 200 });
  } catch (error: any) {
    const details = logError("PUT /api/cashair/shift", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to end shift", details },
      { status: 400 }
    );
  }
}
