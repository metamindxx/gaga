<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { MeshLineGeometry, MeshLineMaterial } from '@threlte/extras';
  import { Vector3, type ColorRepresentation } from 'three';
  import type { Snippet } from 'svelte';

  type Vec3 = [number, number, number];

  interface Props {
    /** Current [x, y, z] position to track */
    point: Vec3;
    /** Maximum number of points in the trail */
    maxLength?: number;
    /** Trail color */
    color?: ColorRepresentation;
    /** Trail width */
    width?: number;
    /** Trail opacity */
    opacity?: number;
    /** Minimum distance before adding a new point */
    minDistance?: number;
    /** Custom material as children */
    children?: Snippet;
  }

  let {
    point
    , maxLength = 100
    , color = 0xff6666
    , width = 0.02
    , opacity = 0.7
    , minDistance = 0.01
    , children
  }: Props = $props();

  // Trail buffer
  let trailPoints = $state<Vec3[]>([]);
  let lastPosition: Vec3 | null = null;

  useTask(() => {
    // Only add point if moved enough
    const current = new Vector3(point[0], point[1], point[2]);
    const last = lastPosition ? new Vector3(...lastPosition) : null;
    const shouldAdd = !last || current.distanceTo(last) > minDistance;

    if (shouldAdd) {
      trailPoints = [...trailPoints.slice(-(maxLength - 1)), point];
      lastPosition = point;
    }
  });

  // Build Vector3 array for MeshLineGeometry
  const vector3Points = $derived(trailPoints.map((p) => new Vector3(p[0], p[1], p[2])));
</script>

{#if trailPoints.length >= 2}
  <T.Mesh>
    <MeshLineGeometry points={vector3Points} />
    {#if children}
      {@render children()}
    {:else}
      <MeshLineMaterial {color} {width} {opacity} transparent />
    {/if}
  </T.Mesh>
{/if}
