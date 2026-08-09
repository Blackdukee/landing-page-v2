import ImageKit from "@imagekit/nodejs";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "dummy_private_key_for_build",
});

/**
 * Fire-and-forget adapter to delete a list of ImageKit fileIds.
 * Errors are caught and logged, never blocking callers.
 */
export async function deleteMediaFiles(fileIds: string[]): Promise<void> {
  const validFileIds = fileIds.filter(Boolean);
  if (!validFileIds.length) return;

  try {
    const results = await Promise.allSettled(
      validFileIds.map((id) => imagekit.files.delete(id))
    );
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) {
      console.warn(`[MediaStorageAdapter] Failed to delete ${failed.length}/${validFileIds.length} file(s).`);
    }
  } catch (err) {
    console.warn("[MediaStorageAdapter] Exception during media file deletion:", err);
  }
}
