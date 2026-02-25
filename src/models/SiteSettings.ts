import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPriceRange {
  label: string;
  labelAr: string;
  min: number;
  max: number | null; // null means Infinity
}

export interface ISiteSettings extends Document {
  websiteName: string;
  whatsappNumber: string;
  priceRangeFilters: IPriceRange[];
  heroProduct: string | null; // Product _id to feature in hero section
  createdAt: Date;
  updatedAt: Date;
}

const PriceRangeSchema = new Schema<IPriceRange>(
  {
    label: { type: String, required: true },
    labelAr: { type: String, required: true },
    min: { type: Number, required: true, default: 0 },
    max: { type: Number, default: null },
  },
  { _id: false }
);

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    websiteName: { type: String, default: "QuesnaShop" },
    whatsappNumber: { type: String, default: "+201025571092" },
    heroProduct: { type: String, default: null },
    priceRangeFilters: {
      type: [PriceRangeSchema],
      default: [
        { label: "Under $25", labelAr: "أقل من 25$", min: 0, max: 25 },
        { label: "$25 - $50", labelAr: "25$ - 50$", min: 25, max: 50 },
        { label: "$50 - $100", labelAr: "50$ - 100$", min: 50, max: 100 },
        { label: "$100 - $200", labelAr: "100$ - 200$", min: 100, max: 200 },
        { label: "$200+", labelAr: "+200$", min: 200, max: null },
      ],
    },
  },
  { timestamps: true }
);

// Delete cached model to pick up schema changes during dev hot-reload
if (mongoose.models.SiteSettings) {
  delete mongoose.models.SiteSettings;
}

const SiteSettings: Model<ISiteSettings> =
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
