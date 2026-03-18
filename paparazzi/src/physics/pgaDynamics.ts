/**
 * PGA Dynamics: Shared physics utilities for rigid body simulation in 3D PGA Cl(3,0,1).
 *
 * Based on "May The Forque Be With You" by Dorst & De Keninck.
 * https://bivector.net/PGAdyn.html
 *
 * Terminology (following the paper):
 *   Motor M       - even-grade multivector encoding position & orientation (§2.1.1)
 *   Rate B        - body-frame bivector velocity, a.k.a. "bivector rate" (§2.1.2)
 *   Inertia I[B]  - maps rate bivector to momentum dual bivector (§2.2.3)
 *   Forque F      - dual bivector combining force and torque (§2.3.2)
 *   State [M, B]  - the full rigid-body state (§2.5.2)
 */

import { pga, e01, e02, e03, e12, e13, e23, e123 } from '../algebra/pga';
import type { Multivector as MV } from '../algebra/types.js';

/** The PGA origin point */
export const origin = e123;

// Utilities

/** Euclidean distance between two multivectors (from cheatsheet) */
export function dist(a: MV, b: MV): number {
  return a.normalize().cross(b.normalize()).dual().norm();
}

// Forque builders

/**
 * Gravity forque (body-frame dual bivector).
 *
 * transform the ideal world-frame gravity bivector into the body frame,
 * then dualise to obtain a forque.
 *
 */
export function gravityForque(Mrev: MV, g: number): MV {
  return Mrev.sandwich(e02.smul(g)).dual();
}

/**
 * Damping forque (body-frame drag proportional to the rate B).
 */
export function dampingForque(B: MV, coefficient: number): MV {
  return B.smul(-coefficient).dual();
}

/**
 * Spring-based (penalty) ball-ball contact forque for ball i.
 *
 */
export function springCollisionForque(
  i: number
  , state: [MV, MV][]
  , radius: number
  , stiffness: number
  , contactDamping: number
  , skipJ = -1
): MV {
  const M = state[i][0];
  const B = state[i][1];
  const P = M.sandwich(origin);
  const Mrev = M.reverse();
  const V = M.sandwich(B);

  let total = e01.smul(0);
  for (let j = 0; j < state.length; j++) {
    if (j === i) continue;
    if (j === skipJ) continue;
    const O = state[j][0].sandwich(origin);
    const d = dist(P, O);
    const overlap = 2 * radius - d;
    if (overlap > 0 && d > 1e-6) {
      // Extract coordinates for the contact normal direction.
      // P-O is a grade-3 ideal trivector, but we need a grade-2 ideal bivector
      // for the force direction.
      // TODO: Probably a more direct PGA way to do this
      const pCoords = pga.pointCoords(P)!;
      const oCoords = pga.pointCoords(O)!;
      const nx = (pCoords[0] - oCoords[0]) / d;
      const ny = (pCoords[1] - oCoords[1]) / d;
      const nz = (pCoords[2] - oCoords[2]) / d;

      const Vj = state[j][0].sandwich(state[j][1]);
      const vRel =
        (V.basisSVal('e_01') - Vj.basisSVal('e_01')) * nx +
        (V.basisSVal('e_02') - Vj.basisSVal('e_02')) * ny +
        (V.basisSVal('e_03') - Vj.basisSVal('e_03')) * nz;

      const contactForce = stiffness * overlap - contactDamping * vRel;
      if (contactForce <= 0) continue;
      const pushBivector = e01.smul(nx).add(e02.smul(ny)).add(e03.smul(nz)).smul(contactForce);
      total = total.add(Mrev.sandwich(pushBivector).dual());
    }
  }

  return total;
}

/**
 * Ground-plane contact forque for a single ball.
 *
 * This is the Hooke spring for a fixed infinite-mass plane.
 */
