<script lang="ts">
  /**
   * Sphere - Algebra-agnostic sphere component
   *
   * Renders a sphere from center/radius.
   * Takes pure geometry, never sees multivectors.
   */

  import { T } from '@threlte/core';
  import { Text } from '@threlte/extras';
  import * as THREE from 'three';
  import type { Coords3D } from './primitives.js';

  interface Props {
    /** Center position */
    center: Coords3D;
    /** Sphere radius */
    radius: number;
    /** Color */
    color?: number | string;
    /** Opacity (0-1) */
    opacity?: number;
    /** Whether to render both sides */
    doubleSide?: boolean;
    /** Sphere segments */
    segments?: number;
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
    , color = 0xff00ff
    , opacity = 0.3
    , doubleSide = true
    , segments = 32
    , label
    , onclick
    , onpointerenter
    , onpointerleave
  }: Props = $props();

  const side = $derived(doubleSide ? THREE.DoubleSide : THREE.FrontSide);
</script>

<T.Mesh position={center} {onclick} {onpointerenter} {onpointerleave}>
  <T.SphereGeometry args={[radius, segments, segments]} />
  <T.MeshBasicMaterial {color} transparent={opacity < 1} {opacity} {side} depthWrite={false} />
</T.Mesh>

{#if label}
  <Text
    text={label}
    position={[center[0] + radius * 0.1, center[1] + radius * 0.1, center[2] + radius]}
    fontSize={radius * 0.3}
    {color}
    anchorX="left"
    anchorY="bottom"
  />
{/if}
