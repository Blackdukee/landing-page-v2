import mongoose, { Schema, Document, Model } from "mongoose";
import "./Company";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  image: string;
  images: string[];
  /** ImageKit fileIds parallel to the `images` array — used to delete from ImageKit on removal */
  imageFileIds: string[];
  stock: number;
  category: string;
  company?: mongoose.Types.ObjectId | string | null;
  featured: boolean;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    costPrice: { type: Number, default: 0 },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    imageFileIds: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, required: true, default: "عام" },
    company: { type: Schema.Types.ObjectId, ref: "Company", default: null },
    featured: { type: Boolean, default: false },
    barcode: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// Indexes for common query patterns
ProductSchema.index({ featured: 1, createdAt: -1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ company: 1 });
ProductSchema.index({ barcode: 1 });
ProductSchema.index({ name: "text" });

// Keep `image` in sync: when saving, if images array has entries but image is
// empty, populate image from the first element; conversely if image is set but
// images is empty, seed images from image.
ProductSchema.pre("save", function () {
  if (this.images.length > 0 && !this.image) {
    this.image = this.images[0];
  } else if (this.image && this.images.length === 0) {
    this.images = [this.image];
  }
});

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
