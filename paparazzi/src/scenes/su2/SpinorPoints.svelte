<!--
  SpinorPoints.svelte - Draggable points representing SU(2) spinor components

  Two points pt1 and pt2 on the xz-plane (y=0), constrained so |pt1|^2 + |pt2|^2 = 1.
  Each point represents a complex number: pt at (x, 0, z) = x + iz.

  Drag behavior:
    - Drag ghosts can go beyond unit circle
    - When lockPtXRadius is false: radius wraps (r > 1 becomes ((r+1) % 2) - 1)
    - When lockPtXRadius is true: radius stays fixed, only angle changes (stays on rim)
    - Active point sets its radius, passive point adjusts to maintain constraint
    - On drag end, ghosts snap back to constrained positions
-->
<script lang="ts">
  import RenderMv from '../../geometry/RenderMv.svelte';
  import { pga } from '../../algebra/pga';
  import { Text, interactivity } from '@threlte/extras';
  import { untrack } from 'svelte';
  import { Color } from 'three';
  import type { Multivector as MV } from '../../algebra/types.js';

  interactivity();

  interface Props {
    pt1: MV;
    pt2: MV;
    onPt1Change?: (pt: MV) => void;
    onPt2Change?: (pt: MV) => void;
    color?: number;
    pt1Color?: number;
    pt2Color?: number;
    lockPt1Radius?: boolean;
    lockPt2Radius?: boolean;
    lockPt1Angle?: boolean;
    lockPt2Angle?: boolean;
  }
  let {
    pt1
    , pt2
    , onPt1Change
    , onPt2Change
    , color
    , pt1Color: pt1ColorProp
    , pt2Color: pt2ColorProp
    , lockPt1Radius = false
    , lockPt2Radius = false
    , lockPt1Angle = false
    , lockPt2Angle = false
  }: Props = $props();

  /** Domain coloring: complex number to hex color via HSL (hue=phase, sat=magnitude) */
  function complexToColor(re: number, im: number): number {
    const phase = Math.atan2(im, re);
    const h = (phase + Math.PI) / (2 * Math.PI);
    const s = Math.min(1, Math.sqrt(re * re + im * im));
    return new Color().setHSL(h, s, 0.5).getHex();
  }

  // Calculate colors: use prop if provided, else derive from point coords via domain coloring
  const pt1Color = $derived.by(() => {
    if (pt1ColorProp !== undefined) return pt1ColorProp;
    if (color !== undefined) return color;
    const [x, , z] = pga.pointCoords(pt1)!;
    return complexToColor(x, z);
  });
  const pt2Color = $derived.by(() => {
    if (pt2ColorProp !== undefined) return pt2ColorProp;
    if (color !== undefined) return color;
    const [x, , z] = pga.pointCoords(pt2)!;
    return complexToColor(x, z);
  });
  const linkColor = $derived(new Color(pt1Color).lerp(new Color(pt2Color), 0.5).getHex());

  // Draggable points (can go beyond unit circle)
  let dragPt1 = $state<MV>(pga.point([1, 0, 0]));
  let dragPt2 = $state<MV>(pga.point([0, 0, 0]));
  let activeDrag = $state<1 | 2 | null>(null);
  const xzPlane = [
    [0, 1, 0]
    , [0, 0, 0]
  ];

  const { sqrt, max, hypot, atan2, cos, sin, PI } = Math;

  function wrapRadius(r: number): number {
    return r > 1 ? ((r + 1) % 2) - 1 : r;
  }

  // Get the current radius of each prop point (for locked mode)
  const pt1CurrentRadius = $derived.by(() => {
    const [x, , z] = pga.pointCoords(pt1)!;
    return hypot(x, z);
  });
  const pt2CurrentRadius = $derived.by(() => {
    const [x, , z] = pga.pointCoords(pt2)!;
    return hypot(x, z);
  });

  // Get radius based on which point is active (only when dragging)
  const activeRadius = $derived.by(() => {
    if (activeDrag === null) return null;

    if (activeDrag === 1) {
      if (lockPt1Radius) {
        // Locked: keep current radius
        return pt1CurrentRadius;
      }
      const [x, , z] = pga.pointCoords(dragPt1)!;
      return wrapRadius(hypot(x, z));
    } else {
      if (lockPt2Radius) {
        // Locked: keep current radius
        return pt2CurrentRadius;
      }
      const [x, , z] = pga.pointCoords(dragPt2)!;
      return wrapRadius(hypot(x, z));
    }
  });
  const passiveRadius = $derived(
    activeRadius !== null ? sqrt(max(0, 1 - activeRadius * activeRadius)) : null
  );

  const spinorPt1Radius = $derived(activeDrag === 1 ? activeRadius : passiveRadius);
  const spinorPt2Radius = $derived(activeDrag === 2 ? activeRadius : passiveRadius);

  // Get current angles of prop points (for lock angle mode)
  const pt1CurrentAngle = $derived.by(() => {
    const [x, , z] = pga.pointCoords(pt1)!;
    return atan2(z, x);
  });
  const pt2CurrentAngle = $derived.by(() => {
    const [x, , z] = pga.pointCoords(pt2)!;
    return atan2(z, x);
  });

  // Calculate spinor points from drag points - only when actively dragging
  $effect(() => {
    if (activeDrag === null || spinorPt1Radius === null) return;
    // When pt1 is active, use dragPt1 angle (unless locked); when passive, use current pt1 angle
    const source = activeDrag === 1 ? dragPt1 : pt1;
    const [x, , z] = pga.pointCoords(source)!;
    const r = hypot(x, z);
    let newPt: MV;
    if (r === 0 && activeDrag === 1) {
      newPt = pga.point([spinorPt1Radius, 0, 0]);
    } else {
      let angle: number;
      let useR: number;

      if (activeDrag === 1 && lockPt1Angle) {
        // Lock to axis: project drag point onto the axis through origin
        // Axis direction: (cos(θ), sin(θ))
        // Signed projection tells us which side of origin
        const axisX = cos(pt1CurrentAngle);
        const axisZ = sin(pt1CurrentAngle);
        const projection = x * axisX + z * axisZ;
        // If projection < 0, we're on the opposite side - flip angle by π
        angle = projection >= 0 ? pt1CurrentAngle : pt1CurrentAngle + PI;
        useR = lockPt1Radius ? spinorPt1Radius : Math.min(Math.abs(projection), 1);
      } else {
        angle = atan2(z, x);
        useR = activeDrag === 1 && !lockPt1Radius && r <= 1 ? r : spinorPt1Radius;
      }
      newPt = pga.point([useR * cos(angle), 0, useR * sin(angle)]);
    }
    untrack(() => onPt1Change?.(newPt));
  });

  $effect(() => {
    if (activeDrag === null || spinorPt2Radius === null) return;
    // When pt2 is active, use dragPt2 angle (unless locked); when passive, use current pt2 angle
    const source = activeDrag === 2 ? dragPt2 : pt2;
    const [x, , z] = pga.pointCoords(source)!;
    const r = hypot(x, z);
    let newPt: MV;
    if (r === 0 && activeDrag === 2) {
      newPt = pga.point([spinorPt2Radius, 0, 0]);
    } else {
      let angle: number;
      let useR: number;

      if (activeDrag === 2 && lockPt2Angle) {
        // Lock to axis: project drag point onto the axis through origin
        const axisX = cos(pt2CurrentAngle);
        const axisZ = sin(pt2CurrentAngle);
        const projection = x * axisX + z * axisZ;
        angle = projection >= 0 ? pt2CurrentAngle : pt2CurrentAngle + PI;
        useR = lockPt2Radius ? spinorPt2Radius : Math.min(Math.abs(projection), 1);
      } else {
        angle = atan2(z, x);
        useR = activeDrag === 2 && !lockPt2Radius && r <= 1 ? r : spinorPt2Radius;
      }
      newPt = pga.point([useR * cos(angle), 0, useR * sin(angle)]);
    }
    untrack(() => onPt2Change?.(newPt));
  });

  const snapPoints = () => {
    dragPt1 = pt1;
    dragPt2 = pt2;
    activeDrag = null;
  };

  // Sync drag points when props change externally (e.g., from sliders) - only when not dragging
  $effect(() => {
    if (activeDrag !== 1) {
      dragPt1 = pt1;
    }
  });

  $effect(() => {
    if (activeDrag !== 2) {
      dragPt2 = pt2;
    }
  });
