import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IOrderItemAdjustment {
  productId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  stacked: boolean;
  basePrice: number;
  priorPrice: number;
  finalPrice: number;
}

export interface IOrderDiscountDetails {
  itemAdjustments: IOrderItemAdjustment[];
  orderDiscountType?: "percentage" | "fixed" | null;
  orderDiscountValue?: number;
  originalTotal: number;
  finalTotal: number;
}

export interface ICustomerInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface IOrder extends Document {
  customerInfo: ICustomerInfo;
  items: IOrderItem[];
  totalPrice: number;
  discountDetails?: IOrderDiscountDetails;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerInfo: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      notes: { type: String },
    },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String },
      },
    ],
    totalPrice: { type: Number, required: true },
    discountDetails: {
      itemAdjustments: [
        {
          productId: { type: String },
          discountType: { type: String, enum: ["percentage", "fixed"] },
          discountValue: { type: Number },
          stacked: { type: Boolean },
          basePrice: { type: Number },
          priorPrice: { type: Number },
          finalPrice: { type: Number },
        },
      ],
      orderDiscountType: { type: String, enum: ["percentage", "fixed"], default: null },
      orderDiscountValue: { type: Number },
      originalTotal: { type: Number },
      finalTotal: { type: Number },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes for common query patterns (admin dashboard listing)
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
