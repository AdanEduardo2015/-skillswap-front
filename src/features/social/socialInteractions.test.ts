import { describe, expect, it } from "vitest";
import { applyCountDelta, calculateOptimisticRatingSummary, clampCount } from "./socialInteractions";

describe("social interaction helpers", () => {
  it("keeps counters at zero or above", () => {
    expect(clampCount(-4)).toBe(0);
    expect(applyCountDelta(0, -1)).toBe(0);
    expect(applyCountDelta(2, 1)).toBe(3);
  });

  it("calculates a new rating summary for first rating", () => {
    expect(calculateOptimisticRatingSummary(4, 2, 5)).toEqual({
      ratingAvg: 4.33,
      ratingCount: 3,
    });
  });

  it("calculates a rating summary when updating a previous rating", () => {
    expect(calculateOptimisticRatingSummary(4, 3, 5, 2)).toEqual({
      ratingAvg: 5,
      ratingCount: 3,
    });
  });
});
