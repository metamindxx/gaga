<!--
  SpinorSU2.svelte - Interactive SU(2) spinor visualization

  Combines SpinorPoints (draggable pt1/pt2) with RotorFlag for visualization.
  
  State is managed by the slide module (slides/spinorSU2/state.svelte.ts).
-->
<script lang="ts">
  import SpinorPoints from './SpinorPoints.svelte';
  import SpinorFlag from '../../geometry/RotorFlag.svelte';
  import Segment from '../../geometry/Segment.svelte';
  import { T } from '@threlte/core';
  import { e12, e13, e23, one, pga } from '../../algebra/pga';
  import { onDestroy } from 'svelte';
  import { linear } from 'svelte/easing';
  import {
    config
    , setPt1
    , setPt2
    , axisAngle
    , alphaColor
    , betaColor
    , lockRadius
    , lockAngle
    , complexToColor
    , ghostEnabled
    , ghostDuration
  } from './spinorState.svelte';

  // Ghost animation: slerp from identity to current rotor, looping
  let animT = $state(0); // 0 to 1

  let startTime: number | null = null;
  let frameId: number | null = null;

  function animate(now: number) {
    if (startTime === null) startTime = now;
    const cycleMs = ghostDuration.value;
    const elapsed = (now - startTime) % cycleMs;
    animT = linear(elapsed / cycleMs);
    frameId = requestAnimationFrame(animate);
  }

  frameId = requestAnimationFrame(animate);
  onDestroy(() => {
    if (frameId !== null) cancelAnimationFrame(frameId);
  });

  // Complex phase colors for alpha and beta
  const poleColor = $derived(alphaColor.value);
  const fabricColor = $derived(betaColor.value);

  // Convert spinor (pt1, pt2) to PGA rotor
  // pt1 = (ar, 0, ai) represents alpha = ar + i*ai
  // pt2 = (br, 0, bi) represents beta = br + i*bi
  // Rotor components: scalar=ar, e12=ai (Z-rot), e13=br (Y-rot), e23=bi (X-rot)
  const rotor = $derived.by(() => {
    const [ar, , ai] = pga.pointCoords(config.pt1)!;
    const [br, , bi] = pga.pointCoords(config.pt2)!;

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
    //    a  = w + iz  ->    w = Re(a) = ar,  z =  Im(a) =  ai
    //    b  = ix - y  ->    x = Im(b) = bi,  y = -Re(b) = -br
    //   -b* = ix + y  ->    (consistent)
    //    a* = w - iz  ->    (consistent)
    //
    // As PGA bivector:
    //   i σx <-> e23  (rotation about x)
    //   i σy <-> e31  (rotation about y), and e31 = -e13
    //   i σz <-> e12  (rotation about z)
    //
    // Final rotor: R = w + x*e23 + y*e31 + z*e12
    //                = ar + bi*e23 + (-br)*e31 + ai*e12
    //                = ar + bi*e23 + br*e13 + ai*e12
    return one
      .smul(ar)
      .add(e23.smul(bi)) // X-axis rotation component
      .add(e13.smul(br)) // Y-axis rotation component
      .add(e12.smul(ai)); // Z-axis rotation component
  });

  // Ghost rotor: interpolate from identity via exp(t·log(R))
  // For rotor R = cos(θ/2) + sin(θ/2)·B̂, log(R) = (θ/2)·B̂
  // So R^t = exp(t·θ/2·B̂) = cos(tθ/2) + sin(tθ/2)·B̂
  const ghostRotor = $derived.by(() => {
    // Extract scalar and bivector parts from rotor
    const w = rotor.basisSVal('e_') || 0; // cos(θ/2)
    const b12 = rotor.basisSVal('e_12') || 0;
    const b13 = rotor.basisSVal('e_13') || 0;
    const b23 = rotor.basisSVal('e_23') || 0;

    // Bivector magnitude = sin(θ/2)
    const bMag = Math.sqrt(b12 * b12 + b13 * b13 + b23 * b23);

    // Half-angle from rotor components
    const halfAngle = Math.atan2(bMag, w);

    // Handle identity rotor (no rotation)
    if (bMag < 1e-10) {
      return one; // identity
    }

    // Unit bivector
    const b12Hat = b12 / bMag;
    const b13Hat = b13 / bMag;
    const b23Hat = b23 / bMag;

    // Scaled half-angle for interpolation
    const tHalfAngle = animT * halfAngle;
    const c = Math.cos(tHalfAngle);
    const s = Math.sin(tHalfAngle);

    // exp(t·log(R)) = cos(tθ/2) + sin(tθ/2)·B̂
    return one
      .smul(c)
      .add(e12.smul(b12Hat * s))
      .add(e13.smul(b13Hat * s))
      .add(e23.smul(b23Hat * s));
  });

  // Bloch sphere point: position along axis proportional to rotation angle
  // At angle θ, distance = θ / 2π (full rotation = 1, half rotation = 0.5)
  const ghostBlochPoint = $derived.by((): [number, number, number] => {
    const { axis, angle } = axisAngle.value;
    const fraction = (angle / (2 * Math.PI)) * animT;
    return [axis[0] * fraction, axis[1] * fraction, axis[2] * fraction];
  });

  // Endpoint: final position on axis (where the solid ball sits)
  const blochPoint = $derived.by((): [number, number, number] => {
    const { axis, angle } = axisAngle.value;
    const fraction = angle / (2 * Math.PI);
    return [axis[0] * fraction, axis[1] * fraction, axis[2] * fraction];
  });

  // Ghost spinor points: interpolate from identity (α=1, β=0) to current
  // Identity: pt1 = [1, 0, 0], pt2 = [0, 0, 0]
  const ghostPt1 = $derived.by((): [number, number, number] => {
    const [x, , z] = pga.pointCoords(config.pt1)!;
    return [1 + (x - 1) * animT, 0, z * animT];
  });
  const ghostPt2 = $derived.by((): [number, number, number] => {
    const [x, , z] = pga.pointCoords(config.pt2)!;
    return [x * animT, 0, z * animT];
  });

  // Ghost colors: domain coloring from interpolated positions
  const ghostPoleColor = $derived(complexToColor(ghostPt1[0], ghostPt1[2]));
  const ghostFabricColor = $derived(complexToColor(ghostPt2[0], ghostPt2[2]));
