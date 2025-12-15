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
