import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../lib/mongodb";
import Product from "../../../../models/Product";
import Company from "../../../../models/Company";
import { logError } from "../../../../lib/apiError";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const company = searchParams.get("company") || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const query: any = {};

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: regex },
        { barcode: regex },
        { category: regex },
        { description: regex },
      ];
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (company && company !== "all") {
      query.company = company;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("company", "name logo")
        .sort({ name: 1 })
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        products,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    const details = logError("GET /api/cashair/products", error);
    return NextResponse.json(
      { success: false, error: "Failed to search products catalog", details },
      { status: 500 }
    );
  }
}
