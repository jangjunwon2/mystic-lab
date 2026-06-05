import { describe, it, expect } from "vitest";
import { addonUnitPrice, type AddonOption } from "./option-pricing";

const opt = (discountType: "percent" | "fixed", discountValue: number): AddonOption => ({
  id: "o1",
  hostProductId: "h1",
  linkedProductId: "l1",
  discountType,
  discountValue,
});

describe("addonUnitPrice", () => {
  it("정률(%) 할인", () => {
    expect(addonUnitPrice(100, opt("percent", 20))).toBe(80);
  });

  it("정액($) 할인", () => {
    expect(addonUnitPrice(50, opt("fixed", 15))).toBe(35);
  });

  it("할인이 가격을 넘어도 0 미만이 되지 않음", () => {
    expect(addonUnitPrice(10, opt("fixed", 999))).toBe(0);
  });

  it("소수점 2자리로 반올림", () => {
    expect(addonUnitPrice(9.99, opt("percent", 33))).toBe(6.69); // 9.99 * 0.67 = 6.6933
  });

  it("할인 0이면 원가 그대로", () => {
    expect(addonUnitPrice(42.5, opt("percent", 0))).toBe(42.5);
  });
});
