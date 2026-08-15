import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import { generateFinancialReport, FinancialReportFilter } from "../../../../modules/cashair/FinancialReportsEngine";
import { logError } from "../../../../lib/apiError";

import { checkAdminAuthResponse } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "today") as FinancialReportFilter["period"];
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const source = searchParams.get("source") || undefined;
    const category = searchParams.get("category") || undefined;
    const companyId = searchParams.get("companyId") || searchParams.get("brandId") || undefined;

    const filter: FinancialReportFilter = {
      period,
      startDate,
      endDate,
      source,
      category,
      companyId,
      brandId: companyId,
    };

    const report = await generateFinancialReport(filter);
    return NextResponse.json({ success: true, report }, { status: 200 });
  } catch (error) {
    const details = logError("GET /api/cashair/reports", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate financial report", details },
      { status: 500 }
    );
  }
}