export function groundContactForque(
  M: MV
  , B: MV
  , radius: number
  , groundY: number
  , stiffness: number
  , contactDamping: number
): MV {
  const Mrev = M.reverse();
  const P = M.sandwich(origin);
  const groundPlane = pga.plane([0, 1, 0], groundY);
  const Preflected = groundPlane.sandwich(P);
  const height = dist(P, Preflected) / 2;
  const penalty = radius - height;
  if (penalty <= 0) return e01.smul(0);

  const V = M.sandwich(B);
  // Only damp translational normal velocity (Y component for ground plane).
  // Using the full bivector reflection picks up rotational components which,
  // at contactDamping / I_rot, overwhelms the Euler integrator.
  const vy = V.basisSVal('e_02');
  // Clamp: never let damping make the contact force attractive (sticky contact).
  const totalForce = Math.max(0, stiffness * penalty - contactDamping * vy);
  return Mrev.sandwich(e02.smul(totalForce)).dual();
}

/**
 * Coulomb friction forque for a sphere resting on the ground plane.
 *
 * Computes the tangential slip velocity at the contact point (bottom of sphere),
 * then applies a friction force opposing it. The force is applied at the contact
 * point, so it naturally generates both a translational force and a torque,
 * causing sliding → rolling transition.
 *
 * Contact-point velocity for a rigid sphere:
 *   v_contact = v_translation + ω × r_contact
 *
 * where r_contact = [0, -radius, 0] (center to bottom of ball).
 *
 * The tangential (horizontal) component of v_contact is the slip velocity.
 * Friction opposes it:  F_friction = -μ · N · v̂_slip  (Coulomb)
 *
 * This force is applied at the contact point, producing the forque:
 *   body-frame force bivector + torque from the lever arm.
 */
export function groundFrictionForque(
  M: MV
  , B: MV
  , radius: number
  , groundY: number
  , normalForce: number
  , mu: number
  , mass: number
  , dt: number
): MV {
  if (normalForce <= 0) return e01.smul(0);

  const Mrev = M.reverse();

  // World-frame velocity bivector
  const V = M.sandwich(B);

  // Extract translational velocity (ideal bivector components)
  const vx = V.basisSVal('e_01');
  const vz = V.basisSVal('e_03');

  // Extract angular velocity (Euclidean bivector components)
  // Convention: e23 → ωx, -e13 → ωy, e12 → ωz
  const wx = V.basisSVal('e_23');
  const wz = V.basisSVal('e_12');

  // Contact point offset from center: r = [0, -radius, 0]
  // v_contact = v_trans + ω × r
  // ω × [0, -R, 0] = [(-R)·wz, 0, -(-R)·wx] = [-R·wz, 0, R·wx]
  const vcx = vx + -radius * wz;
  const vcz = vz + radius * wx;

  // Tangential slip velocity (horizontal plane: remove y component)
  const slipSpeed = Math.sqrt(vcx * vcx + vcz * vcz);
  if (slipSpeed < 1e-8) return e01.smul(0);

  // Coulomb friction magnitude, clamped to prevent slip-velocity reversal
  const I_rot = (2 / 5) * mass * radius * radius;
  const effectiveInvMass = 1 / mass + (radius * radius) / I_rot;
  const maxFriction = slipSpeed / (effectiveInvMass * dt);
  const frictionMag = Math.min(mu * normalForce, maxFriction);

  // Friction force direction: oppose slip
  const fx = -frictionMag * (vcx / slipSpeed);
  const fz = -frictionMag * (vcz / slipSpeed);

  // Build world-frame force as ideal bivector (applied at contact point)
  // Force at the contact point = pure force + torque from lever arm
  // Pure translational force: fx·e01 + fz·e03
  // Torque from force at [0, -R, 0]: τ = r × F = [-R, 0, 0] crossed with... wait,
  // r = [0, -R, 0], F = [fx, 0, fz]
  // τ = r × F = [(-R)·fz - 0, 0·fx - 0·fz, 0 - (-R)·fx] = [-R·fz, 0, R·fx]
  // In PGA bivector: τx·e23 + τy·(-e13) + τz·e12
  const tx = -radius * fz; // τx
  const tz = radius * fx; // τz

  const worldForque = e01
    .smul(fx)
    .add(e03.smul(fz)) // force
    .add(e23.smul(tx))
    .add(e12.smul(tz)); // torque

  return Mrev.sandwich(worldForque).dual();
}

