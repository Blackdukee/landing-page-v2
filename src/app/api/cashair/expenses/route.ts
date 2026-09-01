import { NextRequest, NextResponse } from "next/server";
import { ExpensesEngine } from "@/modules/cashair/ExpensesEngine";
import { logError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const paymentSource = searchParams.get("paymentSource") || undefined;
    const dateRange = (searchParams.get("dateRange") as any) || undefined;
    const shiftId = searchParams.get("shiftId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    const data = await ExpensesEngine.getExpensesSummary({
      search,
      category,
      paymentSource,
      dateRange,
      shiftId,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    const details = logError("GET /api/cashair/expenses", error);
    return NextResponse.json(
      { success: false, error: "فشل استرجاع سجل المصروفات", details },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      amount,
      category,
      paymentSource,
      paidTo,
      receiptNumber,
      notes,
      performedBy,
      shiftId,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة عنوان أو بيان المصروف" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "المبلغ يجب أن يكون قيمة رقمية موجبة" },
        { status: 400 }
      );
    }

    const expense = await ExpensesEngine.recordExpense({
      title: title.trim(),
      amount: numAmount,
      category,
      paymentSource,
      paidTo: paidTo ? String(paidTo).trim() : undefined,
      receiptNumber: receiptNumber ? String(receiptNumber).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      performedBy: performedBy ? String(performedBy).trim() : undefined,
      shiftId: shiftId ? String(shiftId).trim() : undefined,
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/cashair/expenses", error);
    return NextResponse.json(
      { success: false, error: "فشل تسجيل المصروف", details },
      { status: 500 }
    );
  }
}
