<script lang="ts">
  /**
   * PGA Demo: Three Planes and their Meet Point
   *
   * Demonstrates Projective Geometric Algebra (R₃,₀,₁):
   * - Planes are grade-1 elements
   * - Meet of three planes gives a point
   */

  import { useTask } from '@threlte/core';
  import { pga } from '../algebra/pga';
  import RenderMv from '../geometry/RenderMv.svelte';
  import { interactivity } from '@threlte/extras';

  interactivity();

  // Animation time
  let time = $state(0);
  useTask(() => (time = performance.now()));

  // Animated plane offsets
  const offset = $derived(Math.sin(time / 1000) * 0.5);

  // Three orthogonal planes (animated)
  // In PGA: plane = nx*e1 + ny*e2 + nz*e3 + d*e0
  const xyPlane = $derived(pga.plane([0, 0, 1], offset)); // z = offset
  const xzPlane = $derived(pga.plane([0, 1, 0], -offset)); // y = -offset
  const yzPlane = $derived(pga.plane([1, 0, 0], offset * 0.5)); // x = offset/2

  // Meet of all three planes = the intersection point
  // meet(meet(xyPlane, xzPlane), yzPlane) gives a point
  const meetPoint = $derived(yzPlane.op(xzPlane).op(xyPlane));
  //   $inspect(meetPoint, 'meetPoint');
</script>

<!-- Render the three planes with different colors -->
<RenderMv mv={xyPlane} color={0x4444ff} opacity={0.3} label="xy-plane" />
<RenderMv mv={xzPlane} color={0x44ff44} opacity={0.3} label="xz-plane" />
<RenderMv mv={yzPlane} color={0xff4444} opacity={0.3} label="yz-plane" />

<!-- Meet point (intersection of all three planes) -->
<RenderMv mv={meetPoint} color={0xffffff} radius={0.1} label="meet" />
