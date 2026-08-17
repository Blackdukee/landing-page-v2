import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import SiteSettings from "@/models/SiteSettings";
import { logError } from "@/lib/apiError";
import { checkAdminAuthResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper function to normalize WhatsApp number to +201234567890 format
const normalizeWhatsAppNumber = (input: string): string => {
  let number = input.trim().replace(/\s/g, "");
  
  // Remove + if present
  if (number.startsWith("+")) {
    number = number.substring(1);
  }
  
  // Convert 01234567890 to 201234567890
  if (number.startsWith("0")) {
    number = "2" + number.substring(1);
  }
  
  // Ensure it starts with 20 (Egypt country code)
  if (!number.startsWith("20")) {
    if (number.startsWith("1")) {
      number = "2" + number;
    }
  }
  
  // Add + prefix
  return "+" + number;
};

// Helper to get or create the singleton settings document (returns plain object)
async function getSettings() {
  let settings = await SiteSettings.findOne().populate("dailyOffers.productId").lean();
  if (!settings) {
    const doc = await SiteSettings.create({});
    settings = await SiteSettings.findById(doc._id).populate("dailyOffers.productId").lean();
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
    const details = logError("GET /api/settings", error);
    return NextResponse.json(
      { error: "Failed to fetch settings", details },
      { status: 500 }
    );
  }
}

// PUT — admin only, updates site settings
export async function PUT(req: NextRequest) {
  const authErr = checkAdminAuthResponse(req);
  if (authErr) return authErr;

  try {
    await dbConnect();
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (typeof body.websiteName === "string" && body.websiteName.trim()) {
      update.websiteName = body.websiteName.trim();
    }

    if (typeof body.location === "string") {
      update.location = body.location.trim();
    }

    if (typeof body.whatsappNumber === "string" && body.whatsappNumber.trim()) {
      update.whatsappNumber = normalizeWhatsAppNumber(body.whatsappNumber);
    }

    if (typeof body.favicon === "string") {
      update.favicon = body.favicon.trim();
    }

    if (typeof body.freeDeliveryMinPrice === "number" && body.freeDeliveryMinPrice >= 0) {
      update.freeDeliveryMinPrice = body.freeDeliveryMinPrice;
    }

    if (typeof body.shippingCost === "number" && body.shippingCost >= 0) {
      update.shippingCost = body.shippingCost;
    }

    if (typeof body.returnDays === "number" && body.returnDays >= 0) {
      update.returnDays = Math.round(body.returnDays);
    }

    if ("heroProduct" in body) {
      update.heroProduct = typeof body.heroProduct === "string" && body.heroProduct.trim()
        ? body.heroProduct.trim()
        : null;
    }

    if (body.socialLinks && typeof body.socialLinks === "object") {
      const sl = body.socialLinks as Record<string, unknown>;
      const socialLinks: Record<string, string> = {};
      if (typeof sl.instagram === "string") socialLinks.instagram = sl.instagram.trim();
      if (typeof sl.facebook === "string") socialLinks.facebook = sl.facebook.trim();
      if (typeof sl.twitter === "string") socialLinks.twitter = sl.twitter.trim();
      if (typeof sl.email === "string") socialLinks.email = sl.email.trim();
      update.socialLinks = socialLinks;
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

    if (Array.isArray(body.dailyOffers)) {
      const dailyOffers = body.dailyOffers
        .filter(
          (item: any) =>
            item &&
            (item.productId || (item.productId && item.productId._id)) &&
            typeof item.discountPercentage === "number" &&
            item.discountPercentage >= 1 &&
            item.discountPercentage <= 90
        )
        .map((item: any) => {
          const rawId = typeof item.productId === "object" && item.productId?._id ? item.productId._id : item.productId;
          const offer: Record<string, any> = {
            productId: mongoose.Types.ObjectId.isValid(String(rawId))
              ? new mongoose.Types.ObjectId(String(rawId))
              : rawId,
            discountPercentage: Math.min(90, Math.max(1, Math.round(item.discountPercentage))),
            active: typeof item.active === "boolean" ? item.active : true,
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
          };
          if (item._id) {
            offer._id = item._id;
          }
          return offer;
        });
      update.dailyOffers = dailyOffers;
    }

    let settings = await SiteSettings.findOne().lean();
    if (!settings) {
      const doc = await SiteSettings.create(update);
      settings = await SiteSettings.findById(doc._id).populate("dailyOffers.productId").lean();
    } else {
      await SiteSettings.findOneAndUpdate({}, { $set: update }, { returnDocument: 'after' });
      settings = await SiteSettings.findOne().populate("dailyOffers.productId").lean();
    }

    return NextResponse.json(settings);
  } catch (error) {
    const details = logError("PUT /api/settings", error);
    return NextResponse.json(
      { error: "Failed to update settings", details },
      { status: 500 }
    );
  }
}
