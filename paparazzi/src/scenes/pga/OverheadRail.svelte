<script lang="ts">
  /**
   * OverheadRail.svelte -- Overhead rail system with cart
   *
   * Latch mechanism:
   *   - Trip bar runs along the front of the cart
   *   - Each of 6 hooks has a latch held closed by the trip bar
   *   - At unload end: a fixed striker pushes the trip bar back, all latches open
   *   - During loading: each latch closes individually
   *   - Trip bar resets when cart moves away from striker
   */

  import { T, useTask } from '@threlte/core';
  import { e01, e02, e03, e13, e23, one } from '../../algebra/pga';
  import type { Multivector as MV } from '../../algebra/types.js';
  import MotorGroup from '../../geometry/MotorGroup.svelte';

  // Props
  interface Props {
    speed?: number;
    animate?: boolean;
    cartPosition?: number;
    latches?: boolean[];          // 6 booleans: true = open, false = closed
    tripBarPushed?: boolean;
  }
  let {
    speed = 1.0
    , animate = true
    , cartPosition = 0
    , latches = $bindable([false, false, false, false, false, false])
    , tripBarPushed = $bindable(false)
  }: Props = $props();

  // Dimensions 

  // Rail (round bar stock)
  const railLength = 12;
  const railGap = 0.8;
  const railHeight = 5;
  const railBarRadius = 0.04;

  // Support columns
  const numSupports = 4;
  const supportRadius = 0.06;

  // Scooter wheels
  const wheelRadius = 0.06;
  const wheelWidth = 0.03;
  const wheelCant = railBarRadius + wheelWidth / 2 + 0.005;  // straddle just outside the bar
  const wheelTopY = railBarRadius + wheelRadius;              // wheel center sits on top of bar
  const wheelGapZ = 0.5;

  // Cart frame
  const cartWidth = railGap - 0.2;
  const cartDepth = wheelGapZ + 0.2;
  const cartFrameH = 0.06;
  const cartHangDepth = 0.1;

  // Hook bars, two banks of 3
  const hookBarY = -cartHangDepth - cartFrameH;
  const hooksPerBank = 3;
  const bankSpacingX = cartWidth * 0.5;
  const hookSpacingZ = cartDepth * 0.6 / (hooksPerBank - 1);

  // Trip bar (on the BACK / -Z face of cart)
  const tripBarLength = cartWidth * 0.85;
  const tripBarSize = 0.04;
  const tripBarRestZ = -(cartDepth / 2 + tripBarSize);  // resting position (back of cart)
  const tripBarTravel = 0.12;
  const tripBarY = hookBarY + 0.02;

  // Latches
  const latchLength = 0.14;       // length of the latch arm
  const latchThickness = 0.02;
  const latchOpenAngle = Math.PI / 2;  // 90° open

  // Linkage, connects trip bar to latches
  const pushRodRadius = 0.012;         // thin vertical rods from trip bar down
  const releaseBarSize = 0.025;        // horizontal bar at latch level
  const camFingerLength = 0.05;        // protruding finger that pushes each latch
  const camFingerThickness = 0.015;
  const guideRodRadius = 0.01;         // horizontal guide rods the trip bar slides on
  const guideRodLength = tripBarTravel + tripBarSize * 2; // length of guide slot

  // Striker, bumper plate at start (-Z) end of rail
  const strikerZ = -(railLength / 2 - 0.5);
  const strikerPlateW = tripBarLength;
  const strikerPlateH = 0.12;
  const strikerPlateD = 0.04;
  const strikerBracketH = 0.3;         // vertical bracket from rail down to plate

  // PGA motor builders 
  const m01 = e01.motor();
  const m02 = e02.motor();
  const m03 = e03.motor();
  const m23 = e23.motor();

  function translator(x: number, y: number, z: number): MV {
    return m01(-x * 0.5)
      .gp(m02(-y * 0.5))
      .gp(m03(-z * 0.5));
  }

  // Cart travel range
  const travelMargin = 1.0;
  const travelStart = -railLength / 2 + travelMargin;
  const travelEnd = railLength / 2 - travelMargin;
  const travelRange = travelEnd - travelStart;

  // Distance from cart front to striker where trip bar engages
  const tripEngageDistance = 0.15;

  // Wheel motors
  interface WheelPoint {
    zOffset: number;
    railSide: number;
    bindMotor: MV;
    motor: MV;
  }
  const halfGap = railGap / 2;
  const halfWheelZ = wheelGapZ / 2;

  const wheelPoints: WheelPoint[] = [
    { zOffset: halfWheelZ, railSide: -1, bindMotor: translator(-halfGap, wheelTopY, halfWheelZ), motor: one }
    , { zOffset: -halfWheelZ, railSide: -1, bindMotor: translator(-halfGap, wheelTopY, -halfWheelZ), motor: one }
    , { zOffset: halfWheelZ, railSide: 1, bindMotor: translator(halfGap, wheelTopY, halfWheelZ), motor: one }
    , { zOffset: -halfWheelZ, railSide: 1, bindMotor: translator(halfGap, wheelTopY, -halfWheelZ), motor: one }
  ];

  // Hook positions
  interface HookPos { x: number; z: number; index: number; }
  const hookPositions: HookPos[] = [];
  for (const bankSide of [-1, 1]) {
    const bx = bankSide * bankSpacingX / 2;
    for (let hi = 0; hi < hooksPerBank; hi++) {
      const hz = -cartDepth * 0.3 + hi * hookSpacingZ;
      hookPositions.push({ x: bx, z: hz, index: hookPositions.length });
    }
  }

  // Animation state
  let cartZ = $state(travelStart);
  let totalDist = $state(0);
  let direction = $state(1);

  let cartMotor = $state<MV>(one);
  let wheelPointMotors = $state<MV[]>([one, one, one, one]);

  // Trip bar animation
  let tripBarOffset = $state(0);          // 0 = resting, tripBarTravel = fully pushed
  let latchAngles = $state<number[]>([0, 0, 0, 0, 0, 0]);  // 0 = closed, latchOpenAngle = open

  // Loading sequence state
  type Phase = 'traveling' | 'loading' | 'unloading';
  let phase = $state<Phase>('traveling');
  let pauseTimer = $state(0);         // countdown during loading/unloading pauses
  let loadingLatchIndex = $state(0);  // which latch we're closing next (0..5)
  const loadPauseBefore = 1.0;        // seconds to pause before starting to close latches
  const latchCloseInterval = 0.4;     // seconds between each latch closing
  let latchCloseTimer = $state(0);    // timer for staggering latch closes

  // Animation loop 
  useTask((delta) => {
    const dt = delta;

    if (!animate) {
      cartZ = travelStart + cartPosition * travelRange;
    } else {
      // Phase: TRAVELING 
      if (phase === 'traveling') {
        cartZ += direction * speed * dt;
        totalDist += Math.abs(speed) * dt;

        // Hit the far end (+Z) = loading station → close latches one by one
        if (cartZ >= travelEnd) {
          cartZ = travelEnd;
          direction = -1;
          phase = 'loading';
          pauseTimer = loadPauseBefore;
          loadingLatchIndex = 0;
          latchCloseTimer = 0;
        }
        // Hit the start end (-Z) = unload → trip bar hits striker, latches open
        if (cartZ <= travelStart) {
          cartZ = travelStart;
          direction = 1;
          phase = 'unloading';
          pauseTimer = 1.5;
        }
      }

      // Phase: UNLOADING (at start/-Z end, trip bar hits striker) 
      if (phase === 'unloading') {
        pauseTimer -= dt;
        if (pauseTimer <= 0) {
          phase = 'traveling';
        }
      }

      // Phase: LOADING (at far/+Z end, close latches one by one) 
      if (phase === 'loading') {
        if (pauseTimer > 0) {
          // Initial pause before closing starts
          pauseTimer -= dt;
        } else if (loadingLatchIndex < 6) {
          // Close latches one at a time
          latchCloseTimer -= dt;
          if (latchCloseTimer <= 0) {
            latches[loadingLatchIndex] = false;
            loadingLatchIndex++;
            latchCloseTimer = latchCloseInterval;
          }
        } else {
          // All latches closed, brief pause then go
          latchCloseTimer -= dt;
          if (latchCloseTimer <= 0) {
            phase = 'traveling';
          }
        }
      }
    }

    // Trip bar engagement: how close is the cart's back face to the striker?
    const cartBackZ = cartZ - cartDepth / 2 - tripBarSize;
    const distToStriker = cartBackZ - strikerZ;  // positive when cart hasn't reached striker yet

    // Trip bar pushes when cart back reaches the striker
    const pushed = distToStriker < tripEngageDistance;
    tripBarPushed = pushed;

    if (pushed) {
      // Push amount: how far past the engage point
      const pushAmount = Math.max(0, tripEngageDistance - distToStriker);
      tripBarOffset = Math.min(pushAmount, tripBarTravel);  // offset pushes bar toward +Z

      // All latches open
      for (let i = 0; i < 6; i++) {
        latchAngles[i] = Math.min(latchAngles[i] + dt * 8, latchOpenAngle);
        latches[i] = true;
      }
    } else {
      // Spring trip bar back to resting
      tripBarOffset = Math.max(0, tripBarOffset - dt * 4);

      // Animate latch angles toward their target state
      for (let i = 0; i < 6; i++) {
        const target = latches[i] ? 0 : latchOpenAngle;
        const diff = target - latchAngles[i];
        latchAngles[i] += Math.sign(diff) * Math.min(Math.abs(diff), dt * 8);
      }
    }

    // Cart motor
    cartMotor = translator(0, railHeight, cartZ);

    // Wheel motors
    const spin = m23(-totalDist / wheelRadius / 2);
    wheelPointMotors = wheelPoints.map(w => {
      w.motor = w.bindMotor.gp(spin);
      return w.motor;
    });
  });

  // Colors 
  const railColor = 0x888888;
  const supportColor = 0x666666;
  const wheelColor = 0x333333;
  const cartColor = 0x4477aa;
  const hookColor = 0xaa7744;
  const tripBarColor = 0xcc4444;
  const latchClosedColor = 0x44aa44;
  const latchOpenColor = 0xaa4444;
  const strikerColor = 0xdddd44;
  const linkageColor = 0xcc4444;

  // Support column positions
  const supportPositions = Array.from({ length: numSupports }, (_, i) => -railLength / 2 + (railLength / (numSupports - 1)) * i);
