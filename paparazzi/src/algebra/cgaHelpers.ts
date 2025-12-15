/**
 * CGA Helpers - Pure functions for up/down/classify/embed
 *
 * These functions convert between:
 * - Euclidean coordinates [x, y, z]
 * - CGA Multivectors (from basisSet.js)
 * - Geometric primitives (Point3D, Circle3D, etc.)
 *
 * No Svelte, no Three.js - just math.
 */

import type {
  Coords3D
  , GeoPrimitive
  , Point3D
  , Direction3D
  , PointPair3D
  , Circle3D
  , Line3D
  , Sphere3D
  , Plane3D
} from '../primitives/types.js';
import type { Multivector as MV } from './types.js';

/** CGA basis elements required for helpers */
export interface CgaBasis {
  no: MV; // Origin (null vector at origin)
  ni: MV; // Infinity (null vector at infinity)
  I5: MV; // Pseudoscalar
  e1: MV; // x basis
  e2: MV; // y basis
  e3: MV; // z basis
  one: MV; // Scalar 1
}

/** Threshold for numerical comparisons */
const EPSILON = 1e-6;

/** Flag to only warn once about Euclidean vectors */
let warnedAboutEuclideanVector = false;

/**
 * Create CGA helper functions bound to a specific basis
 */
export function createCgaHelpers(basis: CgaBasis) {
  const { no, ni, I5, e1, e2, e3, one } = basis;
  const noNi = no.op(ni); // no ∧ ni (Minkowski plane)

  // =========================================================================
  // Core Transformations: up / down
  // =========================================================================

  /**
   * Embed Euclidean point into CGA
   * up(x) = n₀ + x + ½x²nᵢ
   *
   * Accepts either:
   * - Coords3D: [x, y, z] tuple
   * - MV: Euclidean vector (e1, e2, e3 components only)
   */
  function up(x: Coords3D | MV): MV {
    // Check if it's a Coords3D array
    if (Array.isArray(x)) {
      const [px, py, pz] = x;
      x = e1.smul(px).add(e2.smul(py)).add(e3.smul(pz));
    }
    // up(x) = no + x + 0.5*x*x*ni
    const xSq = x.gp(x).basisSVal('e_') ?? 0; // x*x gives scalar
    return no.add(x).add(ni.smul(0.5 * xSq));
  }

  /**
   * Extract Euclidean coordinates from CGA point
   * down(X) = (X ∧ (n₀ ∧ nᵢ)) · (n₀ ∧ nᵢ) / (-X · nᵢ)
   *
   * Returns null for ideal points (use directionOf instead)
   */
  function down(pt: MV): Coords3D | null {
    if (!pt) return null;

    const xDotNi = pt.scalarProduct(ni);
    if (Math.abs(xDotNi) < EPSILON) return null; // Ideal point

    const euclidean = pt
      .op(noNi)
      .gp(noNi)
      .smul(1 / -xDotNi);

    const x = euclidean.basisSVal('e_1');
    const y = euclidean.basisSVal('e_2');
    const z = euclidean.basisSVal('e_3');

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return null;
    }

    return [x, y, z];
  }

  /**
   * Extract direction from an ideal point (grade 1 with X·nᵢ ≈ 0)
   */
  function directionOf(pt: MV): Coords3D | null {
    if (!pt) return null;

    const xDotNi = pt.scalarProduct(ni);
    if (Math.abs(xDotNi) >= EPSILON) return null; // Not ideal

    const x = pt.basisSVal('e_1');
    const y = pt.basisSVal('e_2');
    const z = pt.basisSVal('e_3');
    const mag = Math.sqrt(x * x + y * y + z * z);

    if (mag < EPSILON) return null;
    return [x / mag, y / mag, z / mag];
  }

  /**
   * Extract Euclidean components from a pure vector MV (no conformal part)
   * Useful for intermediate calculations
   */
  function vec3(v: MV): Coords3D {
    return [v.basisSVal('e_1'), v.basisSVal('e_2'), v.basisSVal('e_3')];
  }

  // =========================================================================
  // Classification: classify
  // =========================================================================

  /**
   * Classify a multivector and extract its geometric primitive
   * Uses grade-driven logic based on mv.getGrades()
   */
  function classify(mv: MV): GeoPrimitive | null {
    if (!mv) return null;

    // Get the grades present in this MV (getGrades returns a Set)
    const gradesSet = mv.getGrades?.();
    if (!gradesSet) return null;
    const grades = Array.from(gradesSet) as number[];

    // Single grade classification
    if (grades.length === 1) {
      const grade = grades[0];

      switch (grade) {
        case 1:
          return classifyGrade1(mv);
        case 2:
          return classifyGrade2(mv);
        case 3:
          return classifyGrade3(mv);
        case 4:
          return classifyGrade4(mv);
      }
    }

    // TODO: Mixed grades (rotors, motors, etc.)
    // if (grades.includes(0) && grades.includes(2)) { ... }

    return null;
  }

  /**
   * Grade 1: Point or Direction
   *
   * In CGA:
   * - A finite point has X·nᵢ ≠ 0 (typically -1 for normalized)
   * - An ideal point (direction) has X·nᵢ = 0 AND has conformal components
   * - A pure Euclidean vector (only e1,e2,e3) is not a valid CGA entity
   *   and returns null (caller should use up() to embed it first)
   */
  function classifyGrade1(mv: MV): Point3D | Direction3D | null {
    const xDotNi = mv.scalarProduct(ni);

    // Check if this is a pure Euclidean vector (no conformal components)
    // by checking if it has any e_p or e_m components
    const hasEp = Math.abs(mv.basisSVal('e_p') ?? 0) > EPSILON;
    const hasEm = Math.abs(mv.basisSVal('e_m') ?? 0) > EPSILON;
    const hasConformal = hasEp || hasEm;

    // Pure Euclidean vector - not a valid CGA entity
    if (!hasConformal) {
      if (!warnedAboutEuclideanVector) {
        warnedAboutEuclideanVector = true;
        console.warn(
          'classify: grade-1 MV has no conformal components. Use up() to embed Euclidean vectors.'
        );
      }
      return null;
    }

    // Check if ideal point (direction): X·nᵢ ≈ 0 with conformal components
    if (Math.abs(xDotNi) < EPSILON) {
      const dir = directionOf(mv);
      if (dir) {
        return { type: 'direction', vector: dir };
      }
      return null;
    }

    // Finite CGA point
    const coords = down(mv);
    if (!coords) return null;

    const weight = Math.abs(xDotNi) > EPSILON ? -xDotNi : undefined;
    return { type: 'point', coords, weight };
  }

  /**
   * Grade 2: Point Pair or Tangent Vector
   */
  function classifyGrade2(mv: MV): PointPair3D | null {
    // PP² gives the discriminant
    const ppSq = mv.gp(mv).basisSVal('e_');

    const isReal = ppSq >= EPSILON;
    const isTangent = Math.abs(ppSq) < EPSILON;

    if (isReal) {
      // Extract the two points: P± = (1 ± PP/|PP|) · (PP · nᵢ)
      const ppNorm = Math.sqrt(ppSq);
      const ppUnit = mv.smul(1 / ppNorm);
      const ppDotNi = mv.dot(ni);

      const proj1 = one.add(ppUnit).gp(ppDotNi);
      const proj2 = one.sub(ppUnit).gp(ppDotNi);

      const p1 = down(proj1);
      const p2 = down(proj2);

      if (!p1 || !p2) return null;

      return { type: 'pointPair', point1: p1, point2: p2, isReal: true };
    } else if (isTangent) {
      // Tangent case: both points coincide
      const ppDotNi = mv.dot(ni);
      const p = down(ppDotNi);
      if (!p) return null;

      return {
        type: 'pointPair'
        , point1: p
        , point2: p
        , isReal: true
        , isTangent: true
      };
    } else {
      // Imaginary point pair (no real intersection)
      // Return the "center" as both points for visualization
      const ppDotNi = mv.dot(ni);
      const center = down(ppDotNi);
      if (!center) return null;

      return {
        type: 'pointPair'
        , point1: center
        , point2: center
        , isReal: false
      };
    }
  }

  /**
   * Grade 3: Circle or Line
   */
  function classifyGrade3(mv: MV): Circle3D | Line3D | null {
    // Wedge with nᵢ to get plane pseudoscalar
    const Ic = mv.op(ni);
    const IcSq = Math.abs(Ic.sq());

    if (IcSq < EPSILON) {
      // It's a line (flat, contains infinity)
      return extractLine(mv);
    }

    // It's a circle
    return extractCircle(mv, Ic, IcSq);
  }

  /**
   * Extract circle geometry from grade-3 MV
   */
  function extractCircle(mv: MV, Ic: MV, IcSq: number): Circle3D | null {
    const IcSize = Math.sqrt(IcSq);
    const IcNorm = Ic.smul(1 / IcSize);

    // Dual of circle wrt its plane
    const circDual = mv.gp(IcNorm);
    const cdDotNi = circDual.scalarProduct(ni);
    if (Math.abs(cdDotNi) < EPSILON) return null;

    const circDualNorm = circDual.smul(-1 / cdDotNi);

    // Center: C* (1 + C*·nᵢ/2)
    const centerMv = circDualNorm.gp(circDualNorm.gp(ni).smul(0.5).sadd(1));
    const center = down(centerMv);
    if (!center) return null;

    // Radius
    const radius = Math.sqrt(Math.abs(circDualNorm.sq()));

    // Normal from dual of plane pseudoscalar
    const IcD = I5.gp(IcNorm);
    const nx = IcD.basisSVal?.('e_1') ?? IcD.bVal?.('e_1') ?? 0;
    const ny = IcD.basisSVal?.('e_2') ?? IcD.bVal?.('e_2') ?? 0;
    const nz = IcD.basisSVal?.('e_3') ?? IcD.bVal?.('e_3') ?? 0;
    const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);

    if (mag < EPSILON) return null;
    const normal: Coords3D = [nx / mag, ny / mag, nz / mag];

    return { type: 'circle', center, radius, normal };
  }

  /**
   * Extract line geometry from grade-3 MV (flat)
   */
  function extractLine(mv: MV): Line3D | null {
    // For a flat (line), we need a point on the line and direction
    // Line dual: L* = I₅L gives a bivector containing direction info
    const Ld = I5.gp(mv);

    // Direction from the e₁₂₃ part
    // TODO: Proper line extraction - this is simplified
    const dx = Ld.basisSVal?.('e_23') ?? 0;
    const dy = (Ld.basisSVal?.('e_31') ?? Ld.basisSVal?.('e_13')) ? -Ld.basisSVal('e_13') : 0;
    const dz = Ld.basisSVal?.('e_12') ?? 0;

    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (mag < EPSILON) return null;

    const direction: Coords3D = [dx / mag, dy / mag, dz / mag];

    // Point on line - use moment extraction
    // Simplified: use origin projection
    const point: Coords3D = [0, 0, 0]; // TODO: Proper point extraction

    return { type: 'line', point, direction };
  }

  /**
   * Grade 4: Sphere or Plane
   */
  function classifyGrade4(mv: MV): Sphere3D | Plane3D | null {
    // Dual sphere in I₅
    const sphD = I5.gp(mv);
    const sphDN = Math.abs(sphD.scalarProduct(ni));

    if (sphDN < EPSILON) {
      // It's a plane (flat, contains infinity)
      return extractPlane(mv);
    }

    // It's a sphere
    return extractSphere(sphD, sphDN);
  }

  /**
   * Extract sphere geometry from grade-4 MV
   */
  function extractSphere(sphD: MV, sphDN: number): Sphere3D | null {
    const sphDNorm = sphD.smul(1 / sphDN);
    const radius = Math.sqrt(Math.abs(sphDNorm.sq()));

    // Very large radius indicates plane
    if (radius > 1000) return null;

    // Center: S* nᵢ S*
    const centerMv = sphDNorm.gp(ni.gp(sphDNorm));
    const center = down(centerMv);
    if (!center) return null;

    return { type: 'sphere', center, radius };
  }

  /**
   * Extract plane geometry from grade-4 MV (flat)
   */
  function extractPlane(mv: MV): Plane3D | null {
    const phiMag = Math.sqrt(Math.abs(-mv.sq()));
    if (phiMag < EPSILON) return null;

    const phi = mv.smul(1 / phiMag);
    const phiD = I5.gp(phi);
    const distance = phiD.scalarProduct(no);

    const nx = phiD.basisSVal?.('e_1') ?? phiD.bVal?.('e_1') ?? 0;
    const ny = phiD.basisSVal?.('e_2') ?? phiD.bVal?.('e_2') ?? 0;
    const nz = phiD.basisSVal?.('e_3') ?? phiD.bVal?.('e_3') ?? 0;
    const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);

    if (mag < EPSILON) return null;
    const normal: Coords3D = [nx / mag, ny / mag, nz / mag];

    // Point on plane
    const d = distance / mag;
    const point: Coords3D = [normal[0] * d, normal[1] * d, normal[2] * d];

    return { type: 'plane', point, normal, distance: d };
  }

  // =========================================================================
  // Embedding: embed
  // =========================================================================

  /**
   * Construct MV from a geometric primitive (inverse of classify)
   */
  function embed(prim: GeoPrimitive): MV | null {
    switch (prim.type) {
      case 'point':
        return up(prim.coords);

      case 'direction':
        // Direction = pure Euclidean vector (no conformal part)
        return e1.smul(prim.vector[0]).add(e2.smul(prim.vector[1])).add(e3.smul(prim.vector[2]));

      case 'sphere':
        // S = c - ½r²nᵢ  (IPNS) or dual for OPNS
        const sphereCenter = up(prim.center);
        return sphereCenter.sub(ni.smul(0.5 * prim.radius * prim.radius)).dual();

      // TODO: circle, plane, line, pointPair embedding
      default:
        return null;
    }
  }

  // =========================================================================
  // Utility Functions
  // =========================================================================

  /**
   * Meet (regressive product): a & b = !((!a) ∧ (!b))
   */
  function meet(a: MV, b: MV): MV {
    return a.dual().op(b.dual()).unDual();
  }

  /**
   * Create a sphere IPNS from center and radius
   * S = c - ½r²nᵢ
   */
  function sphere(center: Coords3D, radius: number): MV {
    const c = up(center);
    return c.sub(ni.smul(0.5 * radius * radius));
  }

  /**
   * Create a translator motor
   * T = 1 - ½ d·nᵢ
   */
  function translator(direction: Coords3D, distance: number): MV {
    const d = e1.smul(direction[0]).add(e2.smul(direction[1])).add(e3.smul(direction[2]));
    return one.sub(d.op(ni).smul(0.5 * distance));
  }

  return {
    // Core transformations
    up
    , down
    , directionOf
    , vec3

    // Classification
    , classify

    // Embedding
    , embed

    // Utilities
    , meet
    , sphere
    , translator

    // Basis access
    , basis
  };
}

export type CgaHelpers = ReturnType<typeof createCgaHelpers>;
