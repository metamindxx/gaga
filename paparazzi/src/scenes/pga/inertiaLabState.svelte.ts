/**
 * Inertia Lab State
 *
 * Two identical spheres welded into one rigid body. Explore joined inertia maps:
 *   I_total[B] = Σ X_k I_k[X_k~ B X_k] X_k~
 *
 * Setup mode: dumbbell is held at dropHeight, tilted by dropAngleX (tip it end-down).
 * On Drop, physics simulation takes over from the current pose with zero initial velocity.
 */

export const config = $state({
  halfOffset: 0.45
  , sphereMass: 1
  , sphereRadius: 0.25
  , gravity: -9.81
  , bodyDamping: 0.14
  , substeps: 10

  // Setup: where/how to hold the dumbbell before dropping
  , dropHeight: 1.0       // COM height above ground (m)
  , dropAngleX: 0.0       // tilt angle about Z axis (rad) — tips the dumbbell end-down

  // Ground contact parameters
  , groundStiffness: 2000
  , groundDamping: 90
  , groundFriction: 0.4
});

export function getSceneProps() {
  return {};
}

/** Live simulation read-outs — updated each frame by the scene task loop. */
export const stats = $state({ ke: 0, pe: 0, springPE: 0, total: 0 });
