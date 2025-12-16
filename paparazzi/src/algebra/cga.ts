/**
 * CGA - Pre-configured Conformal Geometric Algebra (R₄,₁)
 *
 * Provides a ready-to-use CGA instance with all the standard basis elements
 * and helper functions. Just import and use:
 *
 * ```ts
 * import { cga, e1, e2, e3, no, ni } from '../algebra/cga.js';
 *
 * const point = cga.up([1, 2, 3]);
 * const coords = cga.down(point);
 * ```
 */

import { createBasisSet } from '../basisSet.js';
import { createCgaHelpers, type CgaHelpers } from './cgaHelpers.js';
import type { Multivector as MV } from './types.js';

// === Create the basis set ===
const bs = createBasisSet();
bs.addBasis('1', +1); // e₁
bs.addBasis('2', +1); // e₂
bs.addBasis('3', +1); // e₃
bs.addBasis('p', +1); // e₊ (positive null basis)
bs.addBasis('m', -1); // e₋ (negative null basis)
bs.createCayley();

// Manually set duals for CGA R(4,1) - computed from ganja.js
// Grade 0 ↔ Grade 5
bs.setDual(bs.e, bs.e123pm, 1);
bs.setDual(bs.e123pm, bs.e, -1);

// Grade 1 ↔ Grade 4
bs.setDual(bs.e1, bs.e23pm, 1);
bs.setDual(bs.e2, bs.e13pm, -1);
bs.setDual(bs.e3, bs.e12pm, 1);
bs.setDual(bs.ep, bs.e123m, -1);
bs.setDual(bs.em, bs.e123p, -1);

bs.setDual(bs.e23pm, bs.e1, -1);
bs.setDual(bs.e13pm, bs.e2, 1);
bs.setDual(bs.e12pm, bs.e3, -1);
bs.setDual(bs.e123m, bs.ep, 1);
bs.setDual(bs.e123p, bs.em, 1);

// Grade 2 ↔ Grade 3
bs.setDual(bs.e12, bs.e3pm, -1);
bs.setDual(bs.e13, bs.e2pm, 1);
bs.setDual(bs.e1p, bs.e23m, -1);
bs.setDual(bs.e1m, bs.e23p, -1);
bs.setDual(bs.e23, bs.e1pm, -1);
bs.setDual(bs.e2p, bs.e13m, 1);
bs.setDual(bs.e2m, bs.e13p, 1);
bs.setDual(bs.e3p, bs.e12m, -1);
bs.setDual(bs.e3m, bs.e12p, -1);
bs.setDual(bs.epm, bs.e123, 1);

bs.setDual(bs.e3pm, bs.e12, 1);
bs.setDual(bs.e2pm, bs.e13, -1);
bs.setDual(bs.e23m, bs.e1p, 1);
bs.setDual(bs.e23p, bs.e1m, 1);
bs.setDual(bs.e1pm, bs.e23, 1);
bs.setDual(bs.e13m, bs.e2p, -1);
bs.setDual(bs.e13p, bs.e2m, -1);
bs.setDual(bs.e12m, bs.e3p, 1);
bs.setDual(bs.e12p, bs.e3m, 1);
bs.setDual(bs.e123, bs.epm, -1);

// === Standard basis elements ===
/** Unit vector in x direction */
export const e1: MV = bs.multiVector({ e_1: 1 });

/** Unit vector in y direction */
export const e2: MV = bs.multiVector({ e_2: 1 });

/** Unit vector in z direction */
export const e3: MV = bs.multiVector({ e_3: 1 });

/** Euclidean pseudoscalar (e₁e₂e₃) */
export const e123: MV = bs.multiVector({ e_123: 1 });

/** Origin point: n₀ = ½(e₋ - e₊) */
export const no: MV = bs.multiVector({ e_m: 0.5, e_p: -0.5 });

/** Infinity point: n∞ = e₋ + e₊ */
export const ni: MV = bs.multiVector({ e_m: 1, e_p: 1 });

/** 5D pseudoscalar (e₁e₂e₃e₊e₋) */
export const I5: MV = bs.multiVector({ e_123pm: 1 });

/** Scalar unit */
export const one: MV = bs.multiVector({ e_: 1 });

// === Helper to create multivectors ===
/**
 * Create a multivector from basis coefficients
 *
 * @example
 * const mv = multiVector({ e_1: 1, e_2: 2 }); // e₁ + 2e₂
 */
export function multiVector(coeffs: Record<string, number>): MV {
  return bs.multiVector(coeffs);
}

// === CGA Helpers ===
/**
 * Pre-configured CGA helpers with all standard operations:
 * - `up(coords)` - Embed Euclidean point into CGA
 * - `down(mv)` - Extract Euclidean coords from CGA point
 * - `vec3(mv)` - Extract [x,y,z] from Euclidean vector
 * - `meet(a, b)` - Regressive product (intersection)
 * - `sphere(center, radius)` - Create sphere IPNS
 * - `translator(dir, dist)` - Create translation motor
 * - `classify(mv)` - Classify MV as geometric primitive
 * - `embed(prim)` - Construct MV from primitive
 */
export const cga: CgaHelpers = createCgaHelpers({
  no
  , ni
  , I5
  , e1
  , e2
  , e3
  , one
});

// Attach helpers to the basis set so MVs can classify themselves
bs.helpers = cga;

// Export the basis set for advanced usage (e.g., cayleyHtml)
export { bs as cgaBasisSet };

// Re-export types
export type { CgaHelpers } from './cgaHelpers.js';
