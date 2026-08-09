import { describe, it, expect } from "vitest";
import {
  calculatePOSDiscounts,
  DiscountItemInput,
  OrderDiscountInput,
  POSDiscountResult,
} from "../../src/modules/cashair/DiscountEngine";

describe("DiscountEngine", () => {
  it("should calculate stacked percentage item discount and fixed order discount correctly", () => {
    const items: DiscountItemInput[] = [
      {
        basePrice: 100,
        priorPrice: 90,
        quantity: 2,
        newDiscountType: "percentage",
        newDiscountValue: 10,
        stacked: true,
      },
    ];
    const orderDiscount: OrderDiscountInput = {
      type: "fixed",
      value: 10,
    };

    const res: POSDiscountResult = calculatePOSDiscounts(items, orderDiscount);

    // originalTotal = 100 * 2 = 200
    // stacked starting price = priorPrice (90)
    // finalUnitPrice = 90 * (1 - 0.10) = 81
    // itemsTotal = 81 * 2 = 162
    // finalTotal = 162 - 10 = 152
    // totalDiscount = 200 - 152 = 48
    expect(res.originalTotal).toBe(200);
    expect(res.itemsTotal).toBe(162);
    expect(res.finalTotal).toBe(152);
    expect(res.totalDiscount).toBe(48);
    expect(res.itemAdjustments).toHaveLength(1);
    expect(res.itemAdjustments[0].finalUnitPrice).toBe(81);
    expect(res.itemAdjustments[0].subtotal).toBe(162);
  });

  it("should calculate unstacked percentage item discount", () => {
    const items: DiscountItemInput[] = [
      {
        basePrice: 100,
        priorPrice: 90,
        quantity: 1,
        newDiscountType: "percentage",
        newDiscountValue: 20,
        stacked: false,
      },
    ];

    const res = calculatePOSDiscounts(items);

    // unstacked starting price = basePrice (100)
    // finalUnitPrice = 100 * (1 - 0.20) = 80
    expect(res.originalTotal).toBe(100);
    expect(res.itemsTotal).toBe(80);
    expect(res.finalTotal).toBe(80);
    expect(res.totalDiscount).toBe(20);
    expect(res.itemAdjustments[0].finalUnitPrice).toBe(80);
  });

  it("should calculate stacked fixed item discount", () => {
    const items: DiscountItemInput[] = [
      {
        basePrice: 100,
        priorPrice: 90,
        quantity: 1,
        newDiscountType: "fixed",
        newDiscountValue: 15,
        stacked: true,
      },
    ];

    const res = calculatePOSDiscounts(items);

    // stacked starting price = priorPrice (90)
    // finalUnitPrice = 90 - 15 = 75
    expect(res.originalTotal).toBe(100);
    expect(res.itemsTotal).toBe(75);
    expect(res.finalTotal).toBe(75);
    expect(res.totalDiscount).toBe(25);
    expect(res.itemAdjustments[0].finalUnitPrice).toBe(75);
  });

  it("should calculate unstacked fixed item discount", () => {
    const items: DiscountItemInput[] = [
      {
        basePrice: 100,
        priorPrice: 90,
        quantity: 1,
        newDiscountType: "fixed",
        newDiscountValue: 15,
        stacked: false,
      },
    ];

    const res = calculatePOSDiscounts(items);

    // unstacked starting price = basePrice (100)
    // finalUnitPrice = 100 - 15 = 85
    expect(res.originalTotal).toBe(100);
    expect(res.itemsTotal).toBe(85);
    expect(res.finalTotal).toBe(85);
    expect(res.totalDiscount).toBe(15);
    expect(res.itemAdjustments[0].finalUnitPrice).toBe(85);
  });

  it("should calculate order-level percentage discount stacked on items", () => {
    const items: DiscountItemInput[] = [
      {
        basePrice: 100,
        priorPrice: 100,
        quantity: 2,
      },
    ];
    const orderDiscount: OrderDiscountInput = {
      type: "percentage",
      value: 15,
    };

    const res = calculatePOSDiscounts(items, orderDiscount);

    // itemsTotal = 200
    // finalTotal = 200 * (1 - 0.15) = 170
    expect(res.originalTotal).toBe(200);
    expect(res.itemsTotal).toBe(200);
    expect(res.finalTotal).toBe(170);
    expect(res.totalDiscount).toBe(30);
  });

  it("should default unit price to priorPrice when no new discount is specified", () => {
    const items: DiscountItemInput[] = [
      {
        basePrice: 100,
        priorPrice: 85,
        quantity: 2,
      },
    ];

    const res = calculatePOSDiscounts(items);

    expect(res.originalTotal).toBe(200);
    expect(res.itemsTotal).toBe(170);
    expect(res.finalTotal).toBe(170);
    expect(res.totalDiscount).toBe(30);
    expect(res.itemAdjustments[0].finalUnitPrice).toBe(85);
  });

  it("should clamp item unit price and final total to zero if fixed discount exceeds price", () => {
    const items: DiscountItemInput[] = [
      {
        basePrice: 50,
        priorPrice: 50,
        quantity: 1,
        newDiscountType: "fixed",
        newDiscountValue: 60,
      },
    ];
    const orderDiscount: OrderDiscountInput = {
      type: "fixed",
      value: 20,
    };

    const res = calculatePOSDiscounts(items, orderDiscount);

    expect(res.originalTotal).toBe(50);
    expect(res.itemsTotal).toBe(0);
    expect(res.finalTotal).toBe(0);
    expect(res.totalDiscount).toBe(50);
    expect(res.itemAdjustments[0].finalUnitPrice).toBe(0);
  });

  it("should handle empty items array gracefully", () => {
    const res = calculatePOSDiscounts([]);

    expect(res).toEqual({
      originalTotal: 0,
      itemsTotal: 0,
      totalDiscount: 0,
      finalTotal: 0,
      itemAdjustments: [],
    });
  });
});
