/**
 * PGA Helpers - Pure functions for 3D Projective Geometric Algebra
 *
 * Signature: R(3,0,1) - e1²=e2²=e3²=1, e0²=0
 *
 * Grade interpretations:
 *   - Grade 1: Planes (ax + by + cz + d = 0)
 *   - Grade 2: Lines (Plücker coordinates)
 *   - Grade 3: Points (homogeneous)
 *   - Grade 4: Pseudoscalar
 *
 * No Svelte, no Three.js - just math.
 */

import type {
  Coords3D
  , GeoPrimitive
  , Point3D
  , Direction3D
  , Line3D
  , Plane3D
} from '../geometry/primitives.js';
import type { Multivector as MV } from './types.js';

/** PGA basis elements required for helpers */
export interface PgaBasis {
  e0: MV; // Degenerate basis (e0²=0)
  e1: MV; // x basis
  e2: MV; // y basis
  e3: MV; // z basis
  e123: MV; // Euclidean pseudoscalar
  I4: MV; // Full pseudoscalar e0123
  one: MV; // Scalar 1
}

/** Threshold for numerical comparisons */
const EPSILON = 1e-6;

/**
 * Create PGA helper functions bound to a specific basis
 */
export function createPgaHelpers(basis: PgaBasis) {
  const { e0, e1, e2, e3, e123, one } = basis;

  // =========================================================================
  // Core Transformations: point / plane
  // =========================================================================

  /**
   * Create a point from Euclidean coordinates
   * In PGA, a point is: P = e123 + x*e032 + y*e013 + z*e021
   * (grade-3 element)
   */
  function point(coords: Coords3D): MV {
    const [x, y, z] = coords;
    // P = e123 + x*e032 + y*e013 + z*e021
    const e032 = e0.op(e3).op(e2); // = -e023
    const e013 = e0.op(e1).op(e3); // = -e031
    const e021 = e0.op(e2).op(e1); // = -e012
    return e123.add(e032.smul(x)).add(e013.smul(y)).add(e021.smul(z));
  }

  /**
   * Create a plane from normal and distance
   * In PGA, a plane is: π = nx*e1 + ny*e2 + nz*e3 - d*e0
   * (grade-1 element)
   * Note: e0 coefficient is negated so that distance extracts correctly
   */
  function plane(normal: Coords3D, distance: number): MV {
    const [nx, ny, nz] = normal;
    return e1.smul(nx).add(e2.smul(ny)).add(e3.smul(nz)).add(e0.smul(-distance));
  }

  /**
   * Extract Euclidean coordinates from a PGA point (grade-3)
   * Returns null for ideal points (points at infinity)
   */
  function pointCoords(pt: MV): Coords3D | null {
    if (!pt) return null;

    // The e123 component is the weight (w)
    const w = pt.basisSVal('e_123');

    if (Math.abs(w) < EPSILON) {
      // Ideal point (point at infinity)
      return null;
    }

    // Extract coordinates (note sign conventions)
    // x from e032 = -e023, y from e013 = -e031, z from e021 = -e012
    const x = -pt.basisSVal('e_023') / w;
    const y = pt.basisSVal('e_013') / w;
    const z = -pt.basisSVal('e_012') / w;

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return null;
    }

    return [x, y, z];
  }

  /**
   * Extract direction from an ideal point (grade-3 with w≈0)
   */
  function directionOf(pt: MV): Coords3D | null {
    if (!pt) return null;

    const w = pt.basisSVal('e_123');
    if (Math.abs(w) >= EPSILON) return null; // Not ideal

    const x = -pt.basisSVal('e_023');
    const y = pt.basisSVal('e_013');
    const z = -pt.basisSVal('e_012');
    const mag = Math.sqrt(x * x + y * y + z * z);

    if (mag < EPSILON) return null;
    return [x / mag, y / mag, z / mag];
  }

  /**
   * Extract plane parameters from a grade-1 MV
   * Note: distance is negated to match standard convention (ax + by + cz = d)
   */
  function planeParams(pl: MV): { normal: Coords3D; distance: number } | null {
    if (!pl) return null;

    const nx = pl.basisSVal('e_1');
    const ny = pl.basisSVal('e_2');
    const nz = pl.basisSVal('e_3');
    const d = pl.basisSVal('e_0');

    const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (mag < EPSILON) return null;

    return {
      normal: [nx / mag, ny / mag, nz / mag]
      , distance: -d / mag // Negated to match standard plane equation
    };
  }

  // =========================================================================
  // Classification: classify
  // =========================================================================

  /**
   * Classify a multivector and extract its geometric primitive
   */
  function classify(mv: MV): GeoPrimitive | null {
    if (!mv) return null;

    const gradesSet = mv.getGrades?.();
    if (!gradesSet) return null;
    const grades = Array.from(gradesSet) as number[];

    if (grades.length === 1) {
      const grade = grades[0];

      switch (grade) {
        case 1:
          return classifyGrade1(mv); // Plane
        case 2:
          return classifyGrade2(mv); // Line
        case 3:
          return classifyGrade3(mv); // Point
      }
    }

    // Mixed grades (motors, etc.) - TODO
    return null;
  }

  /**
   * Grade 1: Plane
   */
  function classifyGrade1(mv: MV): Plane3D | null {
    const params = planeParams(mv);
    if (!params) return null;

    const d = params.distance;
    const point: Coords3D = [params.normal[0] * d, params.normal[1] * d, params.normal[2] * d];

    return { type: 'plane', point, normal: params.normal, distance: d };
  }

  /**
   * Grade 2: Line
   * Line in PGA is a bivector with direction and moment
   */
  function classifyGrade2(mv: MV): Line3D | null {
    const dx = mv.basisSVal('e_23');
    const dy = -mv.basisSVal('e_13');
    const dz = mv.basisSVal('e_12');
    const mx = mv.basisSVal('e_01');
    const my = mv.basisSVal('e_02');
    const mz = mv.basisSVal('e_03');

    // These six coefficients are (up to basis/sign conventions) the Plücker coordinates:
    // direction d and moment m where m = p × d.
    // Scaling of a Plücker line is arbitrary, so if we normalize d we must normalize m
    // by the same scale to keep the represented line invariant.
    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (mag < EPSILON) return null;

    const direction: Coords3D = [dx / mag, dy / mag, dz / mag];
    const moment: Coords3D = [mx / mag, my / mag, mz / mag];

    // A convenient point on the line is the point closest to the origin:
    // p0 = d × m  (with ||d|| = 1)
    const px = direction[1] * moment[2] - direction[2] * moment[1];
    const py = direction[2] * moment[0] - direction[0] * moment[2];
    const pz = direction[0] * moment[1] - direction[1] * moment[0];

    return { type: 'line', point: [px, py, pz], direction };
  }

  /**
   * Grade 3: Point or Direction
   */
  function classifyGrade3(mv: MV): Point3D | Direction3D | null {
    const coords = pointCoords(mv);
    if (coords) {
      return { type: 'point', coords };
    }

    const dir = directionOf(mv);
    if (dir) {
      return { type: 'direction', vector: dir };
    }

    return null;
  }

  // =========================================================================
  // Utilities
  // =========================================================================

  /**
   * Join (outer product): Creates the element containing both
   * - Two points → Line through them
   * - Three points → Plane through them
   * - Point and line → Plane containing both
   */
  function join(a: MV, b: MV): MV {
    return a.op(b);
  }

  /**
   * Meet (regressive product): Intersection
   * - Two planes → Line of intersection
   * - Three planes → Point of intersection
   * - Plane and line → Point of intersection
   */
  function meet(a: MV, b: MV): MV {
    return a.dual().op(b.dual()).unDual();
  }

  /**
   * Create a translator motor
   * T = 1 - ½(dx*e01 + dy*e02 + dz*e03)
   * Note: sign is negative to get positive translation direction
   */
  function translator(direction: Coords3D, distance: number): MV {
    const [dx, dy, dz] = direction;
    const e01 = e0.op(e1);
    const e02 = e0.op(e2);
    const e03 = e0.op(e3);
    return one
      .sub(e01.smul(dx * distance * 0.5))
      .sub(e02.smul(dy * distance * 0.5))
      .sub(e03.smul(dz * distance * 0.5));
  }

  /**
   * Create a rotor around an axis through origin
   * R = cos(θ/2) + sin(θ/2)(ax*e23 + ay*e31 + az*e12)
   */
  function rotor(axis: Coords3D, angle: number): MV {
    const [ax, ay, az] = axis;
    const halfAngle = angle / 2;
    const c = Math.cos(halfAngle);
    const s = Math.sin(halfAngle);
    const e23 = e2.op(e3);
    const e31 = e3.op(e1);
    const e12 = e1.op(e2);
    return one
      .smul(c)
      .add(e23.smul(ax * s))
      .add(e31.smul(ay * s))
      .add(e12.smul(az * s));
  }

  /**
   * Apply a motor to an element via sandwich product
   * X' = M X M̃
   */
  function sandwich(motor: MV, element: MV): MV {
    return motor.gp(element).gp(motor.reverse());
  }

  return {
    // Core transformations
    point
    , plane
    , pointCoords
    , directionOf
    , planeParams

    // Classification
    , classify

    // Utilities
    , join
    , meet
    , translator
    , rotor
    , apply: sandwich

    // Basis access
    , basis
  };
}

export type PgaHelpers = ReturnType<typeof createPgaHelpers>;
