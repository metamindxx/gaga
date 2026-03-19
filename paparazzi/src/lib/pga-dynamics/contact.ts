import { one, e01, e02, e03, e12, e13, e23, pga } from '../../algebra/pga';
import type { Multivector as MV } from '../../algebra/types.js';
import { origin, planeContactNormalForce, planeContactPenetration } from '../../physics/pgaDynamics';
import type { InertiaMap, RigidBodyState } from './types';

/**
 * Contact/forque helpers for compound rigid bodies in PGA.
 *
 * Paper context: "May The Forque Be With You" (Dorst & De Keninck)
 * https://bivector.net/PGAdyn.html
 *
 * Concepts used:
 * - Body/world frame transport with motor sandwich operations (§2.1)
 * - Forque application and frame conversion (§2.3)
 * - Inertia-inverse response for stable update bounds (§2.2, §2.5)
 * - Contact normal/friction decomposition (§2.6)
 */

export type PlaneContactConfig = {
  plane: MV;
  planeNormal: [number, number, number];
  radius: number;
  stiffness: number;
  damping: number;
  frictionMu: number;
};

function normalize3(v: [number, number, number]): [number, number, number] {
  const n = Math.hypot(v[0], v[1], v[2]);
  if (n < 1e-9) return [0, 0, 0];
  return [v[0] / n, v[1] / n, v[2] / n];
}

function rotorOf(M: MV): MV {
  return one
    .smul(M.basisSVal('e_'))
    .add(e23.smul(M.basisSVal('e_23')))
    .add(e13.smul(M.basisSVal('e_13')))
    .add(e12.smul(M.basisSVal('e_12')));
}

/**
 * Convert a world force applied at a world point into a body-frame forque.
 *
 * This applies the standard force-at-point relation:
 * - torque = r x F about center of mass
 * - world forque bivector -> body-frame dual bivector via M~ (...) M then dual
 */
export function bodyForqueFromWorldForceAtPoint(
  bodyMotor: MV
  , worldPoint: [number, number, number]
  , worldForce: [number, number, number]
): MV {
  const fx = worldForce[0];
  const fy = worldForce[1];
  const fz = worldForce[2];

  const centerCoords = pga.pointCoords(bodyMotor.sandwich(origin)) ?? [0, 0, 0];
  const [cx, cy, cz] = centerCoords;

  const rx = worldPoint[0] - cx;
  const ry = worldPoint[1] - cy;
  const rz = worldPoint[2] - cz;

  const tx = ry * fz - rz * fy;
  const ty = rz * fx - rx * fz;
  const tz = rx * fy - ry * fx;

  const worldForque = e01
    .smul(fx)
    .add(e02.smul(fy))
    .add(e03.smul(fz))
    .add(e23.smul(tx))
    .add(e13.smul(-ty))
    .add(e12.smul(tz));

  return bodyMotor.reverse().sandwich(worldForque).selectGrade(2).dual();
}

/**
 * Point velocity from rigid body world rate at arbitrary world point.
 *
 * v(point) = v_com + w x r
 */
export function pointVelocityWorld(
  state: RigidBodyState
  , worldPoint: [number, number, number]
): [number, number, number] {
  const V = state.M.sandwich(state.B).selectGrade(2);
  const vx = V.basisSVal('e_01');
  const vy = V.basisSVal('e_02');
  const vz = V.basisSVal('e_03');

  const wx = V.basisSVal('e_23');
  const wy = -V.basisSVal('e_13');
  const wz = V.basisSVal('e_12');

  const centerCoords = pga.pointCoords(state.M.sandwich(origin)) ?? [0, 0, 0];
  const [cx, cy, cz] = centerCoords;

  const rx = worldPoint[0] - cx;
  const ry = worldPoint[1] - cy;
  const rz = worldPoint[2] - cz;

  return [
    vx + (wy * rz - wz * ry)
    , vy + (wz * rx - wx * rz)
    , vz + (wx * ry - wy * rx)
  ];
}

/**
 * Effective inverse mass along a world direction at a world contact point.
 *
 * Probe method:
 * 1) Apply unit force along dir at point
 * 2) Map through I^-1 to get rate change
 * 3) Measure resulting point-velocity change along dir
 */
