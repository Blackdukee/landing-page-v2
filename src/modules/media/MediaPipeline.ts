import ImageKit from "@imagekit/nodejs";
import type { File as ImageKitFile } from "@imagekit/nodejs/resources/files/files";
import { createHash } from "crypto";
import sharp from "sharp";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "dummy_private_key_for_build",
});

export interface MediaUploadResult {
  url: string;
  fileId: string;
  width?: number;
  height?: number;
  reused?: boolean;
}

export interface MediaDeleteResult {
  deleted: number;
  failed: number;
}

/**
 * Deep Media Pipeline Module:
 * Handles image validation, sharp color space normalization & WebP encoding,
 * content-hash deduplication, and storage adapter uploads.
 */
export const MediaPipeline = {
  /**
   * Process and upload a file to ImageKit CDN with automatic Sharp optimization.
   */
  processAndUpload: async (file: File): Promise<MediaUploadResult> => {
    // 1. Validate file size (max 4MB for Vercel Hobby limits)
    if (file.size > 4 * 1024 * 1024) {
      throw new Error("File too large. Maximum size is 4MB");
    }

    const isIco =
      file.type === "image/x-icon" ||
      file.type === "image/vnd.microsoft.icon" ||
      file.name.toLowerCase().endsWith(".ico");

    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/x-icon",
      "image/vnd.microsoft.icon",
    ];

    if (!allowedTypes.includes(file.type) && !isIco && !isSvg) {
      throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG, ICO");
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // 2. Pre-process with Sharp (skip SVG & ICO)
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
        uploadBuffer = await sharp(rawBuffer, {
          failOn: "none",
          unlimited: true,
        })
          .rotate() // Auto-orient from EXIF first
          .toColorspace("srgb") // Convert any exotic/CMYK/Display-P3 or corrupt profiles to sRGB
          .resize(800, 800, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 82, effort: 6, smartSubsample: true })
          .toBuffer();
        uploadMime = "image/webp";
        uploadExt = ".webp";
      } catch (sharpError) {
        console.warn("[MediaPipeline] Sharp optimization fallback to raw buffer:", sharpError);
        uploadBuffer = rawBuffer;
        uploadMime = file.type;
        uploadExt = file.name.slice(file.name.lastIndexOf(".")) || ".png";
      }
    }

    // 3. Compute MD5 content hash for deduplication
    const contentHash = createHash("md5").update(uploadBuffer).digest("hex");
    const urlEndpoint = (process.env.IMAGEKIT_URL_ENDPOINT || "").replace(/\/$/, "");

    // 4. Check for existing asset by hash
    try {
      const existing = await imagekit.assets.list({
        searchQuery: `tags IN ["${contentHash}"]`,
        path: "/novashop/products",
        limit: 1,
      });

      if (Array.isArray(existing) && existing.length > 0) {
        const found = existing[0] as ImageKitFile;
        const directUrl = `${urlEndpoint}${found.filePath}`;
        return {
          url: directUrl,
          fileId: found.fileId || "",
          width: found.width,
          height: found.height,
          reused: true,
        };
      }
    } catch {
      // Proceed with upload if search fails
    }

    // 5. Sanitize filename & upload to ImageKit
    const safeName =
      file.name
        .toLowerCase()
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80) + uploadExt;

    const base64 = uploadBuffer.toString("base64");
    const result = await imagekit.files.upload({
      file: base64,
      fileName: safeName,
      folder: "/novashop/products",
      tags: [contentHash],
    });

    const directUrl = `${urlEndpoint}${result.filePath}`;

    return {
      url: directUrl,
      fileId: result.fileId || "",
      width: result.width,
      height: result.height,
    };
  },

  /**
   * Delete files from ImageKit storage by IDs.
   */
  deleteFiles: async (fileIds: string[]): Promise<MediaDeleteResult> => {
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      throw new Error("No fileIds provided");
    }

    const results = await Promise.allSettled(
      fileIds.map((id) => imagekit.files.delete(id))
    );

    const deleted = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return { deleted, failed };
  },
};
