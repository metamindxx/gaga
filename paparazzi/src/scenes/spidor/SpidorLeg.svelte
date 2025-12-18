<script lang="ts">
  import { useTask } from '@threlte/core';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import type { Multivector } from '../../algebra/types';
  import { interactivity } from '@threlte/extras';
  import { e0, e1, e2 } from '../../algebra/pga';

  interactivity();

  // Props are what is passed in from parent component
  let {
    base
    , target
    , segmentCount: segmentCount = 3
    , segmentLength = 0.2
    , lockToPlane = true
    , setKnee = true
    , kneePosition = 0.9
    , solveN = 1
  }: {
    base: Multivector;
    target: Multivector;
    segmentCount: number;
    segmentLength: number;
    lockToPlane?: boolean;
    setKnee?: boolean;
    kneePosition?: number;
    solveN?: number;
  } = $props();

  // Rendered points for this leg. Stored as raw because MVs carry internal caches
  let points = $state<Multivector[]>([]);

  const lerp = (a: Multivector, b: Multivector, percent: number) =>
    a.smul(1 - percent).add(b.smul(percent));

  const translator = (line: Multivector, dist: number) =>
    e0
      .gp(line.normalize())
      .gp(e0.dual())
      .exp(-0.5 * dist);

  function solveIK() {
    const n = segmentCount + 1;
    if (points.length !== n)
      points = [...Array(n)].map((_, i) => e0.add(e1.smul(i * segmentLength)).dual());

    for (let s = 0; s < solveN; s++) {
      // Backward pass: pin endpoints, then walk segments back from the target
      points[0] = base;
      points[n - 1] = target;
      for (let i = n - 2; i >= 0; i--) {
        const dir = points[i].join(points[i + 1]);
        points[i] = translator(dir, -segmentLength).sandwich(points[i + 1]);
      }

      // Constraints
      if (lockToPlane) {
        const plane = base.join(target).dot(e2);
        for (let i = 1; i < n; i++) points[i] = points[i].projectOnto(plane);
      }
      if (setKnee && n > 2) {
        const kneeLine = lerp(base, target, kneePosition).gp(e2);
        points[2] = points[2].projectOnto(kneeLine);
      }

      // Forward pass: re-pin base and walk segments forward
      points[0] = base;
      for (let i = 1; i < n; i++) {
        const dir = points[i - 1].join(points[i]);
        points[i] = translator(dir, segmentLength).sandwich(points[i - 1]);
      }
    }
  }

  // Mark dirty when any solver input changes; the actual solve happens in useTask (once per frame)
  let dirty = true;
  $effect(() => {
    base;
    target;
    segmentCount;
    segmentLength;
    lockToPlane;
    setKnee;
    kneePosition;
    solveN;
    dirty = true;
  });

  useTask(() => {
    if (dirty) {
      dirty = false;
      solveIK();
    }
  });
</script>

<!-- Render each point of spidor leg -->
{#each points as p}
  <RenderMv mv={p} color="#5C4033" draggable={false} radius={0.015} />
{/each}
<!-- Render connecting lines -->
<RenderMv mv={points} color="#5C4033" lineWidth={0.02} />