/**
 * Contact forque for a sphere against an arbitrary plane.
 *
 * Generalisation of groundContactForque to any plane orientation.
 * Returns the penalty spring + contact damping forque, plus the normal force magnitude
 * (needed for friction calculations).
 */
export function planeContactForque(
  M: MV
  , B: MV
  , plane: MV
  , planeNormal: [number, number, number]
  , radius: number
  , stiffness: number
  , contactDamping: number
): { forque: MV; normalForce: number } {
  const Mrev = M.reverse();
  const P = M.sandwich(origin);
  const Preflected = plane.sandwich(P);
  const height = dist(P, Preflected) / 2;
  const penalty = radius - height;
  if (penalty <= 0) return { forque: e01.smul(0), normalForce: 0 };

  const V = M.sandwich(B);
  // Normal approach velocity: only the TRANSLATIONAL component along the plane normal.
  // Using the full bivector reflection V.sub(plane.sandwich(V)) would also pick up
  // rotational components, which when damped at contactDamping / I_rot overwhelms the
  // Euler integrator and causes blowup.
  const nx = planeNormal[0]
    , ny = planeNormal[1]
    , nz = planeNormal[2];
  const vDotN = V.basisSVal('e_01') * nx + V.basisSVal('e_02') * ny + V.basisSVal('e_03') * nz;

  // Clamp total contact force to be non-negative.  Without this clamp, when the
  // ball is separating (vDotN > 0) the damping term can overpower the spring,
  // making the force ATTRACTIVE — pulling the ball back into the surface.
  // Each pull-back releases as a harder bounce, injecting energy every cycle.
  const totalNormalForce = Math.max(0, stiffness * penalty - contactDamping * vDotN);
  const worldForque = e01
    .smul(nx * totalNormalForce)
    .add(e02.smul(ny * totalNormalForce))
    .add(e03.smul(nz * totalNormalForce));

  return {
    forque: Mrev.sandwich(worldForque).dual()
    , normalForce: totalNormalForce
  };
}

/**
 * Friction forque for a sphere on an arbitrary plane.
 *
 * Generalisation of groundFrictionForque. The contact point is at center − R·normal.
 * Computes slip velocity at the contact point, applies Coulomb friction opposing it.
 */
export function planeFrictionForque(
  M: MV
  , B: MV
  , plane: MV
  , planeNormal: [number, number, number]
  , radius: number
  , normalForce: number
  , mu: number
  , mass: number
  , dt: number
): MV {
  if (normalForce <= 0) return e01.smul(0);

  const Mrev = M.reverse();
  const V = M.sandwich(B);

  // Translational velocity
  const vx = V.basisSVal('e_01');
  const vy = V.basisSVal('e_02');
  const vz = V.basisSVal('e_03');

  // Angular velocity
  const wx = V.basisSVal('e_23');
  const wy = -V.basisSVal('e_13');
  const wz = V.basisSVal('e_12');

  // Contact point offset: r = -radius * planeNormal (from center toward plane)
  const rx = -radius * planeNormal[0];
  const ry = -radius * planeNormal[1];
  const rz = -radius * planeNormal[2];

  // Contact point velocity: v_contact = v_trans + ω × r
  const vcx = vx + (wy * rz - wz * ry);
  const vcy = vy + (wz * rx - wx * rz);
  const vcz = vz + (wx * ry - wy * rx);

  // Project out the normal component to get tangential slip
  const vDotN = vcx * planeNormal[0] + vcy * planeNormal[1] + vcz * planeNormal[2];
  const slipX = vcx - vDotN * planeNormal[0];
  const slipY = vcy - vDotN * planeNormal[1];
  const slipZ = vcz - vDotN * planeNormal[2];

  const slipSpeed = Math.sqrt(slipX * slipX + slipY * slipY + slipZ * slipZ);
  if (slipSpeed < 1e-8) return e01.smul(0);

  // Coulomb friction opposing slip, clamped to prevent slip-velocity reversal.
  //
  // A tangential force F at the contact point changes slip speed at rate:
  //   dv_slip/dt = F * (1/m + R²/I)
  // For a solid sphere (I = 2/5·mR²): = F * 7/(2m)
  //
  // The maximum force that can stop slip in one dt without overshooting:
  //   F_max = slipSpeed / (dt * 7/(2m)) = slipSpeed * 2m / (7·dt)
  //
  // Without this clamp, explicit integration overshoots zero, reversing the
  // slip direction. Next step friction flips too → oscillation → energy growth.
  const I_rot = (2 / 5) * mass * radius * radius;
  const effectiveInvMass = 1 / mass + (radius * radius) / I_rot; // 7/(2m) for sphere
  const maxFriction = slipSpeed / (effectiveInvMass * dt);
  const frictionMag = Math.min(mu * normalForce, maxFriction);
  const fx = -frictionMag * (slipX / slipSpeed);
  const fy = -frictionMag * (slipY / slipSpeed);
  const fz = -frictionMag * (slipZ / slipSpeed);

  // Torque from force at contact point: τ = r × F
  const tx = ry * fz - rz * fy;
  const ty = rz * fx - rx * fz;
  const tz = rx * fy - ry * fx;

  const worldForque = e01
    .smul(fx)
    .add(e02.smul(fy))
    .add(e03.smul(fz))
    .add(e23.smul(tx))
    .add(e12.smul(tz))
    .add(e13.smul(-ty));

  return Mrev.sandwich(worldForque).dual();
}

