<script lang="ts">
  /**
   * Point - Algebra-agnostic point component
   *
   * Renders a sphere at the given position.
   * Takes Euclidean coords, never sees multivectors.
   *
   * For drag handling, use the parent component to attach
   * window-level event handlers and pass an onpointerdown handler.
   */

  import { T } from '@threlte/core';
  import { Text } from '@threlte/extras';
  import type { Snippet } from 'svelte';
  import type { Coords3D } from './primitives.js';

  interface Props {
    /** Position in 3D space */
    position: Coords3D;
    /** Sphere radius */
    radius?: number;
    /** Color (hex number or string) */
    color?: number | string;
    /** Opacity (0-1) */
    opacity?: number;
    /** Optional label text */
    label?: string;
    /** Pointer down handler for drag initiation */
    onpointerdown?: (event: PointerEvent) => void;
    /** Click handler for selection */
    onclick?: (event: { stopPropagation: () => void }) => void;
    /** Pointer enter handler for hover */
    onpointerenter?: () => void;
    /** Pointer leave handler for hover */
    onpointerleave?: () => void;
    /** Custom material as children */
    children?: Snippet;
  }

  let {
    position
    , radius = 0.05
    , color = 0x000000
    , opacity = 1
    , label
    , onpointerdown
    , onclick
    , onpointerenter
    , onpointerleave
    , children
  }: Props = $props();

  // Offset label slightly above and to the right of the point
  const labelOffset: Coords3D = $derived([
    position[0] + radius / 2
    , position[1] + radius / 2
    , position[2] + radius / 8
  ]);
</script>

<T.Mesh {position} {onpointerdown} {onclick} {onpointerenter} {onpointerleave}>
  <T.SphereGeometry args={[radius, 16, 16]} />
  {#if children}
    {@render children()}
  {:else if opacity < 1}
    <T.MeshBasicMaterial {color} transparent {opacity} />
  {:else}
    <T.MeshBasicMaterial {color} />
  {/if}
</T.Mesh>

{#if label}
  <Text
    text={label}
    position={labelOffset}
    fontSize={radius * 2}
    {color}
    anchorX="left"
    anchorY="bottom"
  />
{/if}
