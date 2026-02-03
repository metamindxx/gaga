/**
 * CGA Mirror Math - Pure geometric algebra operations for sphere/circle inversion
 *
 * TODO: most of this can be inlined or moved into the algebra proper, it's here as a development cheatsheet for now
 * 
 * Point:   P = cga.up(x, y, z)
 *          Lifts Euclidean coords to CGA null vector
 *
 * Sphere:  S = c - ½r²n∞
 *          where c = center point (CGA), r = radius, n∞ = point at infinity
 *          This is the Inner Product Null Space (IPNS) representation
 *
 * Plane:   Π = n + d·n∞
 *          where n = unit normal (as vector), d = signed distance from origin
 *
 * Circle:  C = (S ∧ Π)*
 *          The meet (outer product then dual) of a sphere and plane
 *
 * To invert/reflect any round X through mirror M:
 *
 *   X' = M · X · M / M²
 *
 * This is the "sandwich product" normalized by M².
 *
 * For visualization, we often need the OPNS (Outer Product Null Space) form:
 *   OPNS = IPNS.dual()
 *
 * And to extract Euclidean coordinates from a CGA point:
 *   coords = cga.down(P)
 */

import type { MultiVector } from '$algebra/basisSet';
import { cga, ni, e1, e2, e3 } from '../../algebra/cga';
import type { Coords3D } from '../../geometry/primitives';

// Multivector type from our CGA algebra
type MV = MultiVector;

export function point(coords: Coords3D): MV {
  return cga.up(coords);
}

export function sphere(center: Coords3D, radius: number): MV {
  const c = cga.up(center);
  return c.sub(ni.smul(0.5 * radius * radius));
}

export function plane(normal: Coords3D, distance: number): MV {
  const [nx, ny, nz] = normal;
  const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (mag < 1e-10) throw new Error('Normal vector too small');

  const n = e1.smul(nx / mag).add(e2.smul(ny / mag)).add(e3.smul(nz / mag));
  return n.add(ni.smul(distance));
}

export function planeThroughPoint(normal: Coords3D, pointOnPlane: Coords3D): MV {
  const [nx, ny, nz] = normal;
  const [px, py, pz] = pointOnPlane;
  const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (mag < 1e-10) throw new Error('Normal vector too small');

  // d = -n·p (signed distance when n is unit)
  const d = -(nx * px + ny * py + nz * pz) / mag;
  return plane(normal, d);
}

export function circle(center: Coords3D, radius: number, normal: Coords3D): MV {
  const s = sphere(center, radius);
  const p = planeThroughPoint(normal, center);
  return s.op(p).dual();
}

export function invert(object: MV, mirror: MV): MV {
  const MXMr = mirror.gp(object).gp(mirror.reverse());
  const MSq = mirror.gp(mirror).basisSVal('e_') ?? 1;
  if (Math.abs(MSq) < 1e-10) return object;
  return MXMr.smul(1 / MSq);
}

export function down(cgaPoint: MV): Coords3D {
  return cga.down(cgaPoint) ?? [0, 0, 0];
}

export function dual(mv: MV): MV {
  return mv.dual();
}

export { cga, ni, e1, e2, e3 };
