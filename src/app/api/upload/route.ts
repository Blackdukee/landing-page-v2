import { NextResponse } from "next/server";
import ImageKit from "@imagekit/nodejs";
import type { File as ImageKitFile } from "@imagekit/nodejs/resources/files/files";
import { createHash } from "crypto";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Compute content hash for deduplication
    const contentHash = createHash("md5").update(buffer).digest("hex");

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
        const optimizedUrl = `${urlEndpoint}/tr:w-600,h-600,c-maintain_ratio,fo-auto,f-auto,q-auto${found.filePath}`;
        return NextResponse.json({
          url: optimizedUrl,
          fileId: found.fileId,
          width: found.width,
          height: found.height,
          reused: true,
        });
      }
    } catch {
      // If search fails, proceed with upload
    }

    // Upload image to ImageKit with content hash as tag
    const result = await imagekit.files.upload({
      file: base64,
      fileName: file.name || "upload.jpg",
      folder: "/novashop/products",
      tags: [contentHash],
    });

    // Build optimized delivery URL (auto format + auto quality + 600x600)
    const optimizedUrl = `${urlEndpoint}/tr:w-600,h-600,c-maintain_ratio,fo-auto,f-auto,q-auto${result.filePath}`;

    return NextResponse.json({
      url: optimizedUrl,
      fileId: result.fileId,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
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
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Delete failed." },
      { status: 500 }
    );
  }
}
