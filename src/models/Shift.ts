import mongoose, { Schema, Document, Model } from "mongoose";

export interface IShift extends Document {
  cashierName: string;
  openedAt: Date;
  closedAt?: Date;
  openingFloat: number;
  expectedCash: number;
  actualCash?: number;
  cashVariance?: number;
  totalCashSales: number;
  totalInstaPaySales: number;
  totalVodafoneSales: number;
  totalCardSales: number;
  totalCashRefunds: number;
  totalDigitalRefunds: number;
  totalDiscountsGiven: number;
  notes?: string;
  status: "open" | "closed";
}

const ShiftSchema = new Schema<IShift>(
  {
    cashierName: { type: String, required: true, trim: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    openingFloat: { type: Number, required: true, default: 0 },
    expectedCash: { type: Number, required: true, default: 0 },
    actualCash: { type: Number },
    cashVariance: { type: Number, default: 0 },
    totalCashSales: { type: Number, default: 0 },
    totalInstaPaySales: { type: Number, default: 0 },
    totalVodafoneSales: { type: Number, default: 0 },
    totalCardSales: { type: Number, default: 0 },
    totalCashRefunds: { type: Number, default: 0 },
    totalDigitalRefunds: { type: Number, default: 0 },
    totalDiscountsGiven: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

const Shift: Model<IShift> =
  mongoose.models.Shift || mongoose.model<IShift>("Shift", ShiftSchema);

export default Shift;
