<!--
  Plane.svelte - Renders a plane as a circular disk
  
  Uses PGA-style rendering: two overlapping circles (front/back) with
  quaternion-based orientation (since lookAt has edge cases with straight up/down).
  
  Usage:
    <Plane normal={[0, 1, 0]} distance={0} />
    <Plane normal={[0, 1, 0]} distance={2} size={3} color={0xff0000} />
-->
<script lang="ts">
  import { T } from '@threlte/core';
  import * as THREE from 'three';
  import type { ColorRepresentation } from 'three';
  import type { Vec3 } from '../algebra/types.js';

  interface Props {
    normal: Vec3;
    /** Distance from origin along normal */
    distance: number;
    /** Radius of the visible disk */
    size?: number;
    /** Color of the plane */
    color?: ColorRepresentation;
    /** Opacity (0-1) */
    opacity?: number;
    /** Click handler */
    onclick?: (event: { stopPropagation: () => void }) => void;
    /** Pointer enter handler */
    onpointerenter?: () => void;
    /** Pointer leave handler */
    onpointerleave?: () => void;
  }

  let {
    normal
    , distance
    , size = 2
    , color = 0x888888
    , opacity = 0.4
    , onclick
    , onpointerenter
    , onpointerleave
  }: Props = $props();

  // Normalize the normal vector
  const normalizedNormal = $derived.by(() => {
    const mag = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
    if (mag < 1e-10) return [0, 0, 1] as Vec3;
    return [normal[0] / mag, normal[1] / mag, normal[2] / mag] as Vec3;
  });

  // Calculate position: point on plane closest to origin (normal * distance)
  const position = $derived<Vec3>([
    normalizedNormal[0] * distance
    , normalizedNormal[1] * distance
    , normalizedNormal[2] * distance
  ]);

  // Calculate quaternion to rotate from default (facing +Z) to target normal
  // CircleGeometry faces +Z by default, so we rotate to align +Z with normal
  const quaternion = $derived.by(() => {
    const defaultNormal = new THREE.Vector3(0, 0, 1);
    const targetNormal = new THREE.Vector3(...normalizedNormal);
    const q = new THREE.Quaternion().setFromUnitVectors(defaultNormal, targetNormal);
    return [q.x, q.y, q.z, q.w] as [number, number, number, number];
  });
</script>

<T.Group {position} {quaternion}>
  <!-- Front circle (larger, more transparent) -->
  <T.Mesh {onclick} {onpointerenter} {onpointerleave}>
    <T.CircleGeometry args={[size, 32]} />
    <T.MeshStandardMaterial
      {color}
      {opacity}
      transparent={true}
      side={THREE.DoubleSide}
      emissive={0x111111}
    />
  </T.Mesh>

  <!-- Back circle (smaller, more opaque, offset slightly) -->
  <T.Mesh position.z={-0.001}>
    <T.CircleGeometry args={[size * 0.8, 32]} />
    <T.MeshStandardMaterial
      {color}
      opacity={opacity * 1.5}
      transparent={true}
      side={THREE.BackSide}
      emissive={0x111111}
    />
  </T.Mesh>
</T.Group>
