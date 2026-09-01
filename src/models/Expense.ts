import mongoose, { Schema, Document, Model } from "mongoose";

export type ExpenseCategory =
  | "utilities"
  | "rent"
  | "hospitality"
  | "supplies"
  | "maintenance"
  | "transport"
  | "salaries_advances"
  | "inventory"
  | "other";

export type ExpensePaymentSource =
  | "cash_drawer"
  | "instapay"
  | "vodafone_cash"
  | "bank"
  | "external";

export interface IExpense extends Document {
  title: string;
  amount: number;
  category: ExpenseCategory;
  paymentSource: ExpensePaymentSource;
  paidTo?: string;
  receiptNumber?: string;
  notes?: string;
  performedBy: string;
  shiftId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: {
      type: String,
      enum: [
        "utilities",
        "rent",
        "hospitality",
        "supplies",
        "maintenance",
        "transport",
        "salaries_advances",
        "inventory",
        "other",
      ],
      default: "other",
      required: true,
    },
    paymentSource: {
      type: String,
      enum: ["cash_drawer", "instapay", "vodafone_cash", "bank", "external"],
      default: "cash_drawer",
      required: true,
    },
    paidTo: { type: String, trim: true },
    receiptNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    performedBy: { type: String, required: true, trim: true, default: "الكاشير" },
    shiftId: { type: String, trim: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ createdAt: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ paymentSource: 1 });
ExpenseSchema.index({ shiftId: 1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
