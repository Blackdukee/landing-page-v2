import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Company from "@/models/Company";
import { logError } from "@/lib/apiError";

// Ensure Company model is registered
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
Company;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const product = await Product.findById(id).populate("company", "name logo").lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    const details = logError("GET /api/products/[id]", error);
    return NextResponse.json({ error: "Failed to fetch product", details }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Keep image in sync with images array
    if (body.images && body.images.length > 0 && !body.image) {
      body.image = body.images[0];
    } else if (body.image && (!body.images || body.images.length === 0)) {
      body.images = [body.image];
    }

    if ("company" in body) {
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
    }

    const product = await Product.findByIdAndUpdate(id, body, { returnDocument: 'after' }).populate("company", "name logo");
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Sync: ensure the category exists in the Category collection
    if (body.category) {
      const existingCat = await Category.findOne({ name: body.category });
      if (!existingCat) {
        let slug = body.category
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, "-")
          .replace(/^-|-$/g, "");
        if (!slug) slug = `category-${Date.now()}`;
        await Category.create({ name: body.category, slug, description: "" });
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    const details = logError("PUT /api/products/[id]", error);
    return NextResponse.json({ error: "Failed to update product", details }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    const details = logError("DELETE /api/products/[id]", error);
    return NextResponse.json({ error: "Failed to delete product", details }, { status: 500 });
  }
}
