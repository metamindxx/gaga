<script lang="ts">
  import RenderMv from '../geometry/RenderMv.svelte';
  import { pga, e12, e13, e23, one } from '../algebra/pga';
  import { interactivity } from '@threlte/extras';
  import type { Multivector as MV } from '../algebra/types.js';
  import type { Coords3D } from '../primitives/types.js';

  interactivity();

  // Props for locking points
  interface Props {
    lockPt1?: boolean;
    lockPt2?: boolean;
  }
  let { lockPt1 = false, lockPt2 = false }: Props = $props();


  // Draggable points (constrained to the plane y=0) representing SU(2) spinor components
  let pt1 = $state<MV>(pga.point([1, 0, 0]));
  let pt2 = $state<MV>(pga.point([0, 0, 0]));
  // Constraint plane for draggable points (y=0 plane)
  const xzPlane = [[0, 1, 0], [0, 0, 0]];

  // === Convert the SU(2) spinor to a PGA rotor ===

  const spinorRotor = $derived.by(() => {
    // Spinor (a, b) from draggable points on xz-plane (y=0)
    // Complex a = ar + i*ai represented by pt1 at (ar, 0, ai)
    // Complex b = br + i*bi represented by pt2 at (br, 0, bi)
    const [ar, , ai] = pga.pointCoords(pt1)!;
    const [br, , bi] = pga.pointCoords(pt2)!;

    // === SU(2) spinor to PGA rotor derivation ===
    //
    // The spin rotation matrices (rotsigx, rotsigy, rotsigz) show:
    //   exp(i θ/2 σx) rotates flagpole by θ about x-axis
    //   exp(i θ/2 σy) rotates flagpole by θ about y-axis  
    //   exp(i θ/2 σz) rotates flagpole by θ about z-axis
    //
    // A general unitary 2x2 matrix with det=1 has form:
    //   U = [[a, -b*], 
    //        [b,  a*]]  with |a|² + |b|² = 1
    //
    // Expanding U = w*I + x*(i σx) + y*(i σy) + z*(i σz):
    //   i σx = [[ 0, i],
    //           [ i, 0]]
    //   i σy = [[ 0, 1],
    //           [-1, 0]]
    //   i σz = [[ i, 0],
    //           [ 0,-i]]
    //
    // Gives: U = [[ w + iz, ix +  y], 
    //             [ix -  y,  w - iz]]
    //
    // Matching coefficients with [[a, -b*], [b, a*]]:
    //   a = w + iz    ->    w = Re(a) = ar,  z = Im(a) = ai
    //   b = ix - y    ->    x = Im(b) = bi,  y = -Re(b) = -br
    //   -b* = ix + y  ->    (consistent)
    //   a* = w - iz   ->    (consistent)
    //
    // As PGA bivector:
    //   i σx <-> e23  (rotation about x)
    //   i σy <-> e31  (rotation about y), and e31 = -e13
    //   i σz <-> e12  (rotation about z)
    //
    // Final rotor: R = w + x*e23 + y*e31 + z*e12
    //                = ar + bi*e23 + (-br)*e31 + ai*e12
    //                = ar + bi*e23 + br*e13 + ai*e12
    return one.smul(ar)
      .add(e23.smul(bi))
      .add(e13.smul(br))
      .add(e12.smul(ai));
  });

  // === Flag points rotated by spinor rotor ===

  const flagPts: MV[] = [
    pga.point([0, 0, 0]),      // pole base
    pga.point([0, 0, 1]),      // pole tip
    pga.point([0, 0.4, 0.8]),  // flag tip
    pga.point([0, 0, 0.6]),    // flag attachment
  ];
  const rotatedFlag = $derived(flagPts.map(pt => spinorRotor.sandwich(pt)));

  // === Drag handlers for pt1 and pt2 ===

  // When pt1 is dragged, clamp to unit disk and adjust pt2 so |pt1|² + |pt2|² = 1
  const onDragPt1 = (c1: Coords3D) => {
    if (lockPt1) return;
    if (lockPt2) {
      // pt2 is locked, clamp pt1 to available disk
      pt1 = onDragConstrained(c1, pt2);
    } else {
      [pt1, pt2] = onDrag(c1, pt2);
    }
  }
  // When pt2 is dragged, clamp to unit disk and adjust pt1 so |pt1|² + |pt2|² = 1
  const onDragPt2 = (c2: Coords3D) => {
    if (lockPt2) return;
    if (lockPt1) {
      // pt1 is locked, clamp pt2 to available disk
      pt2 = onDragConstrained(c2, pt1);
    } else {
      [pt2, pt1] = onDrag(c2, pt1);
    }
  }
  const {sqrt, max, min, hypot} = Math;
  // Drag when the other point is locked - constrain to circle of fixed radius
  function onDragConstrained(c: Coords3D, locked: MV): MV {
    const lc = pga.pointCoords(locked)!;
    return toRadius(c, sqrt(max(0, 1 - lc[0] * lc[0] - lc[2] * lc[2])));
  }
  // Common drag handler - freely adjust both points
  function onDrag(c: Coords3D, adj: MV): [MV, MV] {
    const r1 = min(1, hypot(c[0], c[2]));
    const ac = pga.pointCoords(adj)!;
    return [toRadius(c, r1), toRadius(ac, sqrt(1 - r1 * r1))];
  }
  // Normalize coords to target radius (or default direction if at origin)
  const toRadius = (c: Coords3D, r: number): MV => {
    const len = hypot(c[0], c[2]);
    if (len === 0) return pga.point([r, 0, 0]);
    return pga.point([c[0] * r / len, 0, c[2] * r / len]);
  };
</script>

<!-- Flag driven by spinor -->
<RenderMv mv={rotatedFlag} color={0x22aa44} lineWidth={0.02} />

<!-- Draggable points locked to xz plane, constrained so |pt1|² + |pt2|² = 1 -->
<RenderMv
  bind:mv={pt1}
  color={lockPt1 ? 0x666699 : 0x3366ff}
  radius={0.05} 
  label="pt1{lockPt1 ? '🔒' : ''}" 
  draggable={!lockPt1}
  constraintPlane={xzPlane}
  ondrag={onDragPt1}
/>
<RenderMv
  bind:mv={pt2}
  color={lockPt2 ? 0x996666 : 0xff6633} 
  radius={0.05} 
  label="pt2{lockPt2 ? '🔒' : ''}"
  draggable={!lockPt2}
  constraintPlane={xzPlane}
  ondrag={onDragPt2}
/>