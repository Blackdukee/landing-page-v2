import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInstaPayTransaction extends Document {
  type: "sale" | "deposit" | "withdrawal" | "refund" | "adjustment";
  amount: number;
  runningBalance: number;
  description: string;
  category:
    | "sales"
    | "supplier_payment"
    | "expense"
    | "bank_transfer"
    | "owner_withdrawal"
    | "deposit"
    | "refund"
    | "other";
  referenceNumber?: string;
  performedBy: string;
  shiftId?: string;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstaPayTransactionSchema = new Schema<IInstaPayTransaction>(
  {
    type: {
      type: String,
      enum: ["sale", "deposit", "withdrawal", "refund", "adjustment"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    runningBalance: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "sales",
        "supplier_payment",
        "expense",
        "bank_transfer",
        "owner_withdrawal",
        "deposit",
        "refund",
        "other",
      ],
      default: "other",
    },
    referenceNumber: { type: String, trim: true },
    performedBy: { type: String, required: true, trim: true, default: "الكاشير" },
    shiftId: { type: String },
    orderId: { type: String },
  },
  { timestamps: true }
);

// Indexes for high-performance timeline queries and category filtering
InstaPayTransactionSchema.index({ createdAt: -1 });
InstaPayTransactionSchema.index({ type: 1 });
InstaPayTransactionSchema.index({ category: 1 });

const InstaPayTransaction: Model<IInstaPayTransaction> =
  mongoose.models.InstaPayTransaction ||
  mongoose.model<IInstaPayTransaction>("InstaPayTransaction", InstaPayTransactionSchema);

export default InstaPayTransaction;
