export interface RefCache<K, V> {
  /** Get (building if needed) the value for `key` and take a reference to it. */
  acquire(key: K): V;
  /** Drop one reference; the value is freed when the last one goes. Unknown keys are ignored. */
  release(key: K): void;
  /** Free every cached value regardless of outstanding references. */
  clear(): void;
}

/** Ref-counted keyed cache for shared GPU resources (textures, materials). */
export function createRefCache<K, V>(make: (key: K) => V, free: (value: V) => void): RefCache<K, V> {
  const entries = new Map<K, { value: V; refs: number }>();
  return {
    acquire(key) {
      let entry = entries.get(key);
      if (!entry) {
        entry = { value: make(key), refs: 0 };
        entries.set(key, entry);
      }
      entry.refs++;
      return entry.value;
    },
    release(key) {
      const entry = entries.get(key);
      if (entry && --entry.refs <= 0) {
        entries.delete(key);
        free(entry.value);
      }
    },
    clear() {
      for (const { value } of entries.values()) free(value);
      entries.clear();
    },
  };
}
