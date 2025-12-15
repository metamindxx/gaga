<script lang="ts">
  /**
   * Circle - Algebra-agnostic circle component
   *
   * Renders a circle from center/radius/normal.
   * Takes pure geometry, never sees multivectors.
   */

  import { T } from '@threlte/core';
  import { MeshLineGeometry, MeshLineMaterial, Text } from '@threlte/extras';
  import { Vector3, Quaternion, Euler } from 'three';
  import type { Coords3D } from '../primitives/types.js';

  interface Props {
    /** Center position */
    center: Coords3D;
    /** Circle radius */
    radius: number;
    /** Normal vector (perpendicular to circle plane) */
    normal: Coords3D;
    /** Line color */
    color?: number | string;
    /** Line width */
    lineWidth?: number;
    /** Number of segments */
    segments?: number;
    /** Opacity (0-1) */
    opacity?: number;
    /** Optional label text */
    label?: string;
    /** Click handler for selection */
    onclick?: (event: { stopPropagation: () => void }) => void;
    /** Pointer enter handler for hover */
    onpointerenter?: () => void;
    /** Pointer leave handler for hover */
    onpointerleave?: () => void;
  }

  let {
    center
    , radius
    , normal
    , color = 0x0000ff
    , lineWidth = 0.02
    , segments = 64
    , opacity = 1
    , label
    , onclick
    , onpointerenter
    , onpointerleave
  }: Props = $props();

  // Generate circle points in XY plane, then rotate to match normal
  const circlePoints = $derived.by(() => {
    const points: Vector3[] = [];

    // Generate unit circle in XY plane
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0));
    }

    // Calculate rotation from Z-up to target normal
    const up = new Vector3(0, 0, 1);
    const targetNormal = new Vector3(...normal).normalize();
    const quaternion = new Quaternion().setFromUnitVectors(up, targetNormal);

    // Apply rotation and translate to center
    const centerVec = new Vector3(...center);
    return points.map((p) => p.applyQuaternion(quaternion).add(centerVec));
  });
</script>

<T.Mesh {onclick} {onpointerenter} {onpointerleave}>
  <MeshLineGeometry points={circlePoints} />
  <MeshLineMaterial {color} width={lineWidth} {opacity} transparent={opacity < 1} />
</T.Mesh>

{#if label}
  <Text
    text={label}
    position={[center[0] + radius * 0.1, center[1] + radius * 0.1, center[2]]}
    fontSize={radius * 0.3}
    {color}
    anchorX="left"
    anchorY="bottom"
  />
{/if}
