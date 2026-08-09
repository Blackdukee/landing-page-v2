import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";
import { MediaPipeline } from "@/modules/media/MediaPipeline";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await MediaPipeline.processAndUpload(file);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message.includes("too large") || message.includes("Invalid file type") ? 400 : 500;
    const details = logError("POST /api/upload", error);
    return NextResponse.json({ error: message, details }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { fileIds } = await req.json();
    const result = await MediaPipeline.deleteFiles(fileIds);
    return NextResponse.json(result);
  } catch (error) {
    const details = logError("DELETE /api/upload", error);
    return NextResponse.json({ error: "Delete failed.", details }, { status: 500 });
  }
}
