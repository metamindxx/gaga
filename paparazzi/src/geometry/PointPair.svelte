<!--
  PointPair.svelte - Renders a pair of points with a visual link
  
  Point pairs arise naturally in CGA from intersections (e.g., line ∧ sphere).
  We render them as two points connected by a dotted/dashed line.
  
  If one or both points are ideal (at infinity), we show a directional arrow
  instead of a solid point for that end.
  
  Usage:
    <PointPair point1={[0, 0, 0]} point2={[1, 1, 1]} />
    <PointPair point1={[0, 0, 0]} point2={[1, 0, 0]} point2Ideal />
-->
<script lang="ts">
  import { T } from '@threlte/core';
  import * as THREE from 'three';
  import type { ColorRepresentation } from 'three';
  import type { Snippet } from 'svelte';
  import type { Vec3 } from '../algebra/types.js';
  import Point from './Point.svelte';
  import Direction from './Direction.svelte';

  interface Props {
    /** First point position (or direction if ideal) */
    point1: Vec3;
    /** Second point position (or direction if ideal) */
    point2: Vec3;
    /** True if point1 is an ideal point (direction) */
    point1Ideal?: boolean;
    /** True if point2 is an ideal point (direction) */
    point2Ideal?: boolean;
    /** Radius of point spheres */
    radius?: number;
    /** Color */
    color?: ColorRepresentation;
    /** Dash size for connecting line */
    dashSize?: number;
    /** Gap size for connecting line */
    gapSize?: number;
    /** Custom material as children */
    children?: Snippet;
  }

  let {
    point1
    , point2
    , point1Ideal = false
    , point2Ideal = false
    , radius = 0.05
    , color = '#888888'
    , dashSize = 0.1
    , gapSize = 0.05
    , children
  }: Props = $props();

  // For ideal points, we need to figure out where to draw the line
  // If both are finite: line between them
  // If one is ideal: line from finite point in direction of ideal
  // If both are ideal: just show two direction arrows from origin

  const bothFinite = $derived(!point1Ideal && !point2Ideal);
  const bothIdeal = $derived(point1Ideal && point2Ideal);

  // Line geometry for finite-finite case
  const finiteLineGeometry = $derived.by(() => {
    if (!bothFinite) return null;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...point1)
      , new THREE.Vector3(...point2)
    ]);
  });

  // Line geometry for finite-ideal case
  const mixedLineGeometry = $derived.by(() => {
    if (bothFinite || bothIdeal) return null;

    const finitePoint = point1Ideal ? point2 : point1;
    const direction = point1Ideal ? point1 : point2;

    // Normalize direction
    const mag = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    if (mag < 1e-10) return null;

    const dir: Vec3 = [direction[0] / mag, direction[1] / mag, direction[2] / mag];

    // Extend line in direction
    const extensionLength = 2;
    const farPoint: Vec3 = [
      finitePoint[0] + dir[0] * extensionLength
      , finitePoint[1] + dir[1] * extensionLength
      , finitePoint[2] + dir[2] * extensionLength
    ];

    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...finitePoint)
      , new THREE.Vector3(...farPoint)
    ]);
  });

  // Get the finite point and direction for mixed case
  const mixedConfig = $derived.by(() => {
    if (bothFinite || bothIdeal) return null;

    const finitePoint = point1Ideal ? point2 : point1;
    const direction = point1Ideal ? point1 : point2;
    const isPoint1TheIdeal = point1Ideal;

    return { finitePoint, direction, isPoint1TheIdeal };
  });
</script>

{#if bothFinite}
  <!-- Two finite points with dashed line between them -->
  <Point position={point1} {radius}>
    {#if children}
      {@render children()}
    {:else}
      <T.MeshStandardMaterial {color} />
    {/if}
  </Point>

  <Point position={point2} {radius}>
    {#if children}
      {@render children()}
    {:else}
      <T.MeshStandardMaterial {color} />
    {/if}
  </Point>

  {#if finiteLineGeometry}
    <T.Line geometry={finiteLineGeometry}>
      <T.LineDashedMaterial {color} {dashSize} {gapSize} />
    </T.Line>
  {/if}
{:else if bothIdeal}
  <!-- Two ideal points: show as two direction arrows from origin -->
  <Direction direction={point1} {color} dashed />
  <Direction direction={point2} {color} dashed />
{:else if mixedConfig}
  <!-- One finite, one ideal: point + arrow pointing toward infinity -->
  <Point position={mixedConfig.finitePoint} {radius}>
    {#if children}
      {@render children()}
    {:else}
      <T.MeshStandardMaterial {color} />
    {/if}
  </Point>

  <Direction direction={mixedConfig.direction} origin={mixedConfig.finitePoint} {color} dashed />

  {#if mixedLineGeometry}
    <T.Line geometry={mixedLineGeometry}>
      <T.LineDashedMaterial {color} {dashSize} {gapSize} />
    </T.Line>
  {/if}
{/if}
