<script lang="ts">
  /**
   * Segment - Algebra-agnostic line segment
   *
   * Renders a line from start to end point.
   * Takes pure coordinates, never sees multivectors.
   */

  import { T } from '@threlte/core';
  import { MeshLineGeometry, MeshLineMaterial, Text } from '@threlte/extras';
  import { Vector3 } from 'three';
  import type { Coords3D } from '../primitives/types.js';

  interface Props {
    /** Start position */
    start: Coords3D;
    /** End position */
    end: Coords3D;
    /** Line color */
    color?: number | string;
    /** Line width */
    lineWidth?: number;
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
    start
    , end
    , color = 0x000000
    , lineWidth = 0.02
    , opacity = 1
    , label
    , onclick
    , onpointerenter
    , onpointerleave
  }: Props = $props();

  const points = $derived([new Vector3(...start), new Vector3(...end)]);

  // Label position: midpoint of segment
  const labelPosition: Coords3D = $derived([
    (start[0] + end[0]) / 2
    , (start[1] + end[1]) / 2
    , (start[2] + end[2]) / 2
  ]);

  // Label font size: based on segment length
  const segmentLength = $derived(
    Math.sqrt((end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2 + (end[2] - start[2]) ** 2)
  );
</script>

<T.Mesh {onclick} {onpointerenter} {onpointerleave}>
  <MeshLineGeometry {points} />
  <MeshLineMaterial {color} width={lineWidth} {opacity} transparent={opacity < 1} />
</T.Mesh>

{#if label}
  <Text
    text={label}
    position={labelPosition}
    fontSize={Math.max(0.05, segmentLength * 0.15)}
    {color}
    anchorX="center"
    anchorY="bottom"
  />
{/if}
