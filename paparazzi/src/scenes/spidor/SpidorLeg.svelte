<script lang="ts">
  import { useTask } from '@threlte/core';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import type { Multivector } from '../../algebra/types';
  import { interactivity } from '@threlte/extras';
  import { e0, e2, pga } from '../../algebra/pga';
  import { getSpidorFullViz } from './spidorFullViz';
  import { readable } from 'svelte/store';

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

  function mvPointCoords(mv: Multivector): [number, number, number] {
    return (pga.pointCoords(mv.selectGrade(3)) ?? [0, 0, 0]) as [number, number, number];
  }

  function initPointsInBaseTargetPlane(n: number) {
    const [bx, by, bz] = mvPointCoords(base);
    const [tx, _ty, tz] = mvPointCoords(target);

    // Direction on the ground (x–z) from base to target; defines the vertical plane we want.
    const gx = tx - bx;
    const gz = tz - bz;
    const gmag = Math.hypot(gx, gz);

    // Yaw angle about +Y (e2) that takes the reference vertical plane (x–y, z=0)
    // into the vertical plane spanned by {up, base→target}.
    // If base≈target in xz, pick 0.
    const yaw = gmag > 1e-10 ? Math.atan2(gz, gx) : 0;

    // Rotor about vertical axis.
    const R = pga.rotor([0, 1, 0], -yaw);

    // Translation motor to move origin to base.
    const bmag = Math.hypot(bx, by, bz);
    const T =
      bmag > 1e-10
        ? pga.translator([bx / bmag, by / bmag, bz / bmag], bmag)
        : pga.translator([1, 0, 0], 0);

    // Compose: first rotate reference chain into the correct vertical plane, then translate to base.
    const M = T.gp(R);

    // Reference chain is built in the x–y vertical plane (z=0).
    points = Array.from({ length: n }, (_, i) => {
      const x = i * segmentLength;
      // Give a tiny initial lift so the solver has a stable knee direction.
      const y = i === 1 || i === n - 1 ? segmentLength : 0;
      const p = pga.point([x, y, 0]);
      return pga.apply(M, p).selectGrade(3);
    });
  }

  function solveIK() {
    const n = segmentCount + 1;
    if (points.length !== n) {
      initPointsInBaseTargetPlane(n);
    }

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

  const kneeLine = $derived(lerp(base, target, kneePosition).gp(e2).selectGrade(2));
  $inspect(pga.classify(kneeLine));

  const showViz = getSpidorFullViz() ?? readable(true);
</script>

{#if $showViz}
  <RenderMv mv={kneeLine} />
{/if}
<!-- Render each point of spidor leg -->
{#each points as p}
  <RenderMv mv={p} color="#5C4033" draggable={false} radius={0.015} />
{/each}
<!-- Render connecting lines -->
<RenderMv mv={points} color="#5C4033" lineWidth={0.02} />
