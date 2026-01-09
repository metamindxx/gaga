<script lang="ts">
  import RenderMv from '../geometry/RenderMv.svelte';
  import { pga, e12, e13, e23, one, e0 } from '../algebra/pga';
  import { interactivity } from '@threlte/extras';
  import type { Multivector as MV } from '../algebra/types.js';
  import type { Coords3D } from '../primitives/types.js';
  import Circle from '../geometry/Circle.svelte';
  import { untrack } from 'svelte';

  interactivity();

  const { min, sqrt, hypot } = Math;

  function wrapAround(pt: MV, lockRadius: number): MV {
    let [x, , z] = pga.pointCoords(pt)!;
    let r2 = x * x + z * z;
    if (r2 <= 1) return pt;
    let radius = Math.sqrt(r2);
    let scale = lockRadius / radius;
    x *= scale;
    z *= scale;
    return pga.point([x, 0, z]);
  }
  // Common drag handler - freely adjust both points
  function onDrag(c: Coords3D, adj: MV): MV {
    const r1 = hypot(c[0], c[2]);
    const ac = pga.pointCoords(adj)!;
    return toRadius(ac, sqrt(1 - r1 * r1));
  }
  // Normalize coords to target radius (or default direction if at origin)
  const toRadius = (c: Coords3D, r: number): MV => {
    const len = hypot(c[0], c[2]);
    if (len === 0) return pga.point([r, 0, 0]); // TODO: choose direction based on drag line
    return pga.point([(c[0] * r) / len, 0, (c[2] * r) / len]);
  };

  let origin = pga.point([0, 0, 0]);

  let dragPt1 = $state<MV>(pga.point([1, 0, 0]));
  let dragLine1 = $state(origin.join(pga.point([1, 0, 0])));
  $effect(() => {
    const dl1 = origin.join(dragPt1.copy());
    if (!dl1.isZero()) dragLine1 = dl1;
  });

  let spinorPt1Radius = $derived.by(() => {
    const [x, , z] = pga.pointCoords(dragPt1)!;
    let r = Math.hypot(x, z);
    if (r > 1) r = ((r + 1) % 2) - 1;
    return r;
  });
  let spinorPt1 = $derived(wrapAround(dragPt1, spinorPt1Radius));

  let dragPt2 = $state<MV>(pga.point([0, 0, 0]));
  let dragLine2 = $state(dragLine1); // pt2 starts at origin so any line will do
  $effect(() => {
    const dl2 = origin.join(dragPt2.copy());
    if (!dl2.isZero()) dragLine2 = dl2;
  });

  let spinorPt2Radius = $derived.by(() => {
    const [x, , z] = pga.pointCoords(dragPt2)!;
    let r = Math.hypot(x, z);
    if (r > 1) r = ((r + 1) % 2) - 1;
    return r;
  });
  let spinorPt2 = $derived(wrapAround(dragPt2, spinorPt2Radius));

  // enforce |pt1|² + |pt2|² = 1
  $effect(() => {
    // if dragPt1 is changed, adjust spinorPt2 without tracking spinorPt1
    onDrag(pga.pointCoords(dragPt1)!, spinorPt2);
  });
  const xzPlane = [
    [0, 1, 0]
    , [0, 0, 0]
  ];
</script>

<RenderMv
  bind:mv={dragPt1}
  constraintPlane={xzPlane}
  color={0x3366ff}
  opacity={0.3}
  draggable
  ondragend={() => (dragPt1 = spinorPt1)}
/>
<RenderMv mv={spinorPt1} constraintPlane={xzPlane} color={0x3366ff} />
<RenderMv mv={dragLine1} color={0x3366ff} opacity={0.1} />
<Circle
  center={[0, 0, 0]}
  normal={[0, 1, 0]}
  radius={spinorPt1Radius}
  color={0x3366ff}
  opacity={0.1}
  lineWidth={0.01}
/>
