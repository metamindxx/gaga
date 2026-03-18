<!--
  PointCloud.svelte - Render multiple points as spheres
  
  Usage:
    <PointCloud points={[[0,0,0], [1,1,1]]} color="red" />
-->
<script lang="ts">
  import { T } from '@threlte/core';
  import type { ColorRepresentation } from 'three';
  import type { Snippet } from 'svelte';
  import type { Coords3D, Coords3DInput } from './primitives.js';
  import { toCoords3D } from './primitives.js';
  import Point from './Point.svelte';

  interface Props {
    /** Array of positions (coordinates or multivectors) */
    points: Coords3DInput[];
    /** Sphere radius */
    radius?: number;
    /** Point color (ignored if children provided) */
    color?: ColorRepresentation;
    /** Custom material as children */
    children?: Snippet;
  }

  let { points: pointsInput, radius = 0.05, color = '#888888', children }: Props = $props();

  const points: Coords3D[] = $derived(pointsInput.map(toCoords3D));
</script>

{#each points as pos}
  <Point position={pos} {radius}>
    {#if children}
      {@render children()}
    {:else}
      <T.MeshStandardMaterial {color} />
    {/if}
  </Point>
{/each}
