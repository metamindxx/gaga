<script lang="ts">
  import { T } from '@threlte/core';
  import { MeshLineGeometry, MeshLineMaterial } from '@threlte/extras';
  import { Vector3, type ColorRepresentation } from 'three';
  import type { Snippet } from 'svelte';

  type Vec3 = [number, number, number];

  interface Props {
    /** Array of [x, y, z] positions */
    points: Vec3[];
    /** Line color */
    color?: ColorRepresentation;
    /** Line width */
    width?: number;
    /** Line opacity */
    opacity?: number;
    /** Whether the line is transparent */
    transparent?: boolean;
    /** Custom material as children */
    children?: Snippet;
  }

  let {
    points
    , color = 0xffffff
    , width = 0.02
    , opacity = 1
    , transparent = false
    , children
  }: Props = $props();

  // Build Vector3 array for MeshLineGeometry
  const vector3Points = $derived(points.map((p) => new Vector3(p[0], p[1], p[2])));
</script>

{#if vector3Points.length >= 2}
  <T.Mesh>
    <MeshLineGeometry points={vector3Points} />
    {#if children}
      {@render children()}
    {:else}
      <MeshLineMaterial {color} {width} {opacity} {transparent} />
    {/if}
  </T.Mesh>
{/if}
