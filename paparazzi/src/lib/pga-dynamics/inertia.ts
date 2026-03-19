import type { Multivector as MV } from '../../algebra/types.js';
import { sphereInertia, sphereInertiaInv } from '../../physics/pgaDynamics';
import type { InertiaMap } from './types';

/**
 * Inertia helper maps and energy utilities.
 *
 * Paper context: "May The Forque Be With You" (Dorst & De Keninck)
 * https://bivector.net/PGAdyn.html
 *
 * Concepts in this file:
 * - I[B]: inertia map from body-rate bivector to momentum dual bivector (§2.2.3)
 * - I^-1[P]: inverse inertia map used in equations of motion (§2.5)
 * - Kinetic energy from the inertia pairing of B with I[B] (§2.2)
 */

/**
 * Construct the solid-sphere inertia map I[B] for mass/radius parameters.
 *
 * This wraps the shared physics implementation so scene/library code can depend
 * on a uniform InertiaMap callable.
 */
export function sphereInertiaMap(mass: number, radius: number): InertiaMap {
  return (B: MV) => sphereInertia(B, mass, radius);
}

/**
 * Construct the inverse solid-sphere inertia map I^-1[P].
 */
export function sphereInertiaInvMap(mass: number, radius: number): InertiaMap {
  return (P: MV) => sphereInertiaInv(P, mass, radius);
}

/**
 * Compute kinetic energy from B and a generic inertia map.
 *
 * Implementation detail:
 * - inertia(B) returns dual bivector momentum, so we unDual before coefficient
 *   pairing in the bivector basis.
 * - Numerically this is 1/2 * <B, I[B]> in component form.
 */
export function kineticEnergyFromInertia(B: MV, inertia: InertiaMap): number {
  const P = inertia(B).unDual();
  return 0.5 * (
    B.basisSVal('e_01') * P.basisSVal('e_01') +
    B.basisSVal('e_02') * P.basisSVal('e_02') +
    B.basisSVal('e_03') * P.basisSVal('e_03') +
    B.basisSVal('e_23') * P.basisSVal('e_23') +
    B.basisSVal('e_13') * P.basisSVal('e_13') +
    B.basisSVal('e_12') * P.basisSVal('e_12')
  );
}
