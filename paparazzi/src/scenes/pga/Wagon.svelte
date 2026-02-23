<script lang="ts">
  /**
   * Wagon.svelte - PGA Wagon with bone hierarchy
   *
   * MotorGroup nesting handles parent-child composition via the scene graph:
   *   <MotorGroup motor={wagonMotor}>        ← wagon position + heading
   *     <MotorGroup motor={wheel.motor}>      ← offset + axle align + steer + spin
   *
   * Each wheel stores a bindMotor (offset + axle orientation) and a
   * localMotor (steer + spin) that are composed per frame.
   */

  import { T, useTask } from '@threlte/core';
  import { e13, e23, e01, e02, e03, one } from '../../algebra/pga';
  import type { Multivector as MV } from '../../algebra/types.js';
  import MotorGroup from '../../geometry/MotorGroup.svelte';

  // Props
  interface Props {
    speed?: number;
    steerAngle?: number;
    animate?: boolean;
  }
  let {
    speed = 0.5
    , steerAngle = 0
    , animate = true
  }: Props = $props();

  // ── Dimensions ───────────────────────────────────────────────────────────
  const wagonLength = 3.0;
  const wagonWidth = 1.6;
  const boardHeight = 0.12;
  const sideHeight = 0.4;
  const wheelRadius = 0.4;
  const wheelTube = 0.08;
  const axleY = wheelRadius;
  const boardY = axleY + wheelRadius * 0.3;

  const wheelDX = wagonWidth / 2 + 0.15;
  const wheelDZ_front = wagonLength / 2 - 0.3;
  const wheelDZ_back = -wheelDZ_front;

  // ── PGA motor builders ───────────────────────────────────────────────────
  const m01 = e01.motor();
  const m02 = e02.motor();
  const m03 = e03.motor();
  const m13 = e13.motor();   // rotation about y
  const m23 = e23.motor();   // rotation about x

  function translator(x: number, y: number, z: number): MV {
    return m01(-x * 0.5).gp(m02(-y * 0.5)).gp(m03(-z * 0.5));
  }

  // 90° rotation about y — orients wheel geometry so axle aligns with x
  const axleAlign = m13(Math.PI / 4);

  // ── Wheels ───────────────────────────────────────────────────────────────
  interface Wheel {
    bindMotor: MV;     // offset + axle orientation (constant)
    localMotor: MV;    // steer + spin (animated)
    motor: MV;         // bind * local (for rendering)
    isFront: boolean;
  }

  function createWheel(ox: number, oz: number, isFront: boolean): Wheel {
    return {
      bindMotor: translator(ox, 0, oz)
      , localMotor: one
      , motor: one
      , isFront
    };
  }

  const wheels: Wheel[] = [
    createWheel(-wheelDX, wheelDZ_front, true)    // FL
    , createWheel( wheelDX, wheelDZ_front, true)  // FR
    , createWheel(-wheelDX, wheelDZ_back, false)  // BL
    , createWheel( wheelDX, wheelDZ_back, false)  // BR
  ];

  // ── Animation state ──────────────────────────────────────────────────────
  let heading = $state(0);
  let posX = $state(0);
  let posZ = $state(0);
  let totalDist = $state(0);

  let wagonMotor = $state<MV>(one);
  let wheelMotors = $state<MV[]>([one, one, one, one]);

  // ── Animation loop ───────────────────────────────────────────────────────
  useTask((delta) => {
    if (!animate) return;
    const dt = delta;

    heading -= steerAngle * speed * dt;
    posX += Math.sin(heading) * speed * dt;
    posZ += Math.cos(heading) * speed * dt;
    totalDist += Math.abs(speed) * dt;

    // Wagon motor: translate + heading
    wagonMotor = translator(posX, boardY, posZ).gp(m13(heading / 2));

    // Wheel motors: steer + spin, composed with bind
    const spin = m23(-totalDist / wheelRadius / 2);
    wheelMotors = wheels.map(w => {
      const steer = w.isFront ? m13(-steerAngle / 2) : one;
      w.motor = w.bindMotor.gp(steer).gp(spin).gp(axleAlign);
      return w.motor;
    });
  });

  // Colors
  const boardColor = 0x8B5A2B;
  const sideColor = 0x6B3A1B;
  const wheelColor = 0x333333;
  const spokeColor = 0x666666;

  const numSpokes = 3;
  const spokeAngles = Array.from({ length: numSpokes }, (_, i) => (Math.PI / numSpokes) * i);
</script>

<!-- Everything nested inside wagon motor; scene graph composes transforms -->
<MotorGroup motor={wagonMotor}>
  <!-- Floor board -->
  <T.Mesh>
    <T.BoxGeometry args={[wagonWidth, boardHeight, wagonLength]} />
    <T.MeshStandardMaterial color={boardColor} />
  </T.Mesh>

  <!-- Left side board -->
  <T.Mesh
    position.x={-wagonWidth / 2}
    position.y={sideHeight / 2 + boardHeight / 2}
  >
    <T.BoxGeometry args={[boardHeight, sideHeight, wagonLength]} />
    <T.MeshStandardMaterial color={sideColor} />
  </T.Mesh>

  <!-- Right side board -->
  <T.Mesh
    position.x={wagonWidth / 2}
    position.y={sideHeight / 2 + boardHeight / 2}
  >
    <T.BoxGeometry args={[boardHeight, sideHeight, wagonLength]} />
    <T.MeshStandardMaterial color={sideColor} />
  </T.Mesh>

  <!-- Wheels, nested in wagon, each with its own motor (bind + steer + spin) -->
  {#each wheelMotors as motor}
    <MotorGroup {motor}>
      <T.Mesh>
        <T.TorusGeometry args={[wheelRadius, wheelTube, 8, 24]} />
        <T.MeshStandardMaterial color={wheelColor} />
      </T.Mesh>

      {#each spokeAngles as ang}
        <T.Mesh rotation.z={ang}>
          <T.CylinderGeometry args={[0.015, 0.015, wheelRadius * 1.8, 4]} />
          <T.MeshStandardMaterial color={spokeColor} />
        </T.Mesh>
      {/each}
    </MotorGroup>
  {/each}
</MotorGroup>
