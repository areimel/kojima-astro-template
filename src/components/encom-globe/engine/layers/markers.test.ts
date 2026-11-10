import { describe, expect, it } from "vitest";

import { arcDrawRange, resolveConnectTarget, retractDone } from "./marker-arc";

describe("arcDrawRange", () => {
  it("reveals vertices over the draw time", () => {
    expect(arcDrawRange(0, 0, null, 151)).toEqual({ start: 0, count: 0 });
    expect(arcDrawRange(1000, 0, null, 150).count).toBe(75);
    expect(arcDrawRange(2000, 0, null, 151)).toEqual({ start: 0, count: 151 });
    expect(arcDrawRange(5000, 0, null, 151).count).toBe(151);
  });

  it("is complete immediately with zero duration", () => {
    expect(arcDrawRange(0, 0, null, 151, 0).count).toBe(151);
  });

  it("retracts by advancing the start, aligned for segments", () => {
    const r = arcDrawRange(3000, 0, 2000, 150, 2000, 2);
    expect(r.start).toBe(74);
    expect(r.count).toBe(76);
    expect(arcDrawRange(4000, 0, 2000, 150).count).toBe(0);
  });

  it("detects finished retraction", () => {
    expect(retractDone(3999, 2000)).toBe(false);
    expect(retractDone(4000, 2000)).toBe(true);
    expect(retractDone(9999, null)).toBe(false);
  });
});

describe("resolveConnectTarget", () => {
  const exists = (id: string) => ["a", "b"].includes(id);
  it("resolves previous and ids", () => {
    expect(resolveConnectTarget("previous", "a", exists, "c")).toBe("a");
    expect(resolveConnectTarget("b", "a", exists, "c")).toBe("b");
  });
  it("gives no arc for missing targets", () => {
    expect(resolveConnectTarget(undefined, "a", exists)).toBeNull();
    expect(resolveConnectTarget("previous", null, exists)).toBeNull();
    expect(resolveConnectTarget("zzz", "a", exists)).toBeNull();
    expect(resolveConnectTarget("c", "a", exists, "c")).toBeNull();
  });
});
