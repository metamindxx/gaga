/**
 * meshToCga contour tests
 *
 * Tests the CGA plane/edge meet used to build mesh cutting contours:
 * - flat-point coordinate extraction (grade-2 X ∧ n∞)
 * - meetPlaneEdge against a known plane/edge
 * - computeContourSegments topology on a single triangle
 */

import { describe, it, expect } from 'vitest';
import { cga, ni } from '../../algebra/cga';
import * as cgaM from './cgaMirrors';
import {
  flatPointCoords
  , meetPlaneEdge
  , computeContourSegments
} from './meshToCga';

describe('flatPointCoords', () => {
  it('recovers coords from a flat point X ∧ n∞', () => {
    const x = [0.3, -0.7, 1.2] as [number, number, number];
    const F = cga.up(x).op(ni); // flat point X ∧ n∞ (grade 2)
    const back = flatPointCoords(F);
    expect(back[0]).toBeCloseTo(x[0], 6);
    expect(back[1]).toBeCloseTo(x[1], 6);
    expect(back[2]).toBeCloseTo(x[2], 6);
  });
});

describe('meetPlaneEdge', () => {
  it('meets the z=0 plane with a vertical edge at the crossing point', () => {
    // The plane z = 0: normal (0,0,1), distance 0.
    const planeOPNS = cgaM.plane([0, 0, 1], 0).dual();
    const A = cga.up([0.2, -0.3, 1]); // sits above the plane
    const B = cga.up([0.2, -0.3, -1]); // sits below it
    const p = meetPlaneEdge(planeOPNS, A, B);
    expect(p[0]).toBeCloseTo(0.2, 5);
    expect(p[1]).toBeCloseTo(-0.3, 5);
    expect(p[2]).toBeCloseTo(0, 5);
  });

  it('meets a tilted plane at the linearly-interpolated crossing', () => {
    // The plane x + y = 0  (normal (1,1,0)/√2, distance 0).
    const planeOPNS = cgaM.plane([1, 1, 0], 0).dual();
    const A = cga.up([1, 0, 0.5]); // x+y = 1,  on the positive side
    const B = cga.up([-1, 0, 0.5]); // x+y = -1, on the negative side
    const p = meetPlaneEdge(planeOPNS, A, B);
    // The edge crosses x+y=0 right in the middle -> x=0, y=0, z=0.5.
    expect(p[0]).toBeCloseTo(0, 5);
    expect(p[1]).toBeCloseTo(0, 5);
    expect(p[2]).toBeCloseTo(0.5, 5);
  });
});

describe('computeContourSegments', () => {
  it('produces one segment across a single crossed triangle', () => {
    // Triangle with one vertex above z=0 and two below -> 2 crossings -> 1 segment
    const verts = [
      [0, 0, 1] // above
      , [-1, 0, -1] // below
      , [1, 0, -1] // below
    ] as [number, number, number][];
    const points = verts.map((v) => cga.up(v));
    const planeIPNS = cgaM.plane([0, 0, 1], 0);
    const segs = computeContourSegments(points, [0, 1, 2], planeIPNS);
    expect(segs.length).toBe(6); // one segment is two xyz endpoints

    // Both endpoints should land on z = 0.
    expect(segs[2]).toBeCloseTo(0, 5);
    expect(segs[5]).toBeCloseTo(0, 5);
  });

  it('returns nothing when the triangle does not cross the plane', () => {
    const verts = [
      [0, 0, 1]
      , [1, 0, 1]
      , [0, 1, 1]
    ] as [number, number, number][];
    const points = verts.map((v) => cga.up(v));
    const planeIPNS = cgaM.plane([0, 0, 1], 0);
    const segs = computeContourSegments(points, [0, 1, 2], planeIPNS);
    expect(segs.length).toBe(0);
  });
});
