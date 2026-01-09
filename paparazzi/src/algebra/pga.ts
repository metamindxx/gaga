/**
 * PGA - Pre-configured Projective Geometric Algebra (R₃,₀,₁)
 *
 * Provides a ready-to-use PGA instance with all standard basis elements
 * and helper functions. Just import and use:
 *
 * ```ts
 * import { pga, e0, e1, e2, e3 } from '../algebra/pga.js';
 *
 * const pt = pga.point([1, 2, 3]);
 * const pl = pga.plane([0, 1, 0], 0);  // y=0 plane
 * const line = pt.op(pga.point([4, 5, 6]));  // join two points
 * ```
 */

import { createBasisSet } from '../basisSet';
import { createPgaHelpers, type PgaHelpers } from './pgaHelpers.js';
import type { Multivector as MV } from './types.js';

// === Create the basis set ===
export type PgaBasisSet = ReturnType<typeof createBasisSet> & {
  e: MV;
  e0: MV;
  e1: MV;
  e2: MV;
  e3: MV;
  e01: MV;
  e02: MV;
  e03: MV;
  e12: MV;
  e13: MV;
  e23: MV;
  e012: MV;
  e013: MV;
  e023: MV;
  e123: MV;
  e0123: MV;
  I4: MV;
  one: MV;
};

const bs = createBasisSet() as PgaBasisSet;
bs.addBasis('0', 0); // e₀ (degenerate, e₀²=0)
bs.addBasis('1', +1); // e₁
bs.addBasis('2', +1); // e₂
bs.addBasis('3', +1); // e₃
bs.createCayley();

// Manually set duals for PGA (degenerate algebra requires explicit mapping)
// Copied from ganja.js dual map
bs.setDual(bs.e, bs.e0123, 1);

bs.setDual(bs.e0, bs.e123, 1);
bs.setDual(bs.e1, bs.e023, -1);
bs.setDual(bs.e2, bs.e013, 1);
bs.setDual(bs.e3, bs.e012, -1);

bs.setDual(bs.e01, bs.e23, 1);
bs.setDual(bs.e02, bs.e13, -1);
bs.setDual(bs.e03, bs.e12, 1);
bs.setDual(bs.e12, bs.e03, 1);
bs.setDual(bs.e13, bs.e02, -1);
bs.setDual(bs.e23, bs.e01, 1);

bs.setDual(bs.e012, bs.e3, 1);
bs.setDual(bs.e013, bs.e2, -1);
bs.setDual(bs.e023, bs.e1, 1);
bs.setDual(bs.e123, bs.e0, -1);

bs.setDual(bs.e0123, bs.e, 1);

// === Standard basis elements ===
/** Degenerate basis (e₀²=0) - represents "direction to infinity" */
export const e0: MV = bs.multiVector({ e_0: 1 });

/** Unit vector in x direction */
export const e1: MV = bs.multiVector({ e_1: 1 });

/** Unit vector in y direction */
export const e2: MV = bs.multiVector({ e_2: 1 });

/** Unit vector in z direction */
export const e3: MV = bs.multiVector({ e_3: 1 });

/** Euclidean pseudoscalar (e₁e₂e₃) */
export const e123: MV = bs.multiVector({ e_123: 1 });

/** Full pseudoscalar (e₀e₁e₂e₃) */
export const e0123: MV = bs.multiVector({ e_0123: 1 });
export const I4: MV = e0123; // Alias for full pseudoscalar

/** Scalar unit */
export const one: MV = bs.multiVector({ e_: 1 });
export const e = one; // Alias for scalar unit

// === Derived basis bivectors ===
/** Bivector e₀₁ */
export const e01: MV = e0.op(e1);

/** Bivector e₀₂ */
export const e02: MV = e0.op(e2);

/** Bivector e₀₃ */
export const e03: MV = e0.op(e3);

/** Bivector e₂₃ */
export const e23: MV = e2.op(e3);

/** Bivector e₃₁ */
export const e13: MV = e1.op(e3);

/** Bivector e₁₂ */
export const e12: MV = e1.op(e2);

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

// === PGA Helpers ===
/**
 * Pre-configured PGA helpers with all standard operations:
 * - `point(coords)` - Create point from [x,y,z]
 * - `plane(normal, dist)` - Create plane
 * - `pointCoords(mv)` - Extract [x,y,z] from point
 * - `join(a, b)` - Outer product (point∧point = line)
 * - `meet(a, b)` - Regressive product (intersection)
 * - `translator(dir, dist)` - Create translation motor
 * - `rotor(axis, angle)` - Create rotation motor
 * - `apply(motor, element)` - Sandwich product
 * - `classify(mv)` - Classify MV as geometric primitive
 */
export const pga: PgaHelpers = createPgaHelpers({
  e0
  , e1
  , e2
  , e3
  , e123
  , I4
  , one
});

// Attach helpers to the basis set so MVs can classify themselves
bs.helpers = pga;

// Export the basis set for advanced usage (e.g., cayleyHtml)
export { bs as pgaBasisSet };

// Re-export types
export type { PgaHelpers } from './pgaHelpers.js';
