/**
 * Public API for the PGA dynamics helper library.
 *
 * Paper context: "May The Forque Be With You" (Dorst & De Keninck)
 * https://bivector.net/PGAdyn.html
 *
 * Module map:
 * - types.ts: shared PGA dynamics state/map contracts (§2.1, §2.2)
 * - inertia.ts: inertia maps and kinetic-energy pairing (§2.2)
 * - inertiaJoin.ts: compound/welded inertia transport and superposition (§2.1, §2.2)
 * - rigidBody.ts: equations-of-motion stepping helpers (§2.5)
 * - impulse.ts: contact impulse resolution utilities (§2.6)
 * - contact.ts: compound sphere-plane contact/friction forque helpers (§2.3, §2.6)
 */
export type { InertiaMap, RigidBodyState } from './types';
export {
  sphereInertiaMap
  , sphereInertiaInvMap
  , kineticEnergyFromInertia
} from './inertia';
export {
  makeShiftedInertiaMap
  , sumInertiaMaps
  , makeInertiaInverseFromMap
} from './inertiaJoin';
export {
  origin
  , gravityForque
  , dampingForque
  , derivRigidBody
  , stepRigidBodySemiImplicit
  , worldRate
  , bodyForqueFromWorldForque
} from './rigidBody';
export {
  resolveImpulseContactsPga
  , type ImpulseConfig
  , type MotorRatePair
} from './impulse';
export {
  bodyForqueFromWorldForceAtPoint
  , pointVelocityWorld
  , effectiveInvMassAlongDirection
  , subBodyState
  , mapSubForqueToBody
  , accumulateSpherePlaneContactForque
  , spherePlaneSpringEnergy
  , type PlaneContactConfig
  , correctPenetration
} from './contact';