</script>

<!--  Striker (fixed bumper at end of rail)  -->
<T.Group position.z={strikerZ}>
  <!-- Vertical bracket hanging from rail level -->
  <T.Mesh position.y={railHeight - strikerBracketH / 2}>
    <T.BoxGeometry args={[strikerPlateD, strikerBracketH, strikerPlateD]} />
    <T.MeshStandardMaterial color={strikerColor} />
  </T.Mesh>
  <!-- Bumper plate at trip bar height -->
  <T.Mesh position.y={railHeight + tripBarY}>
    <T.BoxGeometry args={[strikerPlateW, strikerPlateH, strikerPlateD]} />
    <T.MeshStandardMaterial color={strikerColor} />
  </T.Mesh>
</T.Group>

<!--  Rails (round bar stock, along Z at railHeight)  -->
{#each [-1, 1] as side}
  {@const rx = side * railGap / 2}
  <!-- Round bar rail -->
  <T.Mesh position.x={rx} position.y={railHeight} rotation.x={Math.PI / 2}>
    <T.CylinderGeometry args={[railBarRadius, railBarRadius, railLength, 16]} />
    <T.MeshStandardMaterial color={railColor} metalness={0.6} roughness={0.3} />
  </T.Mesh>

  <!-- Support columns for this rail -->
  {#each supportPositions as sz}
    <T.Mesh
      position.x={rx}
      position.y={railHeight / 2}
      position.z={sz}
    >
      <T.CylinderGeometry args={[supportRadius, supportRadius, railHeight, 8]} />
      <T.MeshStandardMaterial color={supportColor} />
    </T.Mesh>
  {/each}
{/each}

<!--  Cart (hangs below rails, moves along Z)  -->
<MotorGroup motor={cartMotor}>
  <!-- Cart frame: two side bars + two cross bars -->
  <!-- Left side bar -->
  <T.Mesh position.x={-cartWidth / 2} position.y={-cartHangDepth / 2}>
    <T.BoxGeometry args={[cartFrameH, cartHangDepth, cartDepth]} />
    <T.MeshStandardMaterial color={cartColor} />
  </T.Mesh>
  <!-- Right side bar -->
  <T.Mesh position.x={cartWidth / 2} position.y={-cartHangDepth / 2}>
    <T.BoxGeometry args={[cartFrameH, cartHangDepth, cartDepth]} />
    <T.MeshStandardMaterial color={cartColor} />
  </T.Mesh>
  <!-- Front cross bar -->
  <T.Mesh position.y={-cartHangDepth} position.z={cartDepth / 2}>
    <T.BoxGeometry args={[cartWidth, cartFrameH, cartFrameH]} />
    <T.MeshStandardMaterial color={cartColor} />
  </T.Mesh>
  <!-- Back cross bar -->
  <T.Mesh position.y={-cartHangDepth} position.z={-cartDepth / 2}>
    <T.BoxGeometry args={[cartWidth, cartFrameH, cartFrameH]} />
    <T.MeshStandardMaterial color={cartColor} />
  </T.Mesh>

  <!-- ═══ TRIP BAR MECHANISM (all slides together along Z) ═══ -->
  {@const tripZ = tripBarRestZ + tripBarOffset}

  <!-- Guide rods (fixed to cart, show the sliding track) -->
  {#each [-1, 1] as gs}
    <T.Mesh
      position.x={gs * tripBarLength * 0.4}
      position.y={tripBarY}
      position.z={tripBarRestZ + guideRodLength / 2 - tripBarSize}
      rotation.x={Math.PI / 2}
    >
      <T.CylinderGeometry args={[guideRodRadius, guideRodRadius, guideRodLength, 6]} />
      <T.MeshStandardMaterial color={cartColor} />
    </T.Mesh>
  {/each}

  <!-- Trip bar (slides along Z on the guide rods) -->
  <T.Mesh position.y={tripBarY} position.z={tripZ}>
    <T.BoxGeometry args={[tripBarLength, tripBarSize, tripBarSize]} />
    <T.MeshStandardMaterial color={tripBarColor} />
  </T.Mesh>

  <!-- Push rods (vertical, connect trip bar down to release bars) -->
  {#each [-1, 1] as bankSide}
    {@const px = bankSide * bankSpacingX / 2}
    {@const rodTopY = tripBarY - tripBarSize / 2}
    {@const rodBotY = hookBarY}
    {@const rodLen = rodTopY - rodBotY}
    <T.Mesh
      position.x={px}
      position.y={(rodTopY + rodBotY) / 2}
      position.z={tripZ}
    >
      <T.CylinderGeometry args={[pushRodRadius, pushRodRadius, rodLen, 6]} />
      <T.MeshStandardMaterial color={linkageColor} />
    </T.Mesh>
  {/each}

  <!-- Release bars (horizontal, at hook level, slide with trip bar) -->
  {#each [-1, 1] as bankSide}
    {@const bx = bankSide * bankSpacingX / 2}
    <T.Mesh position.x={bx} position.y={hookBarY} position.z={tripZ}>
      <T.BoxGeometry args={[releaseBarSize, releaseBarSize, cartDepth * 0.7]} />
      <T.MeshStandardMaterial color={linkageColor} />
    </T.Mesh>

    <!-- Cam fingers , one per latch on this bank, protrude backward from release bar -->
    {#each Array.from({ length: hooksPerBank }, (_, i) => i) as hi}
      {@const hz = -cartDepth * 0.3 + hi * hookSpacingZ}
      <T.Mesh
        position.x={bx}
        position.y={hookBarY - camFingerLength / 2}
        position.z={hz}
      >
        <T.BoxGeometry args={[camFingerThickness, camFingerLength, camFingerThickness]} />
        <T.MeshStandardMaterial color={linkageColor} />
      </T.Mesh>
    {/each}
  {/each}

  <!-- Hook bars, two banks of 3, with pivoting cam latches -->
  {#each [-1, 1] as bankSide}
    {@const bx = bankSide * bankSpacingX / 2}
    <!-- Bar -->
    <T.Mesh position.x={bx} position.y={hookBarY}>
      <T.BoxGeometry args={[cartFrameH * 0.8, cartFrameH * 0.8, cartDepth * 0.7]} />
      <T.MeshStandardMaterial color={hookColor} />
    </T.Mesh>
  {/each}

  <!-- Cam latches (one per hook, pivot about X axis) -->
  {#each hookPositions as hook}
    {@const angle = latchAngles[hook.index]}
    {@const closed = latches[hook.index]}
    <T.Group position.x={hook.x} position.y={hookBarY - 0.02} position.z={hook.z}>
      <!-- Pivot point at top; latch arm swings down when closed, forward when open -->
      <T.Group rotation.x={angle}>
        <!-- Latch arm -->
        <T.Mesh position.y={-latchLength / 2}>
          <T.BoxGeometry args={[latchThickness, latchLength, latchThickness]} />
          <T.MeshStandardMaterial color={closed ? latchClosedColor : latchOpenColor} />
        </T.Mesh>
        <!-- Hook tip (small sphere at bottom of latch) -->
        <T.Mesh position.y={-latchLength}>
          <T.SphereGeometry args={[latchThickness * 0.8, 6, 6]} />
          <T.MeshStandardMaterial color={closed ? latchClosedColor : latchOpenColor} />
        </T.Mesh>
      </T.Group>
    </T.Group>
  {/each}

  <!-- Wheel pairs (two scooter wheels straddling each bar) -->
  {#each wheelPointMotors as motor}
    <MotorGroup {motor}>
      {#each [-1, 1] as ws}
        <T.Mesh position.x={ws * wheelCant} rotation.z={Math.PI / 2}>
          <T.CylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 12]} />
          <T.MeshStandardMaterial color={wheelColor} />
        </T.Mesh>
      {/each}
    </MotorGroup>
  {/each}
</MotorGroup>
