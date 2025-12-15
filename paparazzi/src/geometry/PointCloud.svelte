<!--
  PointCloud.svelte - Render multiple points as spheres
  
  Usage:
    <PointCloud points={[[0,0,0], [1,1,1]]} color="red" />
-->
<script lang="ts">
  import { T } from '@threlte/core';
  import type { ColorRepresentation } from 'three';
  import type { Snippet } from 'svelte';
  import Point from './Point.svelte';

  type Vec3 = [number, number, number];

  interface Props {
    /** Array of [x, y, z] positions */
    points: Vec3[];
    /** Sphere radius */
    radius?: number;
    /** Point color (ignored if children provided) */
    color?: ColorRepresentation;
    /** Custom material as children */
    children?: Snippet;
  }

  let { points, radius = 0.05, color = '#888888', children }: Props = $props();
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
