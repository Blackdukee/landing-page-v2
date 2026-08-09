import { NextRequest, NextResponse } from "next/server";
import ImageKit from "@imagekit/nodejs";
import type { File as ImageKitFile } from "@imagekit/nodejs/resources/files/files";
import { createHash } from "crypto";
import sharp from "sharp";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";

// Vercel Hobby: 10s max, must use Node.js runtime (sharp needs native binaries)
export const runtime = "nodejs";
export const maxDuration = 10;

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "dummy_private_key_for_build",
});

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (supports standard web images, SVGs, and favicon ICO files)
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/x-icon",
      "image/vnd.microsoft.icon",
    ];

    const isIco =
      file.type === "image/x-icon" ||
      file.type === "image/vnd.microsoft.icon" ||
      file.name.toLowerCase().endsWith(".ico");

    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

    if (!allowedTypes.includes(file.type) && !isIco && !isSvg) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG, ICO" },
        { status: 400 }
      );
    }

    // Validate file size — Vercel Hobby caps request bodies at 4.5MB total,
    // so we enforce 4MB here to leave room for multipart form overhead.
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 4MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // --- Pre-process with sharp (skip SVGs & ICO icons — upload as-is) ---
    let uploadBuffer: Buffer = rawBuffer;
    let uploadMime: string = file.type || (isIco ? "image/x-icon" : "image/png");
    let uploadExt: string = isIco ? ".ico" : isSvg ? ".svg" : ".webp";

    if (isSvg) {
      uploadBuffer = rawBuffer;
      uploadMime = "image/svg+xml";
      uploadExt = ".svg";
    } else if (isIco) {
      uploadBuffer = rawBuffer;
      uploadMime = "image/x-icon";
      uploadExt = ".ico";
    } else {
      try {
        // Robust color normalization: auto-rotate first, convert to standard sRGB, resize, and compress
        uploadBuffer = await sharp(rawBuffer, {
          failOn: "none",
          unlimited: true,
        })
          .rotate() // Auto-orient from EXIF first
          .toColorspace("srgb") // Convert any exotic/CMYK/Display-P3 or corrupt profiles to standard sRGB
          .resize(800, 800, {
            fit: "inside", // Never crops, never upscales
            withoutEnlargement: true,
          })
          .webp({ quality: 82, effort: 6, smartSubsample: true }) // High-efficiency WebP compression
          .toBuffer();
        uploadMime = "image/webp";
        uploadExt = ".webp";
      } catch (sharpError) {
        console.warn("[Upload] Sharp optimization fallback to raw buffer:", sharpError);
        uploadBuffer = rawBuffer;
        uploadMime = file.type;
        uploadExt = file.name.slice(file.name.lastIndexOf(".")) || ".png";
      }
    }

    // Compute content hash of the processed buffer for deduplication
    const contentHash = createHash("md5").update(uploadBuffer).digest("hex");

    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT!.replace(/\/$/, "");

    // Check if an image with this hash already exists in ImageKit
    try {
      const existing = await imagekit.assets.list({
        searchQuery: `tags IN ["${contentHash}"]`,
        path: "/novashop/products",
        limit: 1,
      });

      if (Array.isArray(existing) && existing.length > 0) {
        const found = existing[0] as ImageKitFile;
        // No /tr: needed — file is already optimized at upload time
        const directUrl = `${urlEndpoint}${found.filePath}`;
        return NextResponse.json({
          url: directUrl,
          fileId: found.fileId,
          width: found.width,
          height: found.height,
          reused: true,
        });
      }
    } catch {
      // If search fails, proceed with upload
    }

    // Sanitize filename and apply correct extension
    const safeName =
      file.name
        .toLowerCase()
        .replace(/\.[^.]+$/, "")          // strip original extension
        .replace(/[^a-z0-9_-]/g, "-")     // replace special chars
        .replace(/-+/g, "-")
        .slice(0, 80) + uploadExt;

    // Upload the pre-optimized buffer (no transformation needed at delivery)
    const base64 = uploadBuffer.toString("base64");
    const result = await imagekit.files.upload({
      file: base64,
      fileName: safeName,
      folder: "/novashop/products",
      tags: [contentHash],
    });

    // Return the plain CDN URL — file is already sized & compressed
    const directUrl = `${urlEndpoint}${result.filePath}`;

    return NextResponse.json({
      url: directUrl,
      fileId: result.fileId,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    const details = logError("POST /api/upload", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again.", details },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { fileIds } = await req.json();

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: "No fileIds provided" }, { status: 400 });
    }

    const results = await Promise.allSettled(
      fileIds.map((id: string) => imagekit.files.delete(id))
    );

    const deleted = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ deleted, failed });
  } catch (error) {
    const details = logError("DELETE /api/upload", error);
    return NextResponse.json(
      { error: "Delete failed.", details },
      { status: 500 }
    );
  }
}
