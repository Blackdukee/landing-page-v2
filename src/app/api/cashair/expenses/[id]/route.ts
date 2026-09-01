import { NextRequest, NextResponse } from "next/server";
import { ExpensesEngine } from "@/modules/cashair/ExpensesEngine";
import { logError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المصروف مطلوب" },
        { status: 400 }
      );
    }

    const success = await ExpensesEngine.deleteExpense(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "المصروف غير موجود أو تم حذفه مسبقاً" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "تم حذف المصروف بنجاح" });
  } catch (error) {
    const details = logError("DELETE /api/cashair/expenses/[id]", error);
    return NextResponse.json(
      { success: false, error: "فشل حذف المصروف", details },
      { status: 500 }
    );
  }
}