// Inertia for a solid sphere

/**
 * Inertia map for a solid sphere: I[B].
 *
 * In PGA the rate bivector B has:
 *   - Ideal part (e01, e02, e03): translational velocity → scaled by mass m
 *   - Euclidean part (e23, e13, e12): angular velocity → scaled by (2/5)mR²
 *
 * I[B] returns the momentum (a dual bivector = B* with appropriate scaling).
 */
export function sphereInertia(B: MV, mass: number, radius: number): MV {
  const I_rot = (2 / 5) * mass * radius * radius;

  // Extract components
  const t01 = B.basisSVal('e_01');
  const t02 = B.basisSVal('e_02');
  const t03 = B.basisSVal('e_03');
  const r23 = B.basisSVal('e_23');
  const r13 = B.basisSVal('e_13');
  const r12 = B.basisSVal('e_12');

  // Scale: translation by mass, rotation by I_rot
  const scaledB = e01
    .smul(t01 * mass)
    .add(e02.smul(t02 * mass))
    .add(e03.smul(t03 * mass))
    .add(e23.smul(r23 * I_rot))
    .add(e13.smul(r13 * I_rot))
    .add(e12.smul(r12 * I_rot));

  return scaledB.dual();
}

/**
 * Inverse inertia map for a solid sphere: I⁻¹[P].
 *
 * Takes a dual bivector (momentum/forque) and returns a bivector (rate/acceleration).
 */
export function sphereInertiaInv(P: MV, mass: number, radius: number): MV {
  const I_rot = (2 / 5) * mass * radius * radius;
  const B = P.unDual();

  const t01 = B.basisSVal('e_01');
  const t02 = B.basisSVal('e_02');
  const t03 = B.basisSVal('e_03');
  const r23 = B.basisSVal('e_23');
  const r13 = B.basisSVal('e_13');
  const r12 = B.basisSVal('e_12');

  return e01
    .smul(t01 / mass)
    .add(e02.smul(t02 / mass))
    .add(e03.smul(t03 / mass))
    .add(e23.smul(r23 / I_rot))
    .add(e13.smul(r13 / I_rot))
    .add(e12.smul(r12 / I_rot));
}

/**
 * State derivative with explicit inertia (for non-unit-mass / non-isotropic bodies).
 *
 * Dynamics eq (2.28):  Ḃ = I⁻¹[ B × I[B] + F ]
 * Kinematics eq (2.29): Ṁ = -½ M B
 *
 * @param inertia  - function mapping B → I[B] (dual bivector: momentum)
 * @param inertiaInv - function mapping dual bivector → B (inverse inertia)
 * @param forque - total body-frame forque (dual bivector)
 */
