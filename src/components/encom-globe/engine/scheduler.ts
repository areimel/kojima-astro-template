interface Scheduled {
  at: number;
  fn: () => void;
}

export interface Scheduler {
  /** Queue `fn` to run once the clock passes `now + delayMs`. */
  schedule(now: number, delayMs: number, fn: () => void): void;
  /** Run every entry that is due at `time`, in order. */
  flush(time: number): void;
  clear(): void;
}

/** Stable, time-sorted one-shot queue driven by the engine clock. */
export function createScheduler(): Scheduler {
  let queue: Scheduled[] = [];
  return {
    schedule(now, delayMs, fn) {
      const item = { at: now + Math.max(0, delayMs), fn };
      // Insert after any entries with the same or earlier time.
      let i = queue.length;
      while (i > 0 && queue[i - 1].at > item.at) i--;
      queue.splice(i, 0, item);
    },
    flush(time) {
      while (queue.length && queue[0].at <= time) queue.shift()?.fn();
    },
    clear() {
      queue = [];
    },
  };
}
