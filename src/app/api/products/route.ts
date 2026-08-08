import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Company from "@/models/Company";
import { logError } from "@/lib/apiError";

// Ensure Company model is registered
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
Company;

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured");
    const category = searchParams.get("category");
    const company = searchParams.get("company");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "0"); // 0 = no limit (backward compat)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (featured === "true") filter.featured = true;
    if (category) filter.category = category;
    if (company) filter.company = company;
    if (search) filter.$text = { $search: search };

    // If no limit requested, return all (for admin, landing page etc.)
    if (!limit) {
      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .populate("company", "name logo")
        .limit(100)
        .lean();
      return NextResponse.json(products);
    }

    // Paginated response
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate("company", "name logo")
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    const details = logError("GET /api/products", error);
    return NextResponse.json({ error: "Failed to fetch products", details }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (body.company) {
      if (typeof body.company === "string" && body.company.trim()) {
        body.company = body.company.trim();
      } else if (typeof body.company === "object" && body.company._id) {
        body.company = body.company._id;
      } else {
        body.company = null;
      }
    } else {
      body.company = null;
    }

    const product = await Product.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/products", error);
    return NextResponse.json({ error: "Failed to create product", details }, { status: 500 });
  }
}
