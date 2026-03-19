import type { Multivector as MV } from '../../algebra/types.js';
import { e01, e02, e123 } from '../../algebra/pga';
import { stateDerivWithInertia } from '../../physics/pgaDynamics';
import type { InertiaMap, RigidBodyState } from './types';

/** The PGA origin point (e123). */
export const origin = e123;

/**
 * Gravity forque in the body frame.
 *
 * Transforms the ideal world-frame gravity bivector into the body frame,
 * then dualises to obtain a forque.
 */
export function gravityForque(Mrev: MV, g: number): MV {
  return Mrev.sandwich(e02.smul(g)).dual();
}

/**
 * Damping forque: body-frame drag proportional to the rate B.
 */
export function dampingForque(B: MV, coefficient: number): MV {
  return B.smul(-coefficient).dual();
}

/**
 * Rigid-body evolution helpers built on PGA state (M, B).
 *
 * Paper context: "May The Forque Be With You" (Dorst & De Keninck)
 * https://bivector.net/PGAdyn.html
 *
 * Dynamics used:
 * - Kinematics: Mdot = -1/2 M B (§2.1.2, §2.5)
 * - Body-rate dynamics: Bdot = I^-1[ B x I[B] + F ] (§2.5, equations of motion)
 *
 * This file provides practical wrappers around those equations for simulation code.
 */

/**
 * Evaluate time derivative (Mdot, Bdot) from current state and body-frame forque.
 */
export function derivRigidBody(
  state: RigidBodyState
  , forqueBody: MV
  , inertia: InertiaMap
  , inertiaInv: InertiaMap
): [MV, MV] {
  return stateDerivWithInertia(state.M, state.B, forqueBody, inertia, inertiaInv);
}

/**
 * Semi-implicit/midpoint rigid-body step.
 *
 * Why midpoint commutator:
 * - The B x I[B] term can be stiff under contacts and large angular rates.
 * - Midpoint evaluation is more stable than naive forward Euler for this term.
 */
export function stepRigidBodySemiImplicit(
  state: RigidBodyState
  , forqueBody: MV
  , inertia: InertiaMap
  , inertiaInv: InertiaMap
  , dt: number
): RigidBodyState {
  const { M, B } = state;

  // Midpoint commutator preserves energy better than forward Euler for stiff contacts.
  const IB = inertia(B);
  const comm0 = B.gp(IB).sub(IB.gp(B)).smul(0.5);
  const Bhalf = B.add(inertiaInv(comm0).smul(0.5 * dt)).selectGrade(2);

  const IBhalf = inertia(Bhalf);
  const commMid = Bhalf.gp(IBhalf).sub(IBhalf.gp(Bhalf)).smul(0.5);

  const dB = inertiaInv(forqueBody.add(commMid));
  const Bnew = B.add(dB.smul(dt)).selectGrade(2);
  const Mnew = M.add(M.gp(Bnew).smul(-0.5 * dt)).normalize();

  return { M: Mnew, B: Bnew };
}

/**
 * Convert body-frame rate to world-frame rate by sandwiching through motor M.
 */
export function worldRate(state: RigidBodyState): MV {
  return state.M.sandwich(state.B).selectGrade(2);
}

/**
 * Convert a world-frame forque bivector to body-frame dual-bivector forque.
 *
 * This is the same frame-transport pattern used throughout the paper:
 *   F_body = (M~ F_world M)^*
 */
export function bodyForqueFromWorldForque(M: MV, worldForque: MV): MV {
  return M.reverse().sandwich(worldForque).selectGrade(2).dual();
}
