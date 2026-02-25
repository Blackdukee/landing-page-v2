import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";

// Helper to get or create the singleton settings document
async function getSettings() {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  return settings;
}

// GET — public, returns site settings
export async function GET() {
  try {
    await dbConnect();
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT — admin only, updates site settings
export async function PUT(req: NextRequest) {
  try {
    // Check admin auth
    const token = req.cookies.get("admin-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const user = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (typeof body.websiteName === "string" && body.websiteName.trim()) {
      update.websiteName = body.websiteName.trim();
    }

    if (typeof body.whatsappNumber === "string" && body.whatsappNumber.trim()) {
      update.whatsappNumber = body.whatsappNumber.trim();
    }

    if ("heroProduct" in body) {
      update.heroProduct = typeof body.heroProduct === "string" && body.heroProduct.trim()
        ? body.heroProduct.trim()
        : null;
    }

    if (Array.isArray(body.priceRangeFilters)) {
      // Validate each filter
      const filters = body.priceRangeFilters
        .filter(
          (f: { label?: string; labelAr?: string; min?: number; max?: number | null }) =>
            f.label && f.labelAr && typeof f.min === "number"
        )
        .map((f: { label: string; labelAr: string; min: number; max: number | null }) => ({
          label: f.label.trim(),
          labelAr: f.labelAr.trim(),
          min: f.min,
          max: f.max,
        }));
      update.priceRangeFilters = filters;
    }

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create(update);
    } else {
      settings = await SiteSettings.findOneAndUpdate({}, { $set: update }, { new: true });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
