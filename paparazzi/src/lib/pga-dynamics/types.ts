import type { Multivector as MV } from '../../algebra/types.js';

/**
 * Shared types for the PGA dynamics helper library.
 *
 * Paper context: "May The Forque Be With You" (Dorst & De Keninck)
 * https://bivector.net/PGAdyn.html
 *
 * Core representation reminders:
 * - Motor M encodes rigid pose (position + orientation) (§2.1.1).
 * - Body rate B is a bivector velocity in the body frame (§2.1.2).
 * - Inertia map I maps B -> momentum (dual bivector) (§2.2.3).
 */
export type InertiaMap = (B: MV) => MV;

export type RigidBodyState = {
  M: MV;
  B: MV;
};
