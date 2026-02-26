/**
 * Composable animation steps.
 *
 * Each step is a function `(dt: number) => boolean` that advances by `dt`
 * seconds and returns `true` when complete. Steps are stateful (closure over
 * their progress) — build a fresh one each time a cycle restarts.
 *
 * Mirrors the keyframe-animation pattern from the JSON scene schema but
 * expressed as composable TypeScript functions rather than data.
 */

/** An animation step. Advance by `dt` seconds; returns true when done. */
export type AnimStep = (dt: number) => boolean;

// ── Primitives ──────────────────────────────────────────

/** Interpolate a value from `from` to `to` over `duration` seconds. */
export function tween(
  from: number
  , to: number
  , duration: number
  , apply: (value: number) => void
): AnimStep {
  let elapsed = 0;
  return (dt) => {
    elapsed += dt;
    const t = Math.min(elapsed / duration, 1);
    apply(from + (to - from) * t);
    return t >= 1;
  };
}

/**
 * Move toward `target` at a variable rate (units / second).
 * `read` returns the current value; `rate` returns the current speed;
 * `apply` writes the new value.
 */
export function drive(
  read: () => number
  , target: number
  , rate: () => number
  , apply: (value: number) => void
): AnimStep {
  return (dt) => {
    const current = read();
    const r = rate();
    const dir = Math.sign(target - current);
    const next = current + dir * r * dt;
    if ((dir > 0 && next >= target) || (dir < 0 && next <= target) || dir === 0) {
      apply(target);
      return true;
    }
    apply(next);
    return false;
  };
}

/** Wait for `duration` seconds. */
export function pause(duration: number): AnimStep {
  let elapsed = 0;
  return (dt) => {
    elapsed += dt;
    return elapsed >= duration;
  };
}

/** Execute `fn` immediately (zero-duration step). */
export function call(fn: () => void): AnimStep {
  let done = false;
  return () => {
    if (!done) { fn(); done = true; }
    return true;
  };
}

// ── Combinators ─────────────────────────────────────────

/** Play steps one after another. */
export function sequence(...steps: AnimStep[]): AnimStep {
  let index = 0;
  return (dt) => {
    while (index < steps.length) {
      if (steps[index](dt)) {
        index++;
        dt = 0; // consumed by the completed step
      } else {
        return false;
      }
    }
    return true;
  };
}

/** Run all steps in parallel; completes when every step is done. */
export function parallel(...steps: AnimStep[]): AnimStep {
  const active = steps.map(() => true);
  return (dt) => {
    let allDone = true;
    for (let i = 0; i < steps.length; i++) {
      if (active[i]) {
        if (steps[i](dt)) active[i] = false;
        else allDone = false;
      }
    }
    return allDone;
  };
}

/**
 * Call `fn(i)` for i = 0 .. count-1 with `interval` seconds between each.
 * Total duration ≈ (count - 1) × interval.
 */
export function stagger(
  count: number
  , interval: number
  , fn: (index: number) => void
): AnimStep {
  const steps: AnimStep[] = [];
  for (let i = 0; i < count; i++) {
    if (i > 0) steps.push(pause(interval));
    steps.push(call(() => fn(i)));
  }
  return sequence(...steps);
}
