import ImageKit from "@imagekit/nodejs";
import type { File as ImageKitFile } from "@imagekit/nodejs/resources/files/files";
import { createHash } from "crypto";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let sharpInstance: any = null;
function getSharp() {
  if (sharpInstance) return sharpInstance;
  try {
    sharpInstance = require("sharp");
    return sharpInstance;
  } catch (err) {
    console.warn("[MediaPipeline] Sharp could not be loaded, using raw buffer fallback:", err);
    return null;
  }
}

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
    let uploadExt: string = isIco ? ".ico" : isSvg ? ".svg" : ".webp";

    if (isSvg) {
      uploadBuffer = rawBuffer;
      uploadExt = ".svg";
    } else if (isIco) {
      uploadBuffer = rawBuffer;
      uploadExt = ".ico";
    } else {
      try {
        const sharp = await getSharp();
        if (sharp) {
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
          uploadExt = ".webp";
        }
      } catch (sharpError) {
        console.warn("[MediaPipeline] Sharp optimization fallback to raw buffer:", sharpError);
        uploadBuffer = rawBuffer;
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
   * Process and save website favicon/icon directly to the public directory.
   */
  savePublicFavicon: async (file: File): Promise<MediaUploadResult> => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File too large. Maximum size is 5MB");
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);
    const fs = await import("fs/promises");
    const path = await import("path");

    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    const isIco =
      file.type === "image/x-icon" ||
      file.type === "image/vnd.microsoft.icon" ||
      file.name.toLowerCase().endsWith(".ico");

    const publicDir = path.join(process.cwd(), "public");

    let finalBuffer: Buffer = rawBuffer;
    const sharp = await getSharp();

    if (!isSvg && !isIco && sharp) {
      try {
        finalBuffer = await sharp(rawBuffer, { failOn: "none" })
          .rotate()
          .toColorspace("srgb")
          .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png({ compressionLevel: 9 })
          .toBuffer();
      } catch (err) {
        console.warn("[MediaPipeline] Favicon sharp processing fallback:", err);
      }
    }

    const fileName = isSvg ? "favicon.svg" : isIco ? "favicon.ico" : "favicon.png";
    const filePath = path.join(publicDir, fileName);

    await fs.writeFile(filePath, finalBuffer);

    // Also update icon.png & apple-touch-icon.png if PNG for complete device coverage
    if (!isSvg && !isIco) {
      try {
        await fs.writeFile(path.join(publicDir, "icon.png"), finalBuffer);
        await fs.writeFile(path.join(publicDir, "apple-touch-icon.png"), finalBuffer);
      } catch {
        // Ignore secondary file write errors
      }
    }

    const timestamp = Date.now();
    const publicUrl = `/${fileName}?v=${timestamp}`;

    return {
      url: publicUrl,
      fileId: "public_favicon",
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
