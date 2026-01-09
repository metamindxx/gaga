<!--
  RotorFlag.svelte - Generic flag renderer for visualizing rotations

  Takes a PGA rotor and renders a flag pole with triangular flag.
  The flag geometry is rotated by sandwiching with the rotor.

  Props:
    rotor: PGA rotor multivector (scalar + bivector parts)
    color: hex color for the flag (default: 0x22aa44)
-->
<script lang="ts">
  import RenderMv from './RenderMv.svelte';
  import { pga } from '../algebra/pga';
  import type { Multivector as MV } from '../algebra/types.js';

  type Props = {
    rotor: MV;
    color?: number;
  };
  let { rotor, color = 0x22aa44 }: Props = $props();

  // Flag geometry: pole from origin to z=1, triangular flag attached at z=0.6-0.8
  // Points form a polyline: base -> tip -> flag corner -> flag attach point
  const flagPts: MV[] = [
    pga.point([0, 0, 0]) // pole base (origin)
    , pga.point([0, 0, 1]) // pole tip (north pole)
    , pga.point([0, 0.4, 0.8]) // flag tip (sticks out in +y)
    , pga.point([0, 0, 0.6]) // flag attachment (back to pole)
  ];

  // Apply rotor to all flag points via sandwich product: R * pt * R~
  const rotatedFlag = $derived(flagPts.map((pt) => rotor.sandwich(pt)));
</script>

<RenderMv mv={rotatedFlag} {color} lineWidth={0.02} />
