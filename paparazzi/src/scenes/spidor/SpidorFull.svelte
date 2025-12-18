<script lang="ts">
  import { useTask } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import { writable } from 'svelte/store';
  import type { Multivector } from '../../algebra/types';
  import { e0, e1, e2, e13, pga } from '../../algebra/pga';

  import RenderMv from '../../geometry/RenderMv.svelte';
  import SpidorFeet from './SpidorFeet.svelte';
  import SpidorLeg from './SpidorLeg.svelte';
  import { setSpidorFullViz } from './spidorFullViz';

  interactivity();

  let {
    stepMinDist = 0.12
    , stepDurationMs = 220
    , minRestMs = 120
    , stepFinishDist = 0.03

    , segmentCount = 3
    , segmentLength = 0.2
    , lockToPlane = true
    , setKnee = true
    , kneePosition = 0.9
    , solveN = 4

    , showViz = true
  }: {
    stepMinDist?: number;
    stepDurationMs?: number;
    minRestMs?: number;
    stepFinishDist?: number;

    segmentCount?: number;
    segmentLength?: number;
    lockToPlane?: boolean;
    setKnee?: boolean;
    kneePosition?: number;
    solveN?: number;

    showViz?: boolean;
  } = $props();

  const showVizStore = writable(showViz);
  setSpidorFullViz(showVizStore);

  $effect(() => {
    showVizStore.set(showViz);
  });

  const LEG_COUNT = 8;
  const BODY_HEIGHT = 0.25;

  let feet = $state.raw<Multivector[]>([]);
  let targets = $state.raw<Multivector[]>([]);
  let startingPoints = $state.raw<Multivector[]>([]);
  let body = $state.raw<Multivector>(pga.point([0, BODY_HEIGHT, 0]));

  function pointOnGround(mv: Multivector) {
    const coords = pga.pointCoords(mv.selectGrade(3)) ?? [0, 0, 0];
    return pga.point([coords[0], 0, coords[2]]);
  }

  function coordsOf(mv: Multivector): [number, number, number] {
    return (pga.pointCoords(mv.selectGrade(3)) ?? [0, 0, 0]) as [number, number, number];
  }

  function updateBody() {
    const src = feet.length === LEG_COUNT ? feet : targets;
    if (!src.length) return;
    let sx = 0;
    let sz = 0;
    for (const mv of src) {
      const [x, _y, z] = coordsOf(mv);
      sx += x;
      sz += z;
    }
    const n = src.length;
    body = pga.point([sx / n, BODY_HEIGHT, sz / n]);
  }

  const { PI } = Math;
  const motor = e0.add(e1).dual().join(e0.add(e1).add(e2).dual()).motor();
  const startMs = performance.now();

  // Initialize targets once.
  {
    const ptsAll = [...Array(10)]
      .map((_, i) => e13.exp((i / 10) * PI + PI / 4).sandwich(e0.add(e1.smul(0.3)).dual()))
      .slice(1);
    ptsAll.splice(4, 1);

    startingPoints = Array.from({ length: LEG_COUNT }, (_, i) => ptsAll[i % ptsAll.length]);
    targets = startingPoints.map(pointOnGround);
  }

  useTask(() => {
    const t = (performance.now() - startMs) / 8000;
    const m = motor(t);
    targets = startingPoints.map((p) => pointOnGround(m.sandwich(p).selectGrade(3)));
    updateBody();
  });
</script>

<RenderMv mv={body} color={0x888888} radius={0.08} draggable={false} />

<SpidorFeet bind:feet {targets} {stepMinDist} {stepDurationMs} {minRestMs} {stepFinishDist} />

{#if feet.length === LEG_COUNT}
  {#each feet as foot, i (i)}
    <SpidorLeg
      base={body}
      target={foot}
      {segmentCount}
      {segmentLength}
      {lockToPlane}
      {setKnee}
      {kneePosition}
      {solveN}
    />
  {/each}
{/if}
