import { describe, expect, it } from "vitest";

import { tileShades } from "./tile-shades";

describe("tileShades", () => {
  it("returns 9 shades, deterministically", () => {
    const a = tileShades("#ffcc00");
    expect(a).toHaveLength(9);
    expect(tileShades("#ffcc00")).toEqual(a);
    for (const c of a) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("matches pusher.color hueSet (no shade) closely at zero shade", () => {
    // first entry is s=100%, v=100% of #ffcc00, shaded by at most 1/3
    const [first] = tileShades("#ffcc00", () => 0);
    expect(first).toBe("#ffcc00");
    const all = tileShades("#ffcc00", () => 0);
    // pusher.color: s65/v100 -> ~#fcdc58, s30/v30 -> ~#4d4836
    expect(all[3]).toBe("#ffde59");
    expect(all[8]).toBe("#4d4836");
  });
});