</script>

<SpinorPoints
  pt1={config.pt1}
  pt2={config.pt2}
  onPt1Change={setPt1}
  onPt2Change={setPt2}
  pt1Color={poleColor}
  pt2Color={fabricColor}
  lockPt1Radius={lockRadius.value}
  lockPt2Radius={lockRadius.value}
  lockPt1Angle={lockAngle.value}
  lockPt2Angle={lockAngle.value}
/>

<SpinorFlag {rotor} {poleColor} {fabricColor} />

{#if ghostEnabled.value}
  <!-- Ghost spinor points: animate from identity to current -->
  <T.Mesh position={ghostPt1}>
    <T.SphereGeometry args={[0.04, 8, 8]} />
    <T.MeshBasicMaterial color={ghostPoleColor} opacity={0.3} transparent wireframe />
  </T.Mesh>
  <T.Mesh position={ghostPt2}>
    <T.SphereGeometry args={[0.04, 8, 8]} />
    <T.MeshBasicMaterial color={ghostFabricColor} opacity={0.3} transparent wireframe />
  </T.Mesh>

  <!-- Ghost flag: animates from identity to current rotation -->
  <SpinorFlag
    rotor={ghostRotor}
    poleColor={ghostPoleColor}
    fabricColor={ghostFabricColor}
    opacity={0.1}
  />
{/if}

<!-- Rotation axis line segment from origin -->
<Segment
  start={[0, 0, 0]}
  end={axisAngle.value.axis}
  color={0xcccccc}
  lineWidth={0.008}
  opacity={0.4}
/>

{#if ghostEnabled.value}
  <!-- Animated ghost point along axis (wireframe, translucent) -->
  <T.Mesh position={ghostBlochPoint}>
    <T.SphereGeometry args={[0.04, 8, 8]} />
    <T.MeshBasicMaterial color={0x777777} opacity={0.1} transparent wireframe />
  </T.Mesh>
{/if}

<!-- Solid endpoint sphere at full rotation position -->
<T.Mesh position={blochPoint}>
  <T.SphereGeometry args={[0.04, 16, 16]} />
  <T.MeshBasicMaterial color={0x777777} opacity={0.4} transparent />
</T.Mesh>
