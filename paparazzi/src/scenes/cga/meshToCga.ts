/**
 * meshToCga - Turns a loaded glTF model into CGA points.
 *
 * Pipeline:
 *   .glb file  -  THREE.Object3D (scene graph)
 *              -  world-space Euclidean vertices [x, y, z][]
 *              -  (center + scale to fit)
 *              -  CGA conformal points  (cga.up)
 *
 * The CGA point array is the real data model we want to iterate over
 * (as conformal points) in later experiments. Rendering is downstream.
 */

import * as THREE from 'three';
import { cga, ni } from '../../algebra/cga';
import type { Coords3D } from '../../geometry/primitives';
import type { Multivector as MV } from '../../algebra/types';

export interface MeshVertices {
  /** Every mesh vertex, baked into world space */
  positions: Coords3D[];
  /** Triangles as a flat index list into `positions` (empty for point clouds) */
  indices: number[];
  /** The bounding box of the raw vertices, handy for centring and scaling */
  bounds: { min: Coords3D; max: Coords3D; center: Coords3D; size: Coords3D };
}

/**
 * Walk a glTF scene graph and pull every mesh vertex into a flat list,
 * baked into world space (so node transforms are applied).
 */
export function extractVertices(root: THREE.Object3D): MeshVertices {
  const positions: Coords3D[] = [];
  const indices: number[] = [];

  const min: Coords3D = [Infinity, Infinity, Infinity];
  const max: Coords3D = [-Infinity, -Infinity, -Infinity];

  root.updateWorldMatrix(true, true);

  const v = new THREE.Vector3();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!(mesh as THREE.Mesh).isMesh) return;

    const geom = mesh.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!posAttr) return;

    const base = positions.length;

    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i).applyMatrix4(mesh.matrixWorld);
      const p: Coords3D = [v.x, v.y, v.z];
      positions.push(p);

      for (let a = 0; a < 3; a++) {
        if (p[a] < min[a]) min[a] = p[a];
        if (p[a] > max[a]) max[a] = p[a];
      }
    }

    const index = geom.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i++) indices.push(base + index.getX(i));
    } else {
      for (let i = 0; i < posAttr.count; i++) indices.push(base + i);
    }
  });

  const center: Coords3D = [
    (min[0] + max[0]) / 2
    , (min[1] + max[1]) / 2
    , (min[2] + max[2]) / 2
  ];
  const size: Coords3D = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

  return { positions, indices, bounds: { min, max, center, size } };
}

/**
 * Center the point cloud at the origin and scale it so its largest
 * dimension spans `fitSize` world units. Keeps the model inside the
 * typical [-1, 1] working volume of the CGA scenes.
 */
export function normalizeVertices(mesh: MeshVertices, fitSize = 2): Coords3D[] {
  const { center, size } = mesh.bounds;
  const maxDim = Math.max(size[0], size[1], size[2]) || 1;
  const s = fitSize / maxDim;
  return mesh.positions.map(([x, y, z]) => [
    (x - center[0]) * s
    , (y - center[1]) * s
    , (z - center[2]) * s
  ]);
}

/**
 * Downsample a vertex list to at most `maxCount`
 * entries (stride sampling preserves rough shape coverage).
 */
export function downsample<T>(items: T[], maxCount: number): T[] {
  if (maxCount <= 0 || items.length <= maxCount) return items;
  const stride = items.length / maxCount;
  const out: T[] = [];
  for (let i = 0; i < maxCount; i++) out.push(items[Math.floor(i * stride)]);
  return out;
}

/** Lift plain Euclidean vertices up into CGA conformal points (null vectors). */
export function liftToCgaPoints(verts: Coords3D[]): MV[] {
  return verts.map((p) => cga.up(p));
}

/** Bring CGA conformal points back down to ordinary [x, y, z] coordinates. */
export function lowerToCoords(points: MV[]): Coords3D[] {
  return points.map((P) => cga.down(P) ?? [0, 0, 0]);
}

// ===========================================================================
// Plane ∩ mesh contour (CGA meet)
// ===========================================================================

/**
 * Extract Euclidean coords from a grade-2 CGA flat point F = X ∧ n∞.
 *
 * With n₀ = ½(e₋-e₊), n∞ = e₋+e₊, one has
 *   X ∧ n∞ = -e_pm + Σ xᵢ (e_ip + e_im)
 * so  xᵢ = coeff(e_ip) / (-coeff(e_pm))  (scale-invariant).
 */
export function flatPointCoords(F: MV): Coords3D {
  const w = -(F.basisSVal('e_pm') ?? 0);
  if (Math.abs(w) < 1e-12) return [0, 0, 0];
  return [
    (F.basisSVal('e_1p') ?? 0) / w
    , (F.basisSVal('e_2p') ?? 0) / w
    , (F.basisSVal('e_3p') ?? 0) / w
  ];
}

/**
 * Intersect the (OPNS, grade-4) plane with the edge AB by meeting it with
 * the OPNS line L = A ∧ B ∧ n∞. Returns the Euclidean crossing point.
 */
export function meetPlaneEdge(planeOPNS: MV, A: MV, B: MV): Coords3D {
  const line = A.op(B).op(ni); // the OPNS line running through A and B
  const flat = cga.meet(planeOPNS, line); // where it pierces the plane: a flat point
  return flatPointCoords(flat);
}

/**
 * Compute the contour where an IPNS plane Π cuts a triangle mesh.
 *
 * For every triangle, classify its 3 vertices by sign(P·Π) (the exact
 * signed distance for a unit normal). A crossed triangle has exactly two
 * edges whose endpoints straddle the plane; each is intersected via a CGA
 * meet, and the two crossing points form one contour segment.
 *
 * @param points  CGA points, one per mesh vertex (same indexing as `indices`).
 * @param indices Triangles as a flat index list (length is a multiple of 3).
 * @param planeIPNS  The cutting plane in IPNS form (Π = n̂ + d·n∞).
 * @returns A flat array ready for a Float32Array: six numbers
 *          (two xyz endpoints) for each segment.
 */
export function computeContourSegments(
  points: MV[]
  , indices: number[]
  , planeIPNS: MV
): number[] {
  const planeOPNS = planeIPNS.dual();

  // Signed distance of every vertex to the plane: P · Π.
  const dist = points.map((P) => P.dot(planeIPNS).basisSVal('e_') ?? 0);
  const EPS = 1e-9;
  const sideOf = (d: number) => (d > EPS ? 1 : d < -EPS ? -1 : 0);

  const out: number[] = [];

  for (let t = 0; t + 2 < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    const s = tri.map((i) => sideOf(dist[i]));

    // All three corners on the same side (or all sitting in the plane)?
    // Then the plane doesn't cut this triangle, move on.
    if (s[0] === s[1] && s[1] === s[2]) continue;

    // Walk the three edges; wherever the two ends disagree, the plane cuts
    // through and we record the crossing point.
    const crossings: Coords3D[] = [];
    for (let e = 0; e < 3; e++) {
      const a = tri[e];
      const b = tri[(e + 1) % 3];
      if (s[e] === 0 && s[(e + 1) % 3] === 0) continue; // whole edge lies in the plane
      if (sideOf(dist[a]) * sideOf(dist[b]) < 0) {
        crossings.push(meetPlaneEdge(planeOPNS, points[a], points[b]));
      }
    }

    // A clean cut gives exactly two crossings, join them into a segment.
    if (crossings.length === 2) {
      out.push(
        crossings[0][0], crossings[0][1], crossings[0][2]
        , crossings[1][0], crossings[1][1], crossings[1][2]
      );
    }
  }

  return out;
}