export function effectiveInvMassAlongDirection(
  state: RigidBodyState
  , inertiaInv: InertiaMap
  , worldPoint: [number, number, number]
  , dir: [number, number, number]
): number {
  const unitBodyForque = bodyForqueFromWorldForceAtPoint(state.M, worldPoint, dir);
  const dBBody = inertiaInv(unitBodyForque).selectGrade(2);
  const probeState: RigidBodyState = { M: state.M, B: dBBody };
  const dv = pointVelocityWorld(probeState, worldPoint);
  return Math.max(1e-9, dv[0] * dir[0] + dv[1] * dir[1] + dv[2] * dir[2]);
}

/**
 * Build an equivalent sphere-frame state from a parent rigid-body state.
 *
 * If X is fixed local sphere offset motor, sphere frame pose is M*X.
 * Sphere frame rate is world rate pulled back into sphere frame.
 */
export function subBodyState(state: RigidBodyState, localMotor: MV): RigidBodyState {
  const Msub = state.M.gp(localMotor).normalize();
  const Vworld = state.M.sandwich(state.B).selectGrade(2);
  const Bsub = Msub.reverse().sandwich(Vworld).selectGrade(2);
  return { M: Msub, B: Bsub };
}

/**
 * Map sub-body-frame forque into parent-body frame.
 */
export function mapSubForqueToBody(
  parentMotor: MV
  , subMotor: MV
  , subForque: MV
): MV {
  const worldBiv = subMotor.sandwich(subForque.unDual()).selectGrade(2);
  return parentMotor.reverse().sandwich(worldBiv).selectGrade(2).dual();
}

/**
 * Total elastic PE stored in penalty contact springs for all sub-sphere contacts.
 *
 * springPE = Σ ½ · stiffness · overlap²
 *
 * Add this to KE + gravPE to get a total that decreases monotonically under damping
 * (no energy is "lost" into the unmeasured spring when a sphere compresses into the floor).
 */
export function spherePlaneSpringEnergy(
  state: RigidBodyState
  , localSphereMotors: MV[]
  , config: PlaneContactConfig
): number {
  let total = 0;
  for (const localMotor of localSphereMotors) {
    const s = subBodyState(state, localMotor);
    const overlap = planeContactPenetration(s.M, config.plane, config.radius);
    if (overlap > 0) total += 0.5 * config.stiffness * overlap * overlap;
  }
  return total;
}

/**
 * Baumgarte position correction for compound sphere-plane contacts.
 *
 * After each velocity/position integration substep, residual penetration can
 * accumulate, leading to deep-tunnelling and rocking instability.  This function
 * translates the compound body's motor along the plane normal by β × maxOverlap
 * to bleed out penetration over a few substeps.
 *
 * Typical β: 0.2–0.4.  β=0 disables the correction; β=1 snaps out immediately.
 *
 * Small energy inconsistency from the position shift is O(β·overlap) and bounded;
 * it is far preferable to the energy blow-up caused by uncorrected deep penetration.
 */
export function correctPenetration(
  M: MV
  , B: MV
  , localSphereMotors: MV[]
  , config: PlaneContactConfig
  , beta: number
): MV {
  if (beta <= 0) return M;

  const nUnit = normalize3(config.planeNormal);
  let maxOverlap = 0;

  for (const localMotor of localSphereMotors) {
    const s = subBodyState({ M, B }, localMotor);
    const overlap = planeContactPenetration(s.M, config.plane, config.radius);
    if (overlap > maxOverlap) maxOverlap = overlap;
  }

  if (maxOverlap <= 0) return M;

  const shift = beta * maxOverlap;
  const correction = pga.translator([
    nUnit[0] * shift
    , nUnit[1] * shift
    , nUnit[2] * shift
  ], 1);
  return correction.gp(M).normalize();
}

/**
 * Accumulate plane contact + friction forques for multiple welded sphere sub-bodies.
 *
 * Normal contact force is delegated to planeContactForque (paper-style spring-damper).
 * Friction uses tangential slip and Coulomb cap with an inertia-based no-overshoot cap:
 *   f_max = slipSpeed / (effectiveInvMass * dt)
 */
