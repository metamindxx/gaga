<script lang="ts">
  /**
   * Line - Algebra-agnostic infinite line visualization
   *
   * Renders an (effectively) infinite line defined by a point and direction.
   * Internally this is drawn as a long Segment with configurable extent.
   */

  import type { Coords3D } from './primitives.js';
  import Segment from './Segment.svelte';

  interface Props {
    /** Any point on the line */
    point: Coords3D;
    /** Direction vector (does not need to be normalized) */
    direction: Coords3D;
    /** Half-length to render in each direction */
    extent?: number;

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
    point
    , direction
    , extent = 10
    , color = 0x000000
    , lineWidth = 0.02
    , opacity = 1
    , label
    , onclick
    , onpointerenter
    , onpointerleave
  }: Props = $props();

  const normalizedDir = $derived.by((): Coords3D => {
    const mag = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);
    if (mag < 1e-10) return [1, 0, 0];
    return [direction[0] / mag, direction[1] / mag, direction[2] / mag];
  });

  const start: Coords3D = $derived([
    point[0] - normalizedDir[0] * extent
    , point[1] - normalizedDir[1] * extent
    , point[2] - normalizedDir[2] * extent
  ]);

  const end: Coords3D = $derived([
    point[0] + normalizedDir[0] * extent
    , point[1] + normalizedDir[1] * extent
    , point[2] + normalizedDir[2] * extent
  ]);
</script>

<Segment
  {start}
  {end}
  {color}
  {lineWidth}
  {opacity}
  {label}
  {onclick}
  {onpointerenter}
  {onpointerleave}
/>
