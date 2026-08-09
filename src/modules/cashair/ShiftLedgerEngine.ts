import Shift, { IShift } from "../../models/Shift";

/**
 * Starts a new cashier shift.
 * Throws an error if an open shift already exists for cashier or system.
 */
export async function startShift(
  cashierName: string,
  openingFloat: number
): Promise<IShift> {
  if (!cashierName || !cashierName.trim()) {
    throw new Error("Cashier name is required to start a shift.");
  }
  if (openingFloat < 0) {
    throw new Error("Opening float cannot be negative.");
  }

  const existingShift = await Shift.findOne({ status: "open" });
  if (existingShift) {
    throw new Error("An active shift already exists for cashier or system.");
  }

  const shift = new Shift({
    cashierName: cashierName.trim(),
    openedAt: new Date(),
    openingFloat,
    expectedCash: openingFloat,
    status: "open",
  });

  await shift.save();
  return shift;
}

/**
 * Retrieves the currently active open shift, if any.
 */
export async function getActiveShift(): Promise<IShift | null> {
  return await Shift.findOne({ status: "open" });
}

/**
 * Ends/closes an active shift, calculating cash variance and updating status.
 */
export async function endShift(
  shiftId: string,
  actualCash: number,
  notes?: string
): Promise<IShift> {
  const shift = await Shift.findById(shiftId);
  if (!shift || shift.status !== "open") {
    throw new Error("Active shift not found or shift is already closed.");
  }

  const cashVariance = actualCash - shift.expectedCash;

  shift.actualCash = actualCash;
  shift.cashVariance = cashVariance;
  shift.closedAt = new Date();
  shift.status = "closed";
  if (notes !== undefined) {
    shift.notes = notes;
  }

  await shift.save();
  return shift;
}
