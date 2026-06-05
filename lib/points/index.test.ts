import { describe, it, expect } from "vitest";
import { earnPointsForUsd, pointsToUsd } from "./index";

describe("earnPointsForUsd", () => {
  it("구매 금액의 5%를 포인트로 적립 (100pt = $1)", () => {
    expect(earnPointsForUsd(100)).toBe(500); // 100 * 100 * 0.05
  });

  it("0 또는 음수는 0", () => {
    expect(earnPointsForUsd(0)).toBe(0);
    expect(earnPointsForUsd(-10)).toBe(0);
  });

  it("가장 가까운 정수 포인트로 반올림", () => {
    expect(earnPointsForUsd(9.99)).toBe(50); // round(49.95)
  });
});

describe("pointsToUsd", () => {
  it("100 포인트 = $1", () => {
    expect(pointsToUsd(100)).toBe(1);
  });

  it("음수는 0으로 클램프", () => {
    expect(pointsToUsd(-50)).toBe(0);
  });
});
