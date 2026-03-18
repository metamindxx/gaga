<script lang="ts">
  import { T } from '@threlte/core';
  import { MeshLineGeometry, MeshLineMaterial } from '@threlte/extras';
  import { Vector3, type ColorRepresentation } from 'three';
  import type { Snippet } from 'svelte';
  import type { Coords3DInput } from './primitives.js';
  import { toCoords3D } from './primitives.js';

  interface Props {
    /** Array of positions (coordinates or multivectors) */
    points: Coords3DInput[];
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
  const vector3Points = $derived(
    points.map((p) => {
      const c = toCoords3D(p);
      return new Vector3(c[0], c[1], c[2]);
    })
  );
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
