import { describe, it, expect } from "vitest";
import Shift from "../../src/models/Shift";

describe("Shift Model", () => {
  it("should validate a valid shift object and assign correct default values", async () => {
    const shift = new Shift({
      cashierName: "Ahmed",
      openingFloat: 500,
    });

    const err = await shift.validate();
    expect(err).toBeUndefined();
    expect(shift.cashierName).toBe("Ahmed");
    expect(shift.openingFloat).toBe(500);
    expect(shift.expectedCash).toBe(0);
    expect(shift.cashVariance).toBe(0);
    expect(shift.totalCashSales).toBe(0);
    expect(shift.totalInstaPaySales).toBe(0);
    expect(shift.totalVodafoneSales).toBe(0);
    expect(shift.totalCardSales).toBe(0);
    expect(shift.totalCashRefunds).toBe(0);
    expect(shift.totalDigitalRefunds).toBe(0);
    expect(shift.totalDiscountsGiven).toBe(0);
    expect(shift.status).toBe("open");
    expect(shift.openedAt).toBeDefined();
    expect(shift.openedAt instanceof Date).toBe(true);
  });

  it("should fail validation if cashierName is missing", async () => {
    const shift = new Shift({
      openingFloat: 500,
    });

    try {
      await shift.validate();
      expect.fail("Validation should have failed for missing cashierName");
    } catch (err: any) {
      expect(err).toBeDefined();
      expect(err.errors.cashierName).toBeDefined();
    }
  });
});