export function stateDerivWithInertia(
  M: MV
  , B: MV
  , forque: MV
  , inertia: (B: MV) => MV
  , inertiaInv: (P: MV) => MV
): [MV, MV] {
  const IB = inertia(B);
  // Commutator product: B × I[B] = ½(B·IB - IB·B)
  const commutator = B.gp(IB).sub(IB.gp(B)).smul(0.5);
  return [M.gp(B).smul(-0.5), inertiaInv(forque.add(commutator))];
}

// Impulse collision resolution (§2.6)

/**
 * Impulse-based elastic collision for equal-mass spheres (ρ = 1).
 *
 * §2.6 eq (2.32-2.33): for two bodies at contact point Q with normal line N,
 *
 *   j = -(1+ρ) · (Q ∨ Q×(B₊ - B₋)) · Ñ
 *              / ((Q ∨ Q×(I₊⁻¹[N] - I⁻¹₋[N])) · Ñ)
 *
 * then update:  B± ← B± ± j I⁻¹±[N]
 *
 * Under our point-particle simplification (no rotational inertia, equal masses,
 * ρ = 1), this reduces to swapping normal-velocity components - the classic
 * 1D elastic collision result projected onto the contact normal.
 */
export function resolveImpulses(state: [MV, MV][], radius: number): [MV, MV][] {
  const vels = state.map(([M, B]) => M.sandwich(B));

  for (let i = 0; i < state.length; i++) {
    for (let j = i + 1; j < state.length; j++) {
      const posI = state[i][0].sandwich(origin);
      const posJ = state[j][0].sandwich(origin);
      const d = dist(posI, posJ);
      if (d >= 2 * radius || d < 1e-6) continue;

      const piCoords = pga.pointCoords(posI)!;
      const pjCoords = pga.pointCoords(posJ)!;
      const nx = (pjCoords[0] - piCoords[0]) / d;
      const ny = (pjCoords[1] - piCoords[1]) / d;
      const nz = (pjCoords[2] - piCoords[2]) / d;

      const vnI =
        vels[i].basisSVal('e_01') * nx +
        vels[i].basisSVal('e_02') * ny +
        vels[i].basisSVal('e_03') * nz;
      const vnJ =
        vels[j].basisSVal('e_01') * nx +
        vels[j].basisSVal('e_02') * ny +
        vels[j].basisSVal('e_03') * nz;

      if (vnI - vnJ <= 0) continue;

      const impulse = e01
        .smul((vnJ - vnI) * nx)
        .add(e02.smul((vnJ - vnI) * ny))
        .add(e03.smul((vnJ - vnI) * nz));
      vels[i] = vels[i].add(impulse);
      vels[j] = vels[j].sub(impulse);
    }
  }

  return state.map(([M, _B], i) => {
    const Mrev = M.reverse();
    const newB = Mrev.sandwich(vels[i]);
    return [M, newB] as [MV, MV];
  });
}

// Integration (§2.4.1, §2.5)

/**
 * Compute state derivative for a single body.
 *
 * Kinematics eq (2.29):  Ṁ = -½ M B
 * Dynamics eq (2.28):    Ḃ = I⁻¹[ B × I[B] + F ]
 *
 * With I[B] = B* (unit mass, equal inertias), this simplifies to:
 *   Ḃ = ( F + B × B* ).unDual()
 *     = ( F + ½(BB* - B*B) ).unDual()
 *
 * where × is the commutator product A × B = ½(AB - BA).
 *
 * @param forque - total body-frame forque (dual bivector)
 */
export function stateDeriv(M: MV, B: MV, forque: MV): [MV, MV] {
  return [M.gp(B).smul(-0.5), forque.sub(B.dual().gp(B).sub(B.gp(B.dual())).smul(0.5)).unDual()];
}

/**
 * Forward Euler integration step (§2.5.2): advance a single body's state by dt.
 *
 * Motor is re-normalised to stay on the motor manifold.
 * Rate is grade-projected to stay a pure bivector.
 */
export function eulerStep(M: MV, B: MV, dM: MV, dB: MV, dt: number): [MV, MV] {
  return [M.add(dM.smul(dt)).normalize(), B.add(dB.smul(dt)).selectGrade(2)];
}
