<script lang="ts">
  import { useTask } from '@threlte/core';
  import type { Multivector } from '../../../algebra/types';
  import { pga } from '../../../algebra/pga';

  import Foot from '../components/Foot.svelte';

  let {
    stepMinDist = 0.12
    , stepDurationMs = 220
    , minRestMs = 120
    , stepFinishDist = 0.03

    , neighborA = false
    , neighborB = false

    , targetRadius = 0.6
    , targetSpeed = 0.35
  }: {
    stepMinDist?: number;
    stepDurationMs?: number;
    minRestMs?: number;
    stepFinishDist?: number;

    neighborA?: boolean;
    neighborB?: boolean;

    targetRadius?: number;
    targetSpeed?: number;
  } = $props();

  // Bindable foot state (the component writes this each frame).
  let foot = $state.raw<Multivector>(pga.point([0.25, 0, 0]));
  let moving = $state(false);

  // Animated target point.
  let target = $state.raw<Multivector>(pga.point([0.6, 0, 0]));

  const t0 = performance.now();
  useTask(() => {
    const t = (performance.now() - t0) * 0.001 * targetSpeed;
    const x = targetRadius * Math.cos(t);
    const z = targetRadius * Math.sin(t);
    target = pga.point([x, 0, z]);
  });
</script>

<Foot
  bind:foot
  bind:moving
  {target}
  neighborsMoving={[neighborA, neighborB]}
  {stepMinDist}
  {stepDurationMs}
  {minRestMs}
  {stepFinishDist}
  showTarget={true}
/>
