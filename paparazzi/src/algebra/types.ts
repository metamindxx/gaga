/**
 * Algebra Types - Core type definitions
 */

export type Vec3 = [number, number, number];

/**
 * Multivector interface - minimal contract for what we need.
 * Uses 'any' for flexibility with different MV implementations.
 * The actual basisSet.MultiVector type is stricter.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Multivector = any;
