<script lang="ts">
  /**
   * Rolling Hill with Pure PGA physics.
   * State: Motor M + body-frame Rate bivector B.
   * Physics: forques in world frame, sandwiched to body, semi-implicit Euler.
   */
  import { T, useTask } from '@threlte/core';
  import { Decal } from '@threlte/extras';
  import { CanvasTexture } from 'three';
  import {
    pga
    , one
    , e0
    , e2
    , e3
    , e01
    , e02
    , e03
    , e12
    , e13
    , e23
  } from '../../algebra/pga';
  import type { Multivector as MV } from '../../algebra/types.js';
  import MotorGroup from '../../geometry/MotorGroup.svelte';
  import RenderMv from '$geometry/RenderMv.svelte';

  // Parameters
  const BALL_RADIUS = 0.3;
  const BALL_MASS   = 1.0;
  const I_ROT       = (2 / 5) * BALL_MASS * BALL_RADIUS * BALL_RADIUS;
  const GRAVITY     = -9.81;

  const SLOPE_ANGLE_DEG = 15;
  const SLOPE_ANGLE     = (SLOPE_ANGLE_DEG * Math.PI) / 180;

  const STIFFNESS       = 5000;
  const CONTACT_DAMPING = 50;
  const FRICTION_MU     = 0.1;
  const LINEAR_DAMPING  = 0.02;

  const DROP_HEIGHT     = 3;
  const STEPS_PER_FRAME = 10;

  // PGA helpers
  const origin = pga.point([0, 0, 0]);
  const zero   = e01.smul(0);
  const slopePlane = e2.smul(Math.cos(SLOPE_ANGLE)).add(e3.smul(-Math.sin(SLOPE_ANGLE)));

  /** Contact point offset from CoM (eq.(1.1): Q = O + q·I, with q = −R·n̂) */
  const Q_offset = pga.point([
    -BALL_RADIUS * slopePlane.bVal('e_1')
    , -BALL_RADIUS * slopePlane.bVal('e_2')
    , -BALL_RADIUS * slopePlane.bVal('e_3')
  ]);

  /** Normal line at contact point (§2.6: N = n · Q, inner product) */
  const N_Q = slopePlane.gp(Q_offset).selectGrade(2);

  /** Gravity forque (§2.3.1, eq.(2.25): F = ε ∧ f for force through origin) */
  const F_gravity = e0.op(e2.smul(BALL_MASS * GRAVITY));

  // Moving Masses (§2.2)
  //
  // The inertia map  I[B]  converts a velocity bivector B into a momentum
  // bivector P (§2.2.3, eq.(2.12): P = I[B]).
  //
  // Each bivector basis has an eigenvalue λ (§2.2.5, eq.(2.20)):
  //   ideal    bivectors (e01, e02, e03)  → λ = mass m        (translational)
  //   Euclidean bivectors (e23, e13, e12) → λ = I_rot = ⅖mr²  (rotational)
  //
  // Forward map:   P  = I[B]    (velocity → momentum)
  // Inverse map:   Ḃ  = I⁻¹[F]  (forque   → acceleration, eq.(2.21))
  //
  // The map Hodge-dualises the result (§2.2.6, eq.(2.22)),
  // swapping ideal ↔ Euclidean parts.
  //

  /** Eigenvalues of the body-frame inertia map, keyed by basis blade. */
  const INERTIA: Record<string, number> = {
    e_01: BALL_MASS   // x
    , e_02: BALL_MASS // y
    , e_03: BALL_MASS // z
    , e_23: I_ROT     // yz-plane, i.e. spin about x
    , e_13: I_ROT     // xz-plane, i.e. spin about y
    , e_12: I_ROT     // xy-plane, i.e. spin about z
  };

  const BLADE_KEYS = ['e_01', 'e_02', 'e_03', 'e_23', 'e_13', 'e_12'];
  const BLADE_ELEMS = [e01, e02, e03, e23, e13, e12];

  /**
   * Forward inertia map   I[B]:  velocity → momentum.
   * Scales each bivector component by its eigenvalue λ, then Hodge-dualises.
   *
   * §2.2.5 eq.(2.20): I[B] = Σ λᵢⱼ [B]ᵢⱼ eᵢⱼ
   * §2.2.6 eq.(2.22): dualisation swaps ideal ↔ Euclidean parts
   */
  function inertiaMap(B: MV): MV {
    let result = zero;
    for (let i = 0; i < 6; i++) {
      const coeff = B.bVal(BLADE_KEYS[i]);
      if (coeff) result = result.add(BLADE_ELEMS[i].smul(coeff * INERTIA[BLADE_KEYS[i]]));
    }
    return result.dual();
  }

  /**
   * Inverse inertia map   I⁻¹[F]:  forque (force line) → acceleration.
   * Un-dualises, then scales each bivector component by 1/λ.
   *
   * §2.2.5 eq.(2.21)
   */
  function inertiaInvMap(F: MV): MV {
    const undualed = F.unDual();
    let result = zero;
    for (let i = 0; i < 6; i++) {
      const coeff = undualed.bVal(BLADE_KEYS[i]);
      if (coeff) result = result.add(BLADE_ELEMS[i].smul(coeff / INERTIA[BLADE_KEYS[i]]));
    }
    return result;
  }

  // State

  // Motor M encodes position and orientation (§2.5.4)
  let M = $state(one.sub(e02.smul(DROP_HEIGHT / 2)).sub(e03.smul(3 / 2)));
  // Body-frame rate bivector B (§2.1.2)
  let B = $state(e01.smul(0));

  // Rotor R part of motor (§2.1.5: transfer rates via rotor, not motor)
  let R = $derived(one.smul(M.bVal('e_'))
      .add(e23.smul(M.bVal('e_23')))
      .add(e13.smul(M.bVal('e_13')))
      .add(e12.smul(M.bVal('e_12'))));

  // Center of mass position in world frame
  let P = $derived(M.sandwich(origin));

  // World-frame velocity: Bw = R B R̃  (§2.1.3, after eq.(2.7))
  const V = $derived(R.sandwich(B));

  // CoM velocity as direction trivector (§2.1.4, eq.(2.10): Ẋ = X × Bw)
  const dP = $derived(origin.cross(V));

  // Signed distance from CoM to slope: P ∨ p (§1.3.2: join of point and plane)
  const penetration = $derived(BALL_RADIUS - P.join(slopePlane).bVal('e_'));

  // Decal texture
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
    ctx.fillText('1', size / 2, size / 2);
    const tex = new CanvasTexture(canvas);
    tex.flipY = false;
    return tex;
  }
  const ballTexture = makeDotTexture();
  const DECAL_SCALE: [number, number, number] = [BALL_RADIUS, BALL_RADIUS, BALL_RADIUS];

  // Physics
  function simulate(dt: number): void {
    // Accumulate world forque as a bivector
    let worldForque = F_gravity;

    // Contact forces (if ball is intersecting slope plane)
    if (penetration > 0) {
      // Normal speed at CoM: v·n via Ẋ ∧ n (pseudoscalar coefficient)
      const vDotN = -dP.op(slopePlane).bVal('e_0123'); // negative since e1230 = -e0123

      // Penalty spring-damper
      //   f_n = max(0, k·δ − c·δ̇)
      const normalForce = Math.max(0, STIFFNESS * penetration - CONTACT_DAMPING * vDotN);

      // Normal force through CoM (§2.3.1: ε ∧ n̂ is force line along normal)
      worldForque = worldForque.add(e0.op(slopePlane).smul(normalForce));

      // Contact velocity LINE (§2.6, eq.(2.10): V_Q = Q ∨ (Q × Bw))
      const V_Q = Q_offset.join(Q_offset.cross(V));

      // Tangential velocity: reject normal component (§2.6: N = n · Q)
      const vn = V_Q.scalarProduct(N_Q);
      const V_tan = V_Q.sub(N_Q.smul(vn));
      const slipSq = V_tan.scalarProduct(V_tan);

      if (slipSq > 1e-16) {
        // Coulomb friction
        const slipSpeed = Math.sqrt(slipSq);
        const effectiveInvMass = 1 / BALL_MASS + BALL_RADIUS * BALL_RADIUS / I_ROT;
        const maxFriction = slipSpeed / (effectiveInvMass * dt);
        const frictionMag = Math.min(FRICTION_MU * normalForce, maxFriction);

        // Friction forque (§2.3.2): scaled dual of tangential velocity line
        worldForque = worldForque.add(V_tan.dual().smul(frictionMag / slipSpeed));
      }
    }

    // Rotate world forque to body frame (eq.(2.28): Fb = R̃ Fw R)
    // then dualise (§2.2.6: inertia dualises, so forques must match)
    const bodyForque = R.reverse().sandwich(worldForque).selectGrade(2).dual();

    // Body-frame damping (§2.5.7: Fd = *(−αB), damps all 6 DOF)
    const bodyDamping = B.dual().smul(-LINEAR_DAMPING * BALL_MASS);

    // Dynamics (eq.(2.28): Ḃ = I⁻¹[B × I[B] + F])
    const precession = B.cross(inertiaMap(B));
    const dB = inertiaInvMap(precession.add(bodyForque).add(bodyDamping));

    B = B.add(dB.smul(dt)).selectGrade(2);

    // eq.(2.29): Ṁ = −½ M B
    const dM = M.gp(B).smul(-0.5);
    M = M.add(dM.smul(dt)).normalize();
  }

  // Physics loop
  useTask((delta) => {
    const dt = Math.min(delta, 1 / 30) / STEPS_PER_FRAME;
    for (let step = 0; step < STEPS_PER_FRAME; step++) {
      simulate(dt);
    }
  });
</script>

<!-- Ball using sphere geometry with decal for better visualization of rotation -->
<MotorGroup motor={M}>
  <T.Mesh>
    <T.SphereGeometry args={[BALL_RADIUS, 32, 32]} />
    <T.MeshStandardMaterial color={0xcc2200} />
    <Decal src={ballTexture} position={[BALL_RADIUS, 0, 0]} scale={DECAL_SCALE} />
  </T.Mesh>
</MotorGroup>

<!-- Slope plane -->
<RenderMv mv={slopePlane} color={0x228833} lineWidth={2} />
