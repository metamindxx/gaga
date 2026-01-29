<!--
  RotorFlag.svelte - Generic flag renderer for visualizing rotations

  Takes a PGA rotor and renders a flag pole with triangular flag.
  The flag geometry is rotated by sandwiching with the rotor.

  Props:
    rotor: PGA rotor multivector (scalar + bivector parts)
    color: hex color for the flag (default: 0x22aa44)
    poleColor: hex color for pole/outline (uses color if not specified)
    fabricColor: hex color for flag fabric fill (uses color if not specified)
-->
<script lang="ts">
  import RenderMv from './RenderMv.svelte';
  import { pga } from '../algebra/pga';
  import type { Multivector as MV } from '../algebra/types.js';
  import { T } from '@threlte/core';
  import { BufferGeometry, DoubleSide, Float32BufferAttribute } from 'three';

  type Props = {
    rotor: MV;
    color?: number;
    poleColor?: number;
    fabricColor?: number;
  };
  let { rotor, color = 0x22aa44, poleColor, fabricColor }: Props = $props();

  // Use poleColor if provided, otherwise fall back to color
  const effectivePoleColor = $derived(poleColor ?? color);
  const effectiveFabricColor = $derived(fabricColor ?? color);

  // Flag geometry: pole from origin to z=1, triangular flag attached at z=0.6-0.8
  // Points form a polyline: base -> tip -> flag corner -> flag attach point
  const flagPts: MV[] = [
    pga.point([0, 0, 0]) // pole base (origin)
    , pga.point([0, 0, 1]) // pole tip (north pole)
    , pga.point([0, 0.4, 0.8]) // flag tip (sticks out in +y)
    , pga.point([0, 0, 0.6]) // flag attachment (back to pole)
  ];

  // Fabric triangle vertices (the triangular part of the flag)
  const fabricPts: MV[] = [
    pga.point([0, 0, 1]) // pole tip
    , pga.point([0, 0.4, 0.8]) // flag tip
    , pga.point([0, 0, 0.6]) // flag attachment
  ];

  // Apply rotor to all flag points via sandwich product: R * pt * R~
  const rotatedFlag = $derived(flagPts.map((pt) => rotor.sandwich(pt)));

  // Apply rotor to fabric triangle
  const rotatedFabric = $derived(fabricPts.map((pt) => rotor.sandwich(pt)));

  // Extract fabric triangle coordinates for mesh
  const fabricVertices = $derived.by(() => {
    const coords: number[] = [];
    for (const pt of rotatedFabric) {
      const c = pga.pointCoords(pt);
      if (c) coords.push(...c);
    }
    return coords;
  });

  // Build geometry from vertices and indices
  const geometry = $derived.by(() => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(fabricVertices, 3));
    geo.setIndex([0, 1, 2]);
    geo.computeVertexNormals();
    return geo;
  });
</script>

{#if fabricVertices.length >= 9}
  <T.Mesh {geometry} frustumCulled={false}>
    <T.MeshBasicMaterial color={effectiveFabricColor} opacity={0.7} side={DoubleSide} />
  </T.Mesh>
{/if}

<!-- Flag pole and outline -->
<RenderMv mv={rotatedFlag} color={effectivePoleColor} lineWidth={0.02} />
