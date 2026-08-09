import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Company from "@/models/Company";
import ImageKit from "@imagekit/nodejs";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";

// Ensure Company model is registered
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
Company;

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});

/** Fire-and-forget: delete a list of ImageKit fileIds. Errors are logged but never thrown. */
async function deleteFromImageKit(fileIds: string[]): Promise<void> {
  if (!fileIds.length) return;
  const results = await Promise.allSettled(
    fileIds.map((id) => imagekit.files.delete(id))
  );
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    console.warn(`[ImageKit] Failed to delete ${failed.length}/${fileIds.length} file(s).`);
  }
}

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
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Fetch existing product to diff images
    const existing = await Product.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Keep image in sync with images array
    if (body.images && body.images.length > 0 && !body.image) {
      body.image = body.images[0];
    } else if (body.image && (!body.images || body.images.length === 0)) {
      body.images = [body.image];
    }

    // Detect removed image URLs and find their corresponding fileIds to clean up
    if (body.images !== undefined) {
      const newUrls: string[] = body.images ?? [];
      const oldUrls: string[] = existing.images ?? [];
      const oldFileIds: string[] = existing.imageFileIds ?? [];

      const removedFileIds = oldUrls
        .map((url, i) => ({ url, fileId: oldFileIds[i] ?? "" }))
        .filter(({ url, fileId }) => fileId && !newUrls.includes(url))
        .map(({ fileId }) => fileId);

      if (removedFileIds.length) {
        // Fire-and-forget — don't block the response on ImageKit
        deleteFromImageKit(removedFileIds).catch(() => {});
      }

      // Rebuild imageFileIds to stay in sync with new images array
      if (body.imageFileIds !== undefined) {
        // Caller explicitly sent updated fileIds — use those
      } else {
        // Derive from old mapping: keep fileIds whose URL is still present
        body.imageFileIds = newUrls.map((url) => {
          const idx = oldUrls.indexOf(url);
          return idx !== -1 ? (oldFileIds[idx] ?? "") : "";
        });
      }
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

    const product = await Product.findByIdAndUpdate(id, body, { returnDocument: "after" }).populate("company", "name logo");
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const { id } = await params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete all stored images from ImageKit
    const fileIds: string[] = (product.imageFileIds ?? []).filter(Boolean);
    if (fileIds.length) {
      deleteFromImageKit(fileIds).catch(() => {});
    }

    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    const details = logError("DELETE /api/products/[id]", error);
    return NextResponse.json({ error: "Failed to delete product", details }, { status: 500 });
  }
}
