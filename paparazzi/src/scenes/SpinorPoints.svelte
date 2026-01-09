<!--
  SpinorPoints.svelte - Draggable points representing SU(2) spinor components

  Two points pt1 and pt2 on the xz-plane (y=0), constrained so |pt1|^2 + |pt2|^2 = 1.
  Each point represents a complex number: pt at (x, 0, z) = x + iz.

  Drag behavior:
    - Drag ghosts can go beyond unit circle
    - Radius wraps: r > 1 becomes ((r+1) % 2) - 1
    - Active point sets its radius, passive point adjusts to maintain constraint
    - On drag end, ghosts snap back to constrained positions
-->
<script lang="ts">
  import RenderMv from '../geometry/RenderMv.svelte';
  import { pga } from '../algebra/pga';
  import { interactivity } from '@threlte/extras';
  import { Color } from 'three';
  import type { Multivector as MV } from '../algebra/types.js';

  interactivity();

  type Props = {
    pt1?: MV;
    pt2?: MV;
    color?: number;
  };
  let {
    pt1 = $bindable(pga.point([1, 0, 0]))
    , pt2 = $bindable(pga.point([0, 0, 0]))
    , color = 0x4c9aff
  }: Props = $props();

  const pt1Color = $derived.by(() => color);
  const pt2Color = $derived.by(() => new Color(color).lerp(new Color(0xffffff), 0.2).getHex());
  const linkColor = $derived.by(() => new Color(pt1Color).lerp(new Color(pt2Color), 0.5).getHex());

  // Draggable points (can go beyond unit circle)
  let dragPt1 = $state<MV>(pga.point([1, 0, 0]));
  let dragPt2 = $state<MV>(pga.point([0, 0, 0]));
  let activeDrag = $state<1 | 2>(1);
  const xzPlane = [
    [0, 1, 0]
    , [0, 0, 0]
  ];

  const { sqrt, max, hypot, atan2 } = Math;

  function wrapRadius(r: number): number {
    return r > 1 ? ((r + 1) % 2) - 1 : r;
  }

  // Get wrapped radius based on which point is active
  const activeRadius = $derived.by(() => {
    const [x1, , z1] = pga.pointCoords(dragPt1)!;
    const [x2, , z2] = pga.pointCoords(dragPt2)!;
    return activeDrag === 1 ? wrapRadius(hypot(x1, z1)) : wrapRadius(hypot(x2, z2));
  });
  const passiveRadius = $derived(sqrt(max(0, 1 - activeRadius * activeRadius)));

  const spinorPt1Radius = $derived(activeDrag === 1 ? activeRadius : passiveRadius);
  const spinorPt2Radius = $derived(activeDrag === 2 ? activeRadius : passiveRadius);

  // Calculate spinor points from drag points
  $effect(() => {
    const [x, , z] = pga.pointCoords(dragPt1)!;
    const r = hypot(x, z);
    if (r === 0) {
      pt1 = pga.point([spinorPt1Radius, 0, 0]);
      return;
    }
    const angle = atan2(z, x);
    const useR = activeDrag === 1 && r <= 1 ? r : spinorPt1Radius;
    pt1 = pga.point([useR * Math.cos(angle), 0, useR * Math.sin(angle)]);
  });

  $effect(() => {
    const [x, , z] = pga.pointCoords(dragPt2)!;
    const r = hypot(x, z);
    if (r === 0) {
      pt2 = pga.point([spinorPt2Radius, 0, 0]);
      return;
    }
    const angle = atan2(z, x);
    const useR = activeDrag === 2 && r <= 1 ? r : spinorPt2Radius;
    pt2 = pga.point([useR * Math.cos(angle), 0, useR * Math.sin(angle)]);
  });

  const snapPoints = () => {
    dragPt1 = pt1;
    dragPt2 = pt2;
  };
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
