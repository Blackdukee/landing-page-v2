import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, required: true, default: "General" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
