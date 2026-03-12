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

import { pga, e01, e02, e03 } from '../algebra/pga';
import type { Multivector as MV } from '../algebra/types.js';

/** The PGA origin point */
export const origin = pga.point([0, 0, 0]);

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
): MV {
  const M = state[i][0];
  const B = state[i][1];
  const P = M.sandwich(origin);
  const Mrev = M.reverse();
  const V = M.sandwich(B);

  let total = e01.smul(0);
  for (let j = 0; j < state.length; j++) {
    if (j === i) continue;
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
      const vRel = (V.basisSVal('e_01') - Vj.basisSVal('e_01')) * nx
        + (V.basisSVal('e_02') - Vj.basisSVal('e_02')) * ny
        + (V.basisSVal('e_03') - Vj.basisSVal('e_03')) * nz;

      const contactForce = stiffness * overlap - contactDamping * vRel;
      const pushBivector = e01.smul(nx).add(e02.smul(ny)).add(e03.smul(nz))
        .smul(contactForce);
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
  const Vnormal = V.sub(groundPlane.sandwich(V)).smul(0.5);
  return Mrev.sandwich(
    e02.smul(stiffness * penalty).sub(Vnormal.smul(contactDamping))
  ).dual();
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

      const vnI = vels[i].basisSVal('e_01') * nx + vels[i].basisSVal('e_02') * ny + vels[i].basisSVal('e_03') * nz;
      const vnJ = vels[j].basisSVal('e_01') * nx + vels[j].basisSVal('e_02') * ny + vels[j].basisSVal('e_03') * nz;

      if (vnI - vnJ <= 0) continue;

      const impulse = e01.smul((vnJ - vnI) * nx)
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
  return [
    M.gp(B).smul(-0.5)
    , forque
      .sub(B.dual().gp(B).sub(B.gp(B.dual())).smul(0.5))
      .unDual()
  ];
}

/**
 * Forward Euler integration step (§2.5.2): advance a single body's state by dt.
 *
 * Motor is re-normalised to stay on the motor manifold.
 * Rate is grade-projected to stay a pure bivector.
 */
export function eulerStep(M: MV, B: MV, dM: MV, dB: MV, dt: number): [MV, MV] {
  return [
    M.add(dM.smul(dt)).normalize()
    , B.add(dB.smul(dt)).selectGrade(2)
  ];
}