</script>

<!-- Drag ghosts (transparent, can go outside unit circle) -->
<RenderMv
  bind:mv={dragPt1}
  color={pt1Color}
  opacity={0.3}
  radius={0.05}
  draggable
  constraintPlane={xzPlane}
  ondragstart={() => (activeDrag = 1)}
  ondragend={snapPoints}
/>
<RenderMv
  bind:mv={dragPt2}
  color={pt2Color}
  opacity={0.3}
  radius={0.05}
  draggable
  constraintPlane={xzPlane}
  ondragstart={() => (activeDrag = 2)}
  ondragend={snapPoints}
/>

<!-- Actual spinor points (constrained to unit disk) -->
<!-- <SpinorPoints {pt1} {pt2} /> -->
<!-- Spinor points (solid, within unit disk) -->
<RenderMv mv={pt1} color={pt1Color} radius={0.05} />
<RenderMv mv={pt2} color={pt2Color} radius={0.05} />
<RenderMv mv={[pt1, pt2]} color={linkColor} opacity={0.22} />

<!-- Labels for α and β points -->
{#if pga.pointCoords(pt1)}
  {@const [x1, , z1] = pga.pointCoords(pt1)!}
  <Text
    text="α"
    position={[x1, 0.1, z1]}
    fontSize={0.12}
    color={pt1Color}
    anchorX="left"
    anchorY="middle"
  />
{/if}
{#if pga.pointCoords(pt2)}
  {@const [x2, , z2] = pga.pointCoords(pt2)!}
  <Text
    text="β"
    position={[x2, 0.1, z2]}
    fontSize={0.12}
    color={pt2Color}
    anchorX="left"
    anchorY="middle"
  />
{/if}
