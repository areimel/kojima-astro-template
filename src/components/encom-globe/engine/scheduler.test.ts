import { describe, expect, it } from "vitest";

import { createScheduler } from "./scheduler";

describe("createScheduler", () => {
  it("runs due entries in time order, stable for ties", () => {
    const s = createScheduler();
    const out: string[] = [];
    s.schedule(0, 20, () => out.push("c"));
    s.schedule(0, 10, () => out.push("a"));
    s.schedule(0, 10, () => out.push("b"));
    s.flush(5);
    expect(out).toEqual([]);
    s.flush(15);
    expect(out).toEqual(["a", "b"]);
    s.flush(100);
    expect(out).toEqual(["a", "b", "c"]);
  });

  it("clear drops pending work", () => {
    const s = createScheduler();
    let hit = false;
    s.schedule(0, 1, () => (hit = true));
    s.clear();
    s.flush(10);
    expect(hit).toBe(false);
  });
});
