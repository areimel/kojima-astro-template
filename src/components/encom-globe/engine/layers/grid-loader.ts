import type { GridFile } from "../types";

const cache = new Map<string, Promise<GridFile>>();

function defaultUrl(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base.endsWith("/") ? base : `${base}/`}globe/hex-grid.json`;
}

/**
 * Fetch the generated hex grid. The promise is cached per URL so many globe
 * instances share one request; failures are evicted so a retry can happen.
 */
export function loadGrid(url: string = defaultUrl()): Promise<GridFile> {
  const hit = cache.get(url);
  if (hit) return hit;

  const promise = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load globe grid (${res.status}): ${url}`);
      return res.json() as Promise<GridFile>;
    })
    .catch((err: unknown) => {
      cache.delete(url);
      throw err;
    });
  cache.set(url, promise);
  return promise;
}
