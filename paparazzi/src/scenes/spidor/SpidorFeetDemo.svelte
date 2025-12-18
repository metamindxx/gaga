<script lang="ts">
  import { useTask } from '@threlte/core';
  import type { Multivector } from '../../algebra/types';
  import { e0, e1, e2, e13, pga } from '../../algebra/pga';

  import SpidorFeet from './SpidorFeet.svelte';

  let {
    stepMinDist = 0.12
    , stepDurationMs = 220
    , minRestMs = 120
    , stepFinishDist = 0.03
  }: {
    stepMinDist?: number;
    stepDurationMs?: number;
    minRestMs?: number;
    stepFinishDist?: number;
  } = $props();

  let feet = $state.raw<Multivector[]>([]);

  let targets = $state.raw<Multivector[]>([]);
  let startingPoints = $state.raw<Multivector[]>([]);

  const { PI } = Math;
  const legCount = 8;

  function pointOnGround(mv: Multivector) {
    const coords = pga.pointCoords(mv.selectGrade(3)) ?? [0, 0, 0];
    return pga.point([coords[0], 0, coords[2]]);
  }

  const motor = e0.add(e1).dual().join(e0.add(e1).add(e2).dual()).motor();
  const startMs = performance.now();

  useTask(() => {
    if (legCount <= 0) return;

    if (startingPoints.length !== legCount) {
      // Original ganja demo shape:
      // (E ** (((i / 10) * PI + PI / 4) * 1e13)) >>> !(1e0 + 0.3e1)
      const ptsAll = [...Array(10)]
        .map((_, i) => e13.exp((i / 10) * PI + PI / 4).sandwich(e0.add(e1.smul(0.3)).dual()))
        .slice(1);
      ptsAll.splice(4, 1);

      startingPoints = Array.from({ length: legCount }, (_, i) => ptsAll[i % ptsAll.length]);
      targets = startingPoints.map(pointOnGround);
      return;
    }

    const t = (performance.now() - startMs) / 8000;
    const m = motor(t);
    targets = startingPoints.map((p) => pointOnGround(m.sandwich(p).selectGrade(3)));
  });
</script>

<SpidorFeet bind:feet {targets} {stepMinDist} {stepDurationMs} {minRestMs} {stepFinishDist} />
