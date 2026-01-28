/**
 * Complex numbers as Cl(0,1) - the Clifford algebra with one basis vector squaring to -1.
 *
 * Basis: { 1, i } where i^2 = -1
 *
 * This gives us complex number arithmetic via the geometric product.
 * Also provides SU(2) matrix types and operations for doublet visualization.
 */

import { createBasisSet, type MultiVector as MV } from './basisSet';

// === Create the basis set for Cl(0,1) ===
const bs = createBasisSet();
bs.addBasis('i', -1); // i² = -1
bs.createCayley();

// === Basis elements ===
export const one: MV = bs.multiVector({ e_: 1 });
export const i: MV = bs.multiVector({ e_i: 1 });

/** Create complex number from real and imaginary parts */
export const complex = (re: number, im: number): MV => one.smul(re).add(i.smul(im));

/** Create complex from polar form: r * e^(i*theta) */
export const cExp = (theta: number): MV => complex(Math.cos(theta), Math.sin(theta));

/** Extract [re, im] tuple from complex MV */
export const coords = (z: MV): [number, number] => [z.bVal('e_'), z.bVal('e_i')];

/** Compute complex norm squared |z|^2 = re^2 + im^2 */
export const cNormSq = (z: MV): number => {
  const [re, im] = coords(z);
  return re * re + im * im;
};

// === SU(2) Doublet/Matrix types using MV for complex entries ===
export type Doublet = [MV, MV];
export type Mat2x2 = [[MV, MV], [MV, MV]];

export const TAU = 2 * Math.PI;

/** Matrix-vector multiply for 2x2 complex matrix on doublet */
export const matMul = (M: Mat2x2, v: Doublet): Doublet => [
  M[0][0].gp(v[0]).add(M[0][1].gp(v[1]))
  , M[1][0].gp(v[0]).add(M[1][1].gp(v[1]))
];

/** Normalize doublet to unit sphere */
export const normalizeDoublet = (d: Doublet): Doublet => {
  const n = Math.sqrt(cNormSq(d[0]) + cNormSq(d[1]));
  return n < 1e-10 ? d : [d[0].smul(1 / n), d[1].smul(1 / n)];
};

// Pauli matrices (as 2x2 complex MV matrices)
// exp(i*theta*tau) generates rotation by 2*theta about the corresponding axis
const zero = one.smul(0);
export const tau1: Mat2x2 = [
  [zero, one]
  , [one, zero]
]; // X-axis rotation generator
export const tau2: Mat2x2 = [
  [zero, i.smul(-1)]
  , [i, zero]
]; // Y-axis rotation generator
export const tau3: Mat2x2 = [
  [one, zero]
  , [zero, one.smul(-1)]
]; // Z-axis rotation generator
export const I2: Mat2x2 = [
  [one, zero]
  , [zero, one]
]; // Identity (U(1) phase generator)

/** exp(iθτ) = cos(θ)I + i·sin(θ)τ */
export const matExp = (tau: Mat2x2, theta: number): Mat2x2 => {
  const c = Math.cos(theta)
    , s = Math.sin(theta);
  const is = i.smul(s);
  return [
    [one.smul(c).add(is.gp(tau[0][0])), is.gp(tau[0][1])]
    , [is.gp(tau[1][0]), one.smul(c).add(is.gp(tau[1][1]))]
  ];
};

/** exp(iθτ₃) = diag(e^iθ, e^-iθ) */
export const matExpTau3 = (theta: number): Mat2x2 => [
  [cExp(theta), zero]
  , [zero, cExp(-theta)]
];
