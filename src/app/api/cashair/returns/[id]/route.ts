import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { cancelReturnRecord } from "@/modules/cashair/ReturnsRefundEngine";
import { logError } from "@/lib/apiError";

import { checkAdminAuthResponse } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const { id } = await params;

    const result = await cancelReturnRecord(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Return record or order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Return record cancelled successfully" });
  } catch (error) {
    const details = logError("DELETE /api/cashair/returns/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete return record", details },
      { status: 500 }
    );
  }
}
