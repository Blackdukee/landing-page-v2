import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";

// PUT update a category
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const name = (body.name || "").trim();
    const description = (body.description || "").trim();
    const icon = (body.icon || "").trim();

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

    // Check if another category already has this slug
    const existing = await Category.findOne({ slug, _id: { $ne: id } }).lean();
    if (existing) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
    }

    // Get old category name before update
    const oldCategory = await Category.findById(id).lean();
    const oldName = oldCategory?.name;

    const category = await Category.findByIdAndUpdate(
      id,
      { name, slug, description, icon },
      { returnDocument: 'after' }
    );

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Cascade: update all products that had the old category name
    if (oldName && oldName !== name) {
      await Product.updateMany({ category: oldName }, { category: name });
    }

    return NextResponse.json(category);
  } catch (error) {
    const details = logError("PUT /api/categories/[id]", error);
    return NextResponse.json({ error: "Failed to update category", details }, { status: 500 });
  }
}

// DELETE a category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const { id } = await params;
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "reassign"; // "reassign" or "delete"

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Handle orphaned products
    if (action === "delete") {
      await Product.deleteMany({ category: category.name });
    } else {
      // Default: reassign to "General"
      await Product.updateMany({ category: category.name }, { category: "General" });
      // Ensure "General" category exists
      const generalExists = await Category.findOne({ slug: "general" });
      if (!generalExists) {
        await Category.create({ name: "General", slug: "general", description: "" });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const details = logError("DELETE /api/categories/[id]", error);
    return NextResponse.json({ error: "Failed to delete category", details }, { status: 500 });
  }
}
