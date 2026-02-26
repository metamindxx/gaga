<script lang="ts">
  /**
   * OverheadRail.svelte -- Overhead rail system with cart
   *
   * The payload frame carries 6 hook/latch attachment points and hangs
   * below the cart held by latches.  At the loading station, two spreader
   * bars bridge the ceiling ropes to the frame:
   *   1. Cart arrives at loading end (+Z)
   *   2. Spreader bars hook onto frame
   *   3. Ropes lower frame via spreader bars
   *   4. Spreader bars unhook (out of worker's way)
   *   5. Worker attaches items, latches close
   *   6. Spreader bars re-hook, ropes raise frame
   *   7. Spreader bars unhook, cart departs to unload end (-Z)
   *   8. Trip bar hits striker → latches open → items drop
   *   9. Cart returns, repeat
   */

  import { T, useTask } from '@threlte/core';
  import { e01, e02, e03, e13, e23, one } from '../../algebra/pga';
  import type { Multivector as MV } from '../../algebra/types.js';
  import MotorGroup from '../../geometry/MotorGroup.svelte';
  import { config } from './overheadRailState.svelte';
  import { sequence, drive, tween, pause, stagger, call, type AnimStep } from '../../animation/steps';

  // Props
  interface Props {
    speed?: number;
    animate?: boolean;
    cartPosition?: number;
  }
  let {
    speed = 1.0
    , animate = true
    , cartPosition = 0
  }: Props = $props();

  let latches = config.latches;
  let tripBarPushed = $state(false);

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

  // Payload frame (rectangular frame that lowers on ropes at loading station)
  const frameWidth = cartWidth * 1.2;
  const frameDepth = cartDepth * 1.2;
  const frameBarSize = 0.04;
  const frameDropMax = 2.5;             // how far the frame lowers
  const ropeRadius = 0.008;             // thin rope lines

  // Spreader bars (2 bars that bridge ropes to frame, left + right sides)
  const spreaderBarLength = frameDepth + 0.1;  // slightly longer than frame depth
  const spreaderBarSize = 0.035;
  const spreaderHookSpeed = 4.0;        // radians/sec for hook swing animation

  // Loading station ropes (fixed to ceiling above +Z end)
  const ropeAnchorY = railHeight + 0.3; // beam above the rails
  // Frame top Y in world space when cart is at loading station:
  //   railHeight + hookBarY - frameDropY
  // Rope rest length (frame raised): ropeAnchorY - (railHeight + hookBarY)
  //   = 0.3 - hookBarY

  // Lowering / raising speeds
  const frameLowerSpeed = 1.5;          // units per second
  const frameRaiseSpeed = 1.0;
  const framePauseAtBottom = 1.0;       // seconds to pause when fully lowered

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

  let cartMotor = $state<MV>(one);
  let wheelPointMotors = $state<MV[]>([one, one, one, one]);

  // Trip bar animation
  let tripBarOffset = $state(0);          // 0 = resting, tripBarTravel = fully pushed
  let latchAngles = $state<number[]>([0, 0, 0, 0, 0, 0]);  // 0 = closed, latchOpenAngle = open

  // Frame lowering state
  let frameDropY = $state(0);  // 0 = raised, frameDropMax = fully lowered

  // Spreader bar state: hooked means bars are engaged with frame
  let spreadersHooked = $state(false);

  // ── Animation cycle (declarative sequence) ──────────────

  const latchCloseInterval = 0.4;

  /** Helper: drive cart along Z, tracking total distance for wheel spin. */
  function driveCart(target: number): AnimStep {
    return drive(
      () => cartZ, target, () => speed,
      (v) => { totalDist += Math.abs(v - cartZ); cartZ = v; }
    );
  }

  function buildCycle(): AnimStep {
    return sequence(
      // Arrive at loading station (+Z)
      driveCart(travelEnd),
      // Spreader bars hook onto frame
      call(() => { spreadersHooked = true; }),
      pause(0.3),
      // Lower frame on ropes via spreader bars
      tween(0, frameDropMax, frameDropMax / frameLowerSpeed, (v) => { frameDropY = v; }),
      // Unhook spreaders (out of worker's way)
      call(() => { spreadersHooked = false; }),
      pause(0.3),
      // Pause while worker attaches items
      pause(framePauseAtBottom),
      // Close latches one by one
      stagger(6, latchCloseInterval, (i) => { latches[i] = false; }),
      pause(latchCloseInterval),
      // Re-hook spreaders to raise frame
      call(() => { spreadersHooked = true; }),
      pause(0.3),
      // Raise frame
      tween(frameDropMax, 0, frameDropMax / frameRaiseSpeed, (v) => { frameDropY = v; }),
      // Unhook spreaders so cart can depart
      call(() => { spreadersHooked = false; }),
      pause(0.3),
      // Travel to unload station (-Z) — trip bar opens latches on arrival
      driveCart(travelStart),
      // Pause at unload (striker holds trip bar, latches stay open)
      pause(1.5),
    );
  }

  let activeAnim: AnimStep | null = null;

  // ── Animation loop ──────────────────────────────────────

  useTask((delta) => {
    const dt = delta;

    if (!animate) {
      cartZ = travelStart + cartPosition * travelRange;
      activeAnim = null;
    } else {
      // Tick the active sequence; rebuild when it completes (loop)
      if (!activeAnim || activeAnim(dt)) {
        activeAnim = buildCycle();
      }
    }

    // Reactive: trip bar engagement (position-based, not sequenced)
    const cartBackZ = cartZ - cartDepth / 2 - tripBarSize;
    const distToStriker = cartBackZ - strikerZ;
    const pushed = distToStriker < tripEngageDistance;
    tripBarPushed = pushed;

    if (pushed) {
      const pushAmount = Math.max(0, tripEngageDistance - distToStriker);
      tripBarOffset = Math.min(pushAmount, tripBarTravel);
      for (let i = 0; i < 6; i++) {
        latchAngles[i] = Math.max(latchAngles[i] - dt * 8, 0);
        latches[i] = true;
      }
    } else {
      tripBarOffset = Math.max(0, tripBarOffset - dt * 4);
      for (let i = 0; i < 6; i++) {
        const target = latches[i] ? 0 : latchOpenAngle;
        const diff = target - latchAngles[i];
        latchAngles[i] += Math.sign(diff) * Math.min(Math.abs(diff), dt * 8);
      }
    }

    // Motor updates
    cartMotor = translator(0, railHeight, cartZ);
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
  const frameColor = 0x996633;
  const ropeColor = 0xccaa66;
  const loadingStationColor = 0x777744;
  const spreaderColor = 0x556677;

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
  <!-- (these are on the cart, the trip bar / linkage stays with the cart) -->
  {#each [-1, 1] as bankSide}
    {@const bx = bankSide * bankSpacingX / 2}
    <!-- Bar -->
    <T.Mesh position.x={bx} position.y={hookBarY}>
      <T.BoxGeometry args={[cartFrameH * 0.8, cartFrameH * 0.8, cartDepth * 0.7]} />
      <T.MeshStandardMaterial color={hookColor} />
    </T.Mesh>
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

  <!-- ═══ PAYLOAD FRAME (lowers on ropes, carries the latches) ═══ -->

  <!-- Frame group: rectangle + latches, all lower together -->
  <T.Group position.y={hookBarY - frameDropY}>
    <!-- Front bar -->
    <T.Mesh position.z={frameDepth / 2}>
      <T.BoxGeometry args={[frameWidth, frameBarSize, frameBarSize]} />
      <T.MeshStandardMaterial color={frameColor} />
    </T.Mesh>
    <!-- Back bar -->
    <T.Mesh position.z={-frameDepth / 2}>
      <T.BoxGeometry args={[frameWidth, frameBarSize, frameBarSize]} />
      <T.MeshStandardMaterial color={frameColor} />
    </T.Mesh>
    <!-- Left bar -->
    <T.Mesh position.x={-frameWidth / 2}>
      <T.BoxGeometry args={[frameBarSize, frameBarSize, frameDepth]} />
      <T.MeshStandardMaterial color={frameColor} />
    </T.Mesh>
    <!-- Right bar -->
    <T.Mesh position.x={frameWidth / 2}>
      <T.BoxGeometry args={[frameBarSize, frameBarSize, frameDepth]} />
      <T.MeshStandardMaterial color={frameColor} />
    </T.Mesh>

    <!-- Cam latches (6 attachment points on the frame, pivot about X axis) -->
    {#each hookPositions as hook}
      {@const angle = latchAngles[hook.index]}
      {@const closed = latches[hook.index]}
      <T.Group position.x={hook.x} position.y={-0.02} position.z={hook.z}>
        <T.Group rotation.x={angle}>
          <!-- Latch arm -->
          <T.Mesh position.y={-latchLength / 2}>
            <T.BoxGeometry args={[latchThickness, latchLength, latchThickness]} />
            <T.MeshStandardMaterial color={closed ? latchClosedColor : latchOpenColor} />
          </T.Mesh>
          <!-- Hook tip -->
          <T.Mesh position.y={-latchLength}>
            <T.SphereGeometry args={[latchThickness * 0.8, 6, 6]} />
            <T.MeshStandardMaterial color={closed ? latchClosedColor : latchOpenColor} />
          </T.Mesh>
        </T.Group>
      </T.Group>
    {/each}
  </T.Group>
</MotorGroup>

<!-- ═══ LOADING STATION (fixed at +Z end, ceiling-mounted ropes + spreader bars) ═══ -->

<!-- Ceiling beam across width at loading station -->
<T.Mesh position.x={0} position.y={ropeAnchorY} position.z={travelEnd}>
  <T.BoxGeometry args={[spreaderBarLength + 0.2, 0.06, 0.06]} />
  <T.MeshStandardMaterial color={loadingStationColor} />
</T.Mesh>

<!-- 2 spreader bars (left + right sides) with 2 ropes each -->
{#each [-1, 1] as sideSign}
  {@const barX = sideSign * frameWidth / 2}
  {@const frameTopWorldY = railHeight + hookBarY - frameDropY}
  {@const barWorldY = spreadersHooked ? frameTopWorldY + spreaderBarSize / 2 : ropeAnchorY - 0.1}
  {@const ropeBotY = barWorldY - spreaderBarSize / 2}

  <!-- Spreader bar (runs along Z) -->
  <T.Mesh
    position.x={barX}
    position.y={barWorldY}
    position.z={travelEnd}
    rotation.y={Math.PI / 2}
  >
    <T.BoxGeometry args={[spreaderBarLength, spreaderBarSize, spreaderBarSize]} />
    <T.MeshStandardMaterial color={spreaderColor} />
  </T.Mesh>

  <!-- 2 ropes from ceiling beam to spreader bar ends -->
  {#each [-1, 1] as endSign}
    {@const ropeZ = travelEnd + endSign * frameDepth / 2}
    {@const ropeLen = Math.max(0.01, ropeAnchorY - ropeBotY)}
    <T.Mesh
      position.x={barX}
      position.y={ropeAnchorY - ropeLen / 2}
      position.z={ropeZ}
      scale.y={ropeLen}
    >
      <T.CylinderGeometry args={[ropeRadius, ropeRadius, 1, 4]} />
      <T.MeshStandardMaterial color={ropeColor} />
    </T.Mesh>
  {/each}
{/each}
