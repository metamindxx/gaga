<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { Decal } from '@threlte/extras';
  import { CanvasTexture } from 'three';
  import { pga, zero, e01, e02, e03, e12, e13, e23, one, e2, e0 } from '../../algebra/pga';
  import type { Multivector as MV } from '../../algebra/types.js';
  import { config } from './spinLabState.svelte';
  import MotorGroup from '../../geometry/MotorGroup.svelte';
  import Plane from '../../geometry/Plane.svelte';
  import Sphere from '../../geometry/Sphere.svelte';
  import { onMount, onDestroy } from 'svelte';
  import { origin, sphereInertia, sphereInertiaInv } from '../../physics/pgaDynamics';

  // Extract the rotor part of a motor
  function rotorOf(M: MV): MV {
    return one
      .smul(M.basisSVal('e_'))
      .add(e23.smul(M.basisSVal('e_23')))
      .add(e13.smul(M.basisSVal('e_13')))
      .add(e12.smul(M.basisSVal('e_12')));
  }

  // =======
  // Simulation state and config
  // =======
  const BALL_RADIUS = 0.02857;
  const BALL_MASS = 0.17;
  const GRAVITY = -9.81;
  const GROUND_STIFFNESS = 5000;
  const GROUND_DAMPING = 100;
  const SLIDE_MU = 0.2;
  const ROLL_DAMPING = 0.5;
  const LINEAR_DAMPING = 0.01;

  // Active simulation state
  let dropped = $state(false);
  let M = $state(pga.translator([0, config.dropHeight, 0], 1));
  let B = $state(zero);

  // Config panel -> simulation state
  let rate_world = $derived.by(() => {
    const { vx, vy, vz, wx, wy, wz } = config;
    return e01
      .smul(vx)
      .add(e02.smul(vy))
      .add(e03.smul(vz))
      .add(e23.smul(wx))
      .add(e13.smul(wy))
      .add(e12.smul(wz));
  });

  let rate_body = $derived(rotorOf(M).reverse().sandwich(rate_world).selectGrade(2));

  // ========
  // Listeners and lifecycle
  // ========

  // Reset to suspended state
  function reset() {
    dropped = false;
    M = pga.translator([0, config.dropHeight, 0], 1);
    B = rate_world;
  }

  function drop() {
    if (dropped) return;
    B = rate_body;
    dropped = true;
  }

  // Listen for drop/reset events from config panel
  function onDrop() {
    drop();
  }
  function onReset() {
    reset();
  }
  onMount(() => {
    window.addEventListener('spinlab-drop', onDrop);
    window.addEventListener('spinlab-reset', onReset);
    reset();
  });
  onDestroy(() => {
    window.removeEventListener('spinlab-drop', onDrop);
    window.removeEventListener('spinlab-reset', onReset);
  });

  // ========
  // Simulation loop
  // ========

  // Ground plane: e2 is the plane y=0 in PGA.
  const groundPlane = e2;

  function simulate(M: MV, B: MV, dt: number) {
    const R = rotorOf(M);
    const P = M.sandwich(origin);
    // y-coordinate: e_013 coefficient of normalised point (e_123 = 1).
    const pen = BALL_RADIUS - P.basisSVal('e_013');

    const Q_contact = pga.point([0, -BALL_RADIUS, 0]);
    const N_Q = groundPlane.gp(Q_contact).selectGrade(2);

    // Gravity forque: F_grav = e0 ∧ (m·g·ê₂)
    let F_w = e0.op(e2.smul(BALL_MASS * GRAVITY));
    let normalForce = 0;

    if (pen > 0) {
      // World-frame velocity (rotor only, no translator coupling).
      const V_w = R.sandwich(B);
      // Normal speed at CoM: algebraic formula avoids sign ambiguity.
      const dP = origin.cross(V_w);
      const vDotN = -dP.op(groundPlane).bVal('e_0123');

      // Normal force (spring-damper).
      // No max(0,...), dashpot must decelerate upward motion inside contact.
      // Clamp c for explicit-Euler stability: c·dt/m ≤ 1.
      const stableC = Math.min(GROUND_DAMPING, BALL_MASS / dt);
      normalForce = GROUND_STIFFNESS * pen - stableC * vDotN;
      F_w = F_w.add(e0.op(groundPlane).smul(normalForce));

      // Friction: Coulomb sliding model.
      const vx = V_w.bVal('e_01')
        , vz = V_w.bVal('e_03');
      const dwx = V_w.bVal('e_23') - vz / BALL_RADIUS; // slip about x
      const dwy = V_w.bVal('e_13'); // English (vertical spin)
      const dwz = V_w.bVal('e_12') + vx / BALL_RADIUS; // slip about z
      const slipSpeed = BALL_RADIUS * Math.sqrt(dwx * dwx + dwy * dwy + dwz * dwz);

      const SLIP_THRESHOLD = 1e-4;
      if (slipSpeed > SLIP_THRESHOLD) {
        const I_rot = (2 / 5) * BALL_MASS * BALL_RADIUS * BALL_RADIUS;
        const effectiveInvMass = 1 / BALL_MASS + (BALL_RADIUS * BALL_RADIUS) / I_rot;
        const maxFriction = slipSpeed / (effectiveInvMass * dt);
        const frictionMag = Math.min(SLIDE_MU * normalForce, maxFriction);

        const V_Q = Q_contact.join(Q_contact.cross(V_w));
        const vn_q = V_Q.scalarProduct(N_Q);
        const V_tan = V_Q.sub(N_Q.smul(vn_q));
        const tanSq = V_tan.scalarProduct(V_tan);

        if (tanSq > 1e-16) {
          F_w = F_w.add(V_tan.dual().smul(frictionMag / Math.sqrt(tanSq)));
        }
      }
    }

    // Body-frame transform: F_b = R̃ F_w R, then dualise.
    const F_b = R.reverse().sandwich(F_w).selectGrade(2).dual();

  const dampRate = pen > 0 ? ROLL_DAMPING : LINEAR_DAMPING;
  const I = (b: MV) => sphereInertia(b, BALL_MASS, BALL_RADIUS);
  const Iinv = (p: MV) => sphereInertiaInv(p, BALL_MASS, BALL_RADIUS);
    const bodyDamping = I(B).smul(-dampRate);

    // Midpoint precession for stability at high spin rates.
    const IB = I(B);
    const precession = B.cross(IB);
    const B_half = B.add(Iinv(precession).smul(0.5 * dt)).selectGrade(2);
    const IB_half = I(B_half);
    const precession_mid = B_half.cross(IB_half);

    const dB = Iinv(precession_mid.add(F_b).add(bodyDamping));
    const B_new = B.add(dB.smul(dt)).selectGrade(2);
    const M_new = M.add(M.gp(B).smul(-0.5 * dt)).normalize();
    return [M_new, B_new];
  }

  useTask((delta) => {
    const dt = Math.min(delta, 1) / config.stepsPerFrame;

    if (!dropped) {
      // Suspended preview: world config -> body rate, then apply rotation-only part.
      const rotRate = e23
        .smul(rate_body.bVal('e_23'))
        .add(e13.smul(rate_body.bVal('e_13')))
        .add(e12.smul(rate_body.bVal('e_12')));
      B = rotRate;
      M = M.add(M.gp(B).smul(-0.5 * dt)).normalize();
      // Motor = T·R so rotation is in body frame (about ball centre, not world origin)
      const R_part = rotorOf(M);
      M = pga.translator([0, config.dropHeight, 0], 1).gp(R_part);
      return;
    }

    for (let step = 0; step < config.stepsPerFrame; step++) {
      const [M1, B1] = simulate(M, B, dt);
      M = M1;
      B = B1;
    }
  });

  // Decal texture for rotation visualisation
  function makeDotTexture(): CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${size * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', size / 2, size / 2);
    const tex = new CanvasTexture(canvas);
    tex.flipY = false;
    return tex;
  }
  const ballTexture = makeDotTexture();
  const DECAL_SCALE: [number, number, number] = [
    BALL_RADIUS * 0.9
    , BALL_RADIUS * 0.9
    , BALL_RADIUS * 0.9
  ];

  // Pre-drop launch indicator
  const launchSpeed = $derived(
    Math.sqrt(config.vx * config.vx + config.vy * config.vy + config.vz * config.vz)
  );
  const launchArrowVisible = $derived(!dropped && launchSpeed > 1e-6);
  const launchDirX = $derived(launchSpeed > 1e-6 ? config.vx / launchSpeed : 0);
  const launchDirY = $derived(launchSpeed > 1e-6 ? config.vy / launchSpeed : 0);
  const launchDirZ = $derived(launchSpeed > 1e-6 ? config.vz / launchSpeed : 1);
  const launchYaw = $derived(Math.atan2(launchDirX, launchDirZ));
  const launchPitch = $derived(-Math.asin(Math.max(-1, Math.min(1, launchDirY))));
  const launchLength = $derived(Math.min(0.8, 0.04 + launchSpeed * 0.06));
  const launchShaftLength = $derived(launchLength * 0.72);
  const launchHeadLength = $derived(launchLength * 0.28);
  const launchShaftRadius = $derived(BALL_RADIUS * 0.11);
  const launchHeadRadius = $derived(BALL_RADIUS * 0.2);

  // Pre-drop spin indicator
  const spinSpeed = $derived(
    Math.sqrt(config.wx * config.wx + config.wy * config.wy + config.wz * config.wz)
  );
  const spinIndicatorVisible = $derived(!dropped && spinSpeed > 1e-6);
  const spinDotOffset = $derived(BALL_RADIUS * 1.18);
  const spinDotRadius = $derived(
    BALL_RADIUS * (0.07 + Math.min(0.05, spinSpeed / 2400))
  );
