/**
 * Algebra Types - Core type definitions
 */
import type { MultiVector } from './basisSet';
export type Vec3 = [number, number, number];

/**
 * Multivector interface - minimal contract for what we need.
 * Uses 'any' for flexibility with different MV implementations.
 * The actual basisSet.MultiVector type is stricter.
 */

export type Multivector = MultiVector;
