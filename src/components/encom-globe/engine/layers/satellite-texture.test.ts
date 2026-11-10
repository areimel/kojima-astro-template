import { describe, expect, it } from "vitest";

import { computeRepeatAt, frameAt } from "./satellite-texture";

const t = { frames: 50, frameDuration: 80, repeatAt: 40 };

describe("frameAt", () => {
  it("starts at frame 0 and advances every frameDuration", () => {
    expect(frameAt(0, t)).toBe(0);
    expect(frameAt(79, t)).toBe(0);
    expect(frameAt(80, t)).toBe(1);
    expect(frameAt(49 * 80, t)).toBe(49);
  });
  it("loops back to repeatAt after the last frame", () => {
    expect(frameAt(50 * 80, t)).toBe(40);
    expect(frameAt(59 * 80, t)).toBe(49);
    expect(frameAt(60 * 80, t)).toBe(40);
  });
  it("clamps negative time", () => {
    expect(frameAt(-100, t)).toBe(0);
  });
});

describe("computeRepeatAt", () => {
  it("matches the original for the default 8 waves", () => {
    expect(computeRepeatAt(8)).toBe(40);
  });
  it("stays within range for extreme wave counts", () => {
    expect(computeRepeatAt(1)).toBeGreaterThan(0);
    expect(computeRepeatAt(16)).toBeLessThan(50);
  });
});
