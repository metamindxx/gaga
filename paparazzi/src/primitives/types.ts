/**
 * Geometric Primitives - Pure data types for algebra → renderer interface
 *
 * These types represent the OUTPUT of algebra interpretation.
 * The renderer receives these and never sees multivectors.
 *
 * Design principles:
 * - Pure geometry data, no MV references
 * - Weight/orientation included directly
 * - Point pairs are distinct from circles (different grades)
 * - Segments contain resolved Point3D, not entity IDs
 */

/** 3D coordinate tuple */
export type Coords3D = [number, number, number];

/** Common properties for all primitives */
export interface BasePrimitive {
  /** Scalar weight from normalization (optional) */
  weight?: number;
  /** Sign/chirality/handedness (optional) */
  orientation?: 1 | -1;
}

// =============================================================================
// Grade 1: Points and Directions
// =============================================================================

/**
 * Point in 3D space (CGA grade 1, null vector)
 * Corresponds to X² = 0 in CGA
 */
export interface Point3D extends BasePrimitive {
  type: 'point';
  coords: Coords3D;
}

/**
 * Direction/ideal point (CGA grade 1, at infinity)
 * Represents a direction rather than a finite position
 */
export interface Direction3D extends BasePrimitive {
  type: 'direction';
  vector: Coords3D; // Unit direction vector
}

// =============================================================================
// Grade 2: Point Pairs and Tangent Vectors
// =============================================================================

/**
 * Point pair (CGA grade 2)
 * Two points from a sphere-sphere intersection or similar
 */
export interface PointPair3D extends BasePrimitive {
  type: 'pointPair';
  point1: Coords3D;
  point2: Coords3D;
  /** True if this is a real intersection (not imaginary) */
  isReal: boolean;
  /** True if points coincide (tangent case) */
  isTangent?: boolean;
}

// =============================================================================
// Grade 3: Circles and Lines
// =============================================================================

/**
 * Circle in 3D space (CGA grade 3, OPNS)
 * Fully computed geometry - center, radius, normal
 */
export interface Circle3D extends BasePrimitive {
  type: 'circle';
  center: Coords3D;
  radius: number;
  normal: Coords3D; // Unit normal to the circle's plane
}

/**
 * Line in 3D space (CGA grade 3, flat)
 * A point and direction define the infinite line
 */
export interface Line3D extends BasePrimitive {
  type: 'line';
  point: Coords3D; // A point on the line
  direction: Coords3D; // Unit direction vector
}

// =============================================================================
// Grade 4: Spheres and Planes
// =============================================================================

/**
 * Sphere in 3D space (CGA grade 4, OPNS)
 */
export interface Sphere3D extends BasePrimitive {
  type: 'sphere';
  center: Coords3D;
  radius: number;
}

/**
 * Plane in 3D space (CGA grade 4, flat)
 */
export interface Plane3D extends BasePrimitive {
  type: 'plane';
  point: Coords3D; // A point on the plane
  normal: Coords3D; // Unit normal vector
  distance?: number; // Distance from origin (optional)
}

// =============================================================================
// Composite Primitives
// =============================================================================

/**
 * Line segment between two points
 * Contains resolved Point3D, not entity references
 */
export interface Segment3D extends BasePrimitive {
  type: 'segment';
  start: Point3D;
  end: Point3D;
}

/**
 * Triangle (three points)
 */
export interface Triangle3D extends BasePrimitive {
  type: 'triangle';
  p1: Point3D;
  p2: Point3D;
  p3: Point3D;
}

// =============================================================================
// Union Type
// =============================================================================

/**
 * Any geometric primitive
 */
export type GeoPrimitive =
  | Point3D
  | Direction3D
  | PointPair3D
  | Circle3D
  | Line3D
  | Sphere3D
  | Plane3D
  | Segment3D
  | Triangle3D;

/**
 * Primitive type discriminator
 */
export type PrimitiveType = GeoPrimitive['type'];

// =============================================================================
// Type Guards
// =============================================================================

export function isPoint(p: GeoPrimitive): p is Point3D {
  return p.type === 'point';
}

export function isDirection(p: GeoPrimitive): p is Direction3D {
  return p.type === 'direction';
}

export function isPointPair(p: GeoPrimitive): p is PointPair3D {
  return p.type === 'pointPair';
}

export function isCircle(p: GeoPrimitive): p is Circle3D {
  return p.type === 'circle';
}

export function isLine(p: GeoPrimitive): p is Line3D {
  return p.type === 'line';
}

export function isSphere(p: GeoPrimitive): p is Sphere3D {
  return p.type === 'sphere';
}

export function isPlane(p: GeoPrimitive): p is Plane3D {
  return p.type === 'plane';
}

export function isSegment(p: GeoPrimitive): p is Segment3D {
  return p.type === 'segment';
}

export function isTriangle(p: GeoPrimitive): p is Triangle3D {
  return p.type === 'triangle';
}
