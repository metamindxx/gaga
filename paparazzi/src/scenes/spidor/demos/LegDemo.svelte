<script lang="ts">
  import { pga } from '../../../algebra/pga';
  import RenderMv from '../../../geometry/RenderMv.svelte';
  import Leg from '../components/Leg.svelte';
  import type { Multivector } from '../../../algebra/types';
  import { interactivity } from '@threlte/extras';

  interactivity();

  let {
    segmentCount = 3
    , segmentLength = 0.2
    , lockToPlane = true
    , setKnee = true
    , kneePosition = 0.9
    , solveN = 1
  }: {
    segmentCount?: number;
    segmentLength?: number;
    lockToPlane?: boolean;
    setKnee?: boolean;
    kneePosition?: number;
    solveN?: number;
  } = $props();

  let base = $state.raw<Multivector>(pga.point([0, 0, 0]));
  let target = $state.raw<Multivector>(pga.point([0.8, 0, 0]));
</script>

<RenderMv bind:mv={base} color="green" />
<RenderMv bind:mv={target} color="blue" />
<Leg
  {base}
  {target}
  {segmentCount}
  {segmentLength}
  {lockToPlane}
  {setKnee}
  {kneePosition}
  {solveN}
/>