</script>

<!-- Ball -->
<MotorGroup motor={M}>
  <T.Mesh>
    <T.SphereGeometry args={[BALL_RADIUS, 32, 32]} />
    <T.MeshStandardMaterial color={0xcc2200} />
    <Decal src={ballTexture} position={[0, 0, -BALL_RADIUS]} scale={DECAL_SCALE} />
  </T.Mesh>
</MotorGroup>

{#if launchArrowVisible}
  <T.Group position.y={config.dropHeight} rotation.x={launchPitch} rotation.y={launchYaw}>
    <T.Mesh rotation.x={Math.PI / 2} position.z={launchShaftLength * 0.5}>
      <T.CylinderGeometry args={[launchShaftRadius, launchShaftRadius, launchShaftLength, 12]} />
      <T.MeshStandardMaterial color={0xffd84d} />
    </T.Mesh>
    <T.Mesh rotation.x={Math.PI / 2} position.z={launchShaftLength + launchHeadLength * 0.5}>
      <T.ConeGeometry args={[launchHeadRadius, launchHeadLength, 12]} />
      <T.MeshStandardMaterial color={0xffa726} />
    </T.Mesh>
  </T.Group>
{/if}

{#if spinIndicatorVisible}
  <MotorGroup motor={M}>
    <Sphere center={[spinDotOffset, 0, 0]} radius={spinDotRadius} color={0x8cf4ff} />
    <Sphere center={[-spinDotOffset, 0, 0]} radius={spinDotRadius} color={0x8cf4ff} />
    <Sphere center={[0, spinDotOffset, 0]} radius={spinDotRadius} color={0x7de8ff} />
    <Sphere center={[0, -spinDotOffset, 0]} radius={spinDotRadius} color={0x7de8ff} />
    <Sphere center={[0, 0, spinDotOffset]} radius={spinDotRadius} color={0x6ddaff} />
    <Sphere center={[0, 0, -spinDotOffset]} radius={spinDotRadius} color={0x6ddaff} />
  </MotorGroup>
{/if}

<!-- Ground plane -->
<Plane size={2} color={0x006633} opacity={1} />