export function accumulateSpherePlaneContactForque(
  state: RigidBodyState
  , inertiaInv: InertiaMap
  , localSphereMotors: MV[]
  , config: PlaneContactConfig
  , dt: number
): MV {
  let total = e01.smul(0).dual();
  const parentCenter = pga.pointCoords(state.M.sandwich(origin)) ?? [0, 0, 0];
  const Rparent = rotorOf(state.M);

  const nUnit = normalize3(config.planeNormal);
  for (const localMotor of localSphereMotors) {
    const s = subBodyState(state, localMotor);

    // Compute penetration and normal force magnitude.
    const normalForce = planeContactNormalForce(
      s.M
      , s.B
      , config.plane
      , nUnit
      , config.radius
      , config.stiffness
      , config.damping
    );

    if (normalForce <= 0) continue;

    // Get sphere center in world coords.
    const centerCoords = pga.pointCoords(s.M.sandwich(origin));
    if (!centerCoords) continue;
    const [cx, cy, cz] = centerCoords;

    // World contact point is on the sphere surface toward the plane.
    const contactPoint: [number, number, number] = [
      cx - config.radius * nUnit[0]
      , cy - config.radius * nUnit[1]
      , cz - config.radius * nUnit[2]
    ];

    // Build a pure normal force in the sub-body frame (through the sub-sphere
    // origin), using rotor-only transport for direction. Then map this forque
    // to the parent frame so the COM-to-subbody lever arm generates tipping
    // torque without introducing spurious tangential bias.
    const worldNormalBiv = e01
      .smul(nUnit[0])
      .add(e02.smul(nUnit[1]))
      .add(e03.smul(nUnit[2]));
    const Rsub = rotorOf(s.M);
    const subNormalDir = Rsub.reverse().sandwich(worldNormalBiv).selectGrade(2);
    const subNormalForque = subNormalDir.smul(normalForce).dual();
    total = total.add(mapSubForqueToBody(state.M, s.M, subNormalForque));

    // Add explicit torque about the compound COM: tau = r x F.
    // We transform torque with rotor-only transport to avoid introducing
    // extra translational components through translator coupling.
    const rx = cx - parentCenter[0];
    const ry = cy - parentCenter[1];
    const rz = cz - parentCenter[2];
    const fx = nUnit[0] * normalForce;
    const fy = nUnit[1] * normalForce;
    const fz = nUnit[2] * normalForce;
    const tx = ry * fz - rz * fy;
    const ty = rz * fx - rx * fz;
    const tz = rx * fy - ry * fx;
    const worldTorqueBiv = e23.smul(tx).add(e13.smul(-ty)).add(e12.smul(tz));
    const bodyTorqueForque = Rparent.reverse().sandwich(worldTorqueBiv).selectGrade(2).dual();
    total = total.add(bodyTorqueForque);

    if (config.frictionMu <= 0) continue;

    const v = pointVelocityWorld(state, contactPoint);
    const vN = v[0] * nUnit[0] + v[1] * nUnit[1] + v[2] * nUnit[2];
    const slip: [number, number, number] = [
      v[0] - vN * nUnit[0]
      , v[1] - vN * nUnit[1]
      , v[2] - vN * nUnit[2]
    ];

    const slipSpeed = Math.hypot(slip[0], slip[1], slip[2]);
    if (slipSpeed < 1e-8) continue;

    const tDir: [number, number, number] = [
      -slip[0] / slipSpeed
      , -slip[1] / slipSpeed
      , -slip[2] / slipSpeed
    ];

    const effInvMass = effectiveInvMassAlongDirection(state, inertiaInv, contactPoint, tDir);
    const maxFriction = slipSpeed / (Math.max(dt, 1e-6) * effInvMass);
    const frictionMag = Math.min(config.frictionMu * normalForce, maxFriction);

    total = total.add(
      bodyForqueFromWorldForceAtPoint(state.M, contactPoint, [
        tDir[0] * frictionMag
        , tDir[1] * frictionMag
        , tDir[2] * frictionMag
      ])
    );
  }

  return total;
}
