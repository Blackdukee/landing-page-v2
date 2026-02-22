import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (featured === "true") filter.featured = true;
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const product = await Product.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
