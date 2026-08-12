import mongoose, { Schema, Document, Model } from "mongoose";
import "./Product";
import "./User";

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
  image: string;
}

export interface IOrderItemAdjustment {
  productId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  stacked: boolean;
  basePrice: number;
  costPrice?: number;
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

export interface IOrderReturnItem {
  productId: string;
  quantity: number;
  refundAmount: number;
}

export interface IOrderReturnRecord {
  returnId: string;
  shiftId: string;
  items: IOrderReturnItem[];
  totalRefunded: number;
  paymentMethod: string;
  restockToInventory: boolean;
  reason?: string;
  createdAt?: Date;
}

export interface IOrder extends Document {
  customerInfo: ICustomerInfo;
  items: IOrderItem[];
  totalPrice: number;
  discountDetails?: IOrderDiscountDetails;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned" | "partially_returned";
  source?: string;
  paymentMethod?: string;
  shiftId?: string;
  returns?: IOrderReturnRecord[];
  totalRefunded?: number;
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
        costPrice: { type: Number, default: 0 },
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
          costPrice: { type: Number, default: 0 },
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
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned", "partially_returned"],
      default: "pending",
    },
    source: { type: String, default: "online" },
    paymentMethod: { type: String, default: "cash" },
    shiftId: { type: String },
    totalRefunded: { type: Number, default: 0 },
    returns: [
      {
        returnId: { type: String },
        shiftId: { type: String },
        items: [
          {
            productId: { type: String },
            quantity: { type: Number },
            refundAmount: { type: Number },
          },
        ],
        totalRefunded: { type: Number },
        paymentMethod: { type: String },
        restockToInventory: { type: Boolean },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes for common query patterns (admin dashboard listing)
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
