import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Category from "@/models/Category";
import { logError } from "@/lib/apiError";

// GET all categories
export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find().sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error) {
    const details = logError("GET /api/categories", error);
    return NextResponse.json({ error: "Failed to fetch categories", details }, { status: 500 });
  }
}

// POST create a new category
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const name = (body.name || "").trim();
    const description = (body.description || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    let slug = name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      slug = `category-${Date.now()}`;
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const category = await Category.create({ name, slug, description });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const details = logError("POST /api/categories", error);
    return NextResponse.json({ error: "Failed to create category", details }, { status: 500 });
  }
}
