import { describe, expect, it } from "vitest";

import { DEFAULT_PALETTE } from "../types";
import { mergePalette } from "./palette";

describe("mergePalette", () => {
  it("overrides only the given keys", () => {
    const out = mergePalette(DEFAULT_PALETTE, { pin: "#123456" });
    expect(out.pin).toBe("#123456");
    expect(out.tile).toBe(DEFAULT_PALETTE.tile);
  });

  it("ignores undefined and keeps null background", () => {
    const out = mergePalette(DEFAULT_PALETTE, { tile: undefined, background: null });
    expect(out.tile).toBe(DEFAULT_PALETTE.tile);
    expect(out.background).toBeNull();
  });

  it("does not mutate the base", () => {
    mergePalette(DEFAULT_PALETTE, { pin: "#000000" });
    expect(DEFAULT_PALETTE.pin).toBe("#00eeee");
  });
});
