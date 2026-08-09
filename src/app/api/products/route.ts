import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";
import { CatalogEngine } from "@/modules/catalog/CatalogEngine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured") === "true";
    const category = searchParams.get("category") || undefined;
    const company = searchParams.get("company") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "0");

    const result = await CatalogEngine.searchCatalog({
      featured,
      category,
      company,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    const details = logError("GET /api/products", error);
    return NextResponse.json({ error: "Failed to fetch products", details }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const product = await CatalogEngine.createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/products", error);
    return NextResponse.json({ error: "Failed to create product", details }, { status: 500 });
  }
}
