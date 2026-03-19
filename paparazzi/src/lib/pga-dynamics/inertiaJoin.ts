import { e01, e02, e03, e23, e13, e12 } from '../../algebra/pga';
import type { Multivector as MV } from '../../algebra/types.js';
import type { InertiaMap } from './types';

/**
 * Joined/compound inertia construction for rigid assemblies in 3D PGA.
 *
 * Paper context: "May The Forque Be With You" (Dorst & De Keninck)
 * https://bivector.net/PGAdyn.html
 *
 * Concepts used here (paper mapping):
 * - Body rate bivector B and rigid-body state representation (§2.1)
 * - Inertia map I[B] from rate to momentum (dual bivector) (§2.2, esp. §2.2.3)
 * - Frame transport by motor sandwich X~ B X / X P X~ (§2.1.1, §2.1.2)
 * - Linearity/superposition of momentum maps for welded compound bodies
 *
 * Core compound-body formula implemented in this file:
 *   I_total[B] = sum_k X_k I_k[X_k~ B X_k] X_k~
 *
 * where X_k is the fixed motor from parent body frame to part-k local frame.
 *
 * Why this implementation shape:
 * - We keep inertia as a callable map (InertiaMap) for PGA-native composition.
 * - We materialize a 6x6 matrix only when building I^-1 from an arbitrary map.
 */

const BIVECTOR_BASIS: MV[] = [e01, e02, e03, e23, e13, e12];

// Coordinate extraction for bivector basis {e01,e02,e03,e23,e13,e12}.
// This gives a linear-algebra view of PGA bivectors when we need matrix inversion.
function bivectorToVec6(B: MV): number[] {
  return [
    B.basisSVal('e_01')
    , B.basisSVal('e_02')
    , B.basisSVal('e_03')
    , B.basisSVal('e_23')
    , B.basisSVal('e_13')
    , B.basisSVal('e_12')
  ];
}

// Reconstruct a bivector from the 6-coordinate representation above.
function vec6ToBivector(v: number[]): MV {
  return e01
    .smul(v[0])
    .add(e02.smul(v[1]))
    .add(e03.smul(v[2]))
    .add(e23.smul(v[3]))
    .add(e13.smul(v[4]))
    .add(e12.smul(v[5]));
}

// Dense 6x6 matrix-vector product used by the precomputed inverse map.
function applyMat6(A: number[][], x: number[]): number[] {
  const out = new Array(6).fill(0);
  for (let r = 0; r < 6; r++) {
    let acc = 0;
    for (let c = 0; c < 6; c++) acc += A[r][c] * x[c];
    out[r] = acc;
  }
  return out;
}

// Gauss-Jordan inverse for a 6x6 matrix.
// We use this once when turning a generic inertia map into a fast linear inverse map.
function invertMat6(A: number[][]): number[][] {
  const n = 6;
  const aug = Array.from({ length: n }, (_, r) => {
    const row = new Array(2 * n).fill(0);
    for (let c = 0; c < n; c++) row[c] = A[r][c];
    row[n + r] = 1;
    return row;
  });

  for (let col = 0; col < n; col++) {
    let pivot = col;
    let maxAbs = Math.abs(aug[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(aug[r][col]);
      if (v > maxAbs) {
        maxAbs = v;
        pivot = r;
      }
    }
    if (maxAbs < 1e-12) {
      throw new Error('Joined inertia matrix is singular');
    }

    if (pivot !== col) {
      const tmp = aug[col];
      aug[col] = aug[pivot];
      aug[pivot] = tmp;
    }

    const piv = aug[col][col];
    for (let c = 0; c < 2 * n; c++) aug[col][c] /= piv;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = aug[r][col];
      if (Math.abs(f) < 1e-16) continue;
      for (let c = 0; c < 2 * n; c++) aug[r][c] -= f * aug[col][c];
    }
  }

  return Array.from({ length: n }, (_, r) => aug[r].slice(n, 2 * n));
}

/**
 * Shift/transport a part-local inertia map into a parent body frame.
 *
 * Paper-derived frame-transport pattern:
 *   B_local = X~ B X
 *   P_local = I_local[B_local]
 *   P_parent = X P_local X~
 *
 * Here:
 * - B is parent/body-frame rate bivector
 * - I_local maps local rate bivector -> local momentum dual bivector
 * - X is the fixed localMotor from parent frame to part local frame
 *
 * This is the building block for compound welded inertia.
 */
export function makeShiftedInertiaMap(localMotor: MV, localInertia: InertiaMap): InertiaMap {
  const localMotorRev = localMotor.reverse();
  return (B: MV): MV => {
    const B_local = localMotorRev.sandwich(B).selectGrade(2);
    const P_local = localInertia(B_local);
    return localMotor.sandwich(P_local).selectGrade(2);
  };
}

/**
 * Superpose multiple inertia maps into one compound inertia map.
 *
 * Physics meaning:
 * - For the same body rate B, each welded part contributes momentum P_k = I_k[B].
 * - Total momentum is additive: P_total = sum_k P_k.
 *
 * This is exactly the functional form of:
 *   I_total[B] = sum_k I_k[B]
 *
 * Note the accumulator starts as a dual bivector zero because inertia maps return
 * momentum in dual-bivector form.
 */
export function sumInertiaMaps(maps: InertiaMap[]): InertiaMap {
  return (B: MV): MV => {
    let sum = e01.smul(0).dual();
    for (const map of maps) sum = sum.add(map(B));
    return sum;
  };
}

/**
 * Build an inverse inertia map I^-1 from an arbitrary linear inertia map I.
 *
 * We probe I on the six bivector basis blades, assemble the corresponding 6x6
 * matrix in coordinate form, invert it numerically once, and return a fast map:
 *
 *   b = A^-1 p
 *
 * where:
 * - b are bivector-rate coordinates,
 * - p are momentum coordinates (after unDual),
 * - A encodes I in the chosen bivector basis.
 *
 * Paper relation:
 * - This is the computational counterpart of applying I^-1 in the dynamics update
 *   Bdot = I^-1[ B x I[B] + F ] (§2.5, equations of motion).
 */
export function makeInertiaInverseFromMap(inertia: InertiaMap): InertiaMap {
  const A = Array.from({ length: 6 }, () => new Array(6).fill(0));

  // Column c of A is I[e_c] expressed in bivector coordinates.
  // inertia(...) returns dual bivector momentum, so we unDual before extracting
  // coordinates to stay in one 6D coordinate space.
  for (let c = 0; c < 6; c++) {
    const P = inertia(BIVECTOR_BASIS[c]);
    const p = bivectorToVec6(P.unDual());
    for (let r = 0; r < 6; r++) A[r][c] = p[r];
  }

  const Ainv = invertMat6(A);

  return (P: MV): MV => {
    // Convert dual momentum -> bivector coordinates, solve with A^-1, then rebuild.
    const p = bivectorToVec6(P.unDual());
    const b = applyMat6(Ainv, p);
    return vec6ToBivector(b);
  };
}