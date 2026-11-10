import { describe, expect, it, vi } from "vitest";

import { createRefCache } from "./ref-cache";

describe("createRefCache", () => {
  it("builds once per key and frees on the last release", () => {
    const make = vi.fn((k: string) => ({ k }));
    const free = vi.fn();
    const cache = createRefCache(make, free);
    const a = cache.acquire("x");
    expect(cache.acquire("x")).toBe(a);
    expect(make).toHaveBeenCalledTimes(1);
    cache.release("x");
    expect(free).not.toHaveBeenCalled();
    cache.release("x");
    expect(free).toHaveBeenCalledWith(a);
    expect(cache.acquire("x")).not.toBe(a);
  });

  it("ignores unknown releases and frees everything on clear", () => {
    const free = vi.fn();
    const cache = createRefCache((k: number) => k, free);
    cache.release(9);
    cache.acquire(1);
    cache.acquire(2);
    cache.clear();
    expect(free).toHaveBeenCalledTimes(2);
  });
});
