<script lang="ts">
  import { T } from '@threlte/core';
  import { MeshLineGeometry, MeshLineMaterial } from '@threlte/extras';
  import { Vector3, DoubleSide, type ColorRepresentation } from 'three';
  import type { Snippet } from 'svelte';

  type Point = [number, number, number] | { x: number; y: number; z: number };

  interface Props {
    /** Array of points to connect with line segments */
    points: Point[];
    /** Single color for all segments */
    color?: ColorRepresentation;
    /** Line width (world units by default) */
    width?: number;
    /** Line opacity */
    opacity?: number;
    /** Whether the line is transparent */
    transparent?: boolean;
    /** Fixed screen-space width (set to true to ignore distance) */
    attenuate?: boolean;
    /** Custom material as children (overrides color/opacity/transparent) */
    children?: Snippet;
  }

  let {
    points
    , color = 0xffffff
    , width = 0.02
    , opacity = 1
    , transparent = false
    , attenuate = true
    , children
  }: Props = $props();

  // Convert point to Vector3
  function toVector3(p: Point): Vector3 {
    if (Array.isArray(p)) return new Vector3(p[0], p[1], p[2]);
    return new Vector3(p.x, p.y, p.z);
  }

  // Build Vector3 array for MeshLineGeometry
  const vector3Points = $derived(points.map(toVector3));
</script>

{#if points.length >= 2}
  <T.Mesh frustumCulled={false}>
    <MeshLineGeometry points={vector3Points} />
    {#if children}
      {@render children()}
    {:else}
      <MeshLineMaterial {color} {width} {opacity} {transparent} {attenuate} side={DoubleSide} />
    {/if}
  </T.Mesh>
{/if}
