import { describe, expect, it } from "vitest";
import { computeSpin, sliceAtPointer } from "../domain/spin";

const TAU = Math.PI * 2;

function sequence(values: number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length]!;
}

describe("computeSpin", () => {
  it.each([0, 1.234, -5, 20, 1000.5])(
    "lands the target slice under the pointer from angle %s",
    (currentAngle) => {
      const spinner = computeSpin({
        currentAngle,
        sliceCount: 12,
        rng: sequence([0.42, 0.73, 0.1]),
      });
      const finalAngle = currentAngle + spinner.totalRotation;

      expect(sliceAtPointer({ angle: finalAngle, sliceCount: 12 })).toBe(spinner.targetSlice);
    },
  );

  it("chooses a slice in range for different rng values", () => {
    for (const value of [0, 0.25, 0.5, 0.75, 0.999]) {
      const result = computeSpin({
        currentAngle: 0,
        sliceCount: 12,
        rng: sequence([value, value, value]),
      });
      expect(result.targetSlice).toBeGreaterThanOrEqual(0);
      expect(result.targetSlice).toBeLessThan(12);
    }
  });

  it("always rotates forward by at least five full turns", () => {
    const result = computeSpin({
      currentAngle: 3,
      sliceCount: 12,
      rng: sequence([0.9, 0.1, 0.99]),
    });
    expect(result.totalRotation).toBeGreaterThanOrEqual(5 * TAU);
    expect(result.durationMs).toBe(4800);
  });

  it("rejects an empty wheel", () => {
    expect(() => computeSpin({ currentAngle: 0, sliceCount: 0, rng: () => 0 })).toThrow();
  });
});

describe("sliceAtPointer", () => {
  it("maps the top pointer to slice 9 at angle 0 with 12 slices", () => {
    expect(sliceAtPointer({ angle: 0, sliceCount: 12 })).toBe(9);
  });

  it("wraps negative angles", () => {
    expect(sliceAtPointer({ angle: -TAU, sliceCount: 12 })).toBe(9);
  });
});
