import { NextRequest, NextResponse } from "next/server";
import { InstaPayLedgerEngine } from "@/modules/cashair/InstaPayLedgerEngine";
import { logError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const category = searchParams.get("category") || undefined;
    const dateRange = (searchParams.get("dateRange") as any) || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const data = await InstaPayLedgerEngine.getLedgerSummary({
      search,
      type,
      category,
      dateRange,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    const details = logError("GET /api/cashair/instapay", error);
    return NextResponse.json(
      { success: false, error: "فشل استرجاع بيانات إنستا باي", details },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, amount, description, category, referenceNumber, performedBy, shiftId } = body;

    if (!type || !["deposit", "withdrawal", "adjustment"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "نوع العملية غير صحيح (إيداع أو سحب أو تسوية)" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "المبلغ يجب أن يكون قيمة رقمية أكبر من صفر" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة سبب أو بيان العملية" },
        { status: 400 }
      );
    }

    const transaction = await InstaPayLedgerEngine.recordTransaction({
      type,
      amount: numAmount,
      description: description.trim(),
      category,
      referenceNumber: referenceNumber ? String(referenceNumber).trim() : undefined,
      performedBy: (performedBy || "الكاشير").trim(),
      shiftId: shiftId ? String(shiftId) : undefined,
    });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/cashair/instapay", error);
    return NextResponse.json(
      { success: false, error: "فشل تسجيل حركة إنستا باي", details },
      { status: 500 }
    );
  }
}
