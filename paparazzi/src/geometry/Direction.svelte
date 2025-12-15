<!--
  Direction.svelte - Renders an ideal point (point at infinity) as an arrow
  
  Ideal points in CGA represent directions, not locations. We render them
  as arrows emanating from the origin (or a specified base point).
  
  Usage:
    <Direction direction={[1, 0, 0]} />
    <Direction direction={[1, 0, 0]} origin={[0, 1, 0]} length={2} />
-->
<script lang="ts">
  import { T } from '@threlte/core';
  import * as THREE from 'three';
  import type { ColorRepresentation } from 'three';
  import type { Snippet } from 'svelte';
  import type { Vec3 } from '../algebra/types.js';

  interface Props {
    /** Direction vector (will be normalized) */
    direction: Vec3;
    /** Base point of the arrow (default: origin) */
    origin?: Vec3;
    /** Length of the arrow shaft */
    length?: number;
    /** Size of the arrowhead */
    headSize?: number;
    /** Ratio of head length to head width */
    headRatio?: number;
    /** Color of the arrow */
    color?: ColorRepresentation;
    /** Show dashed line style (indicates "to infinity") */
    dashed?: boolean;
    /** Custom material as children */
    children?: Snippet;
  }

  let {
    direction
    , origin = [0, 0, 0]
    , length = 1
    , headSize = 0.1
    , headRatio = 2
    , color = '#888888'
    , dashed = true
    , children
  }: Props = $props();

  // Normalize direction
  const normalizedDir = $derived.by(() => {
    const mag = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    if (mag < 1e-10) return [1, 0, 0] as Vec3;
    return [direction[0] / mag, direction[1] / mag, direction[2] / mag] as Vec3;
  });

  // Arrow tip position
  const tip = $derived<Vec3>([
    origin[0] + normalizedDir[0] * length
    , origin[1] + normalizedDir[1] * length
    , origin[2] + normalizedDir[2] * length
  ]);

  // Shaft end (slightly before tip to leave room for cone)
  const headLength = $derived(headSize * headRatio);
  const shaftEnd = $derived<Vec3>([
    tip[0] - normalizedDir[0] * headLength
    , tip[1] - normalizedDir[1] * headLength
    , tip[2] - normalizedDir[2] * headLength
  ]);

  // Create line geometry for shaft
  const shaftGeometry = $derived.by(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...origin)
      , new THREE.Vector3(...shaftEnd)
    ]);
  });

  // Quaternion to orient cone along direction
  const coneQuaternion = $derived.by(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const target = new THREE.Vector3(...normalizedDir);
    const q = new THREE.Quaternion().setFromUnitVectors(up, target);
    return [q.x, q.y, q.z, q.w] as [number, number, number, number];
  });
</script>

<!-- Arrow shaft -->
<T.Line geometry={shaftGeometry}>
  {#if children}
    {@render children()}
  {:else if dashed}
    <T.LineDashedMaterial {color} dashSize={0.1} gapSize={0.05} />
  {:else}
    <T.LineBasicMaterial {color} />
  {/if}
</T.Line>

<!-- Arrowhead (cone) -->
<T.Mesh position={tip} quaternion={coneQuaternion}>
  <!-- Offset cone so base is at tip position -->
  <T.Group position={[0, -headLength / 2, 0]}>
    <T.Mesh>
      <T.ConeGeometry args={[headSize, headLength, 8]} />
      {#if children}
        {@render children()}
      {:else}
        <T.MeshStandardMaterial {color} />
      {/if}
    </T.Mesh>
  </T.Group>
</T.Mesh>
