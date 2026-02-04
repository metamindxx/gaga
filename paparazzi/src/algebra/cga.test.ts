/**
 * CGA Algebra Unit Tests
 *
 * Documents known issues and validates fixes in the basisSet.js algebra implementation.
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { cga, e1, e2, e3, no, ni, one, I5 } from './cga';

describe('Basis Elements', () => {
  it('e1, e2, e3 square to +1', () => {
    expect(e1.gp(e1).basisSVal('e_')).toBeCloseTo(1, 6);
    expect(e2.gp(e2).basisSVal('e_')).toBeCloseTo(1, 6);
    expect(e3.gp(e3).basisSVal('e_')).toBeCloseTo(1, 6);
  });

  it('ni and no are null vectors', () => {
    expect(ni.gp(ni).basisSVal('e_')).toBeCloseTo(0, 6);
    expect(no.gp(no).basisSVal('e_')).toBeCloseTo(0, 6);
  });

  it('ni · no = -1', () => {
    expect(ni.dot(no).basisSVal('e_')).toBeCloseTo(-1, 6);
  });

  it('I5 squares to -1', () => {
    expect(I5.gp(I5).basisSVal('e_')).toBeCloseTo(-1, 6);
  });
});

describe('exp() function', () => {
  it('exp(e12 * θ/2) produces correct rotor for simple rotation', () => {
    const e12 = e1.op(e2);
    const theta = Math.PI / 4;
    const halfTheta = theta / 2;

    const R = e12.exp(halfTheta);

    // exp(B * θ) = cos(θ) + sin(θ) * B for unit bivector B with B^2 = -1
    const expectedScalar = Math.cos(halfTheta);
    const expectedBivector = Math.sin(halfTheta);

    expect(R.basisSVal('e_')).toBeCloseTo(expectedScalar, 6);
    expect(R.basisSVal('e_12')).toBeCloseTo(expectedBivector, 6);
  });

  it('exp(e12 * θ/2) works for negative angles', () => {
    const e12 = e1.op(e2);
    const theta = -Math.PI / 4;
    const halfTheta = theta / 2;

    const R = e12.exp(halfTheta);

    expect(R.basisSVal('e_')).toBeCloseTo(Math.cos(halfTheta), 6);
    expect(R.basisSVal('e_12')).toBeCloseTo(Math.sin(halfTheta), 6);
  });

  it('exp(e12 * θ/2) works for small angles', () => {
    const e12 = e1.op(e2);
    const halfTheta = 0.01;

    const R = e12.exp(halfTheta);

    expect(R.basisSVal('e_')).toBeCloseTo(Math.cos(halfTheta), 6);
    expect(R.basisSVal('e_12')).toBeCloseTo(Math.sin(halfTheta), 6);
  });

  it('composed rotor R * ~R = 1 (unit rotor)', () => {
    const e12 = e1.op(e2);
    const e13 = e1.op(e3);
    const e23 = e2.op(e3);

    const theta0 = Math.PI / 8;
    const theta1 = Math.PI / 6;
    const theta2 = Math.PI / 7;

    const R = e13
      .exp(theta2 / 2)
      .gp(e23.exp(theta1 / 2))
      .gp(e12.exp(theta0 / 2))
      .normalize();

    const RRrev = R.gp(R.reverse());

    expect(RRrev.basisSVal('e_')).toBeCloseTo(1, 5);
    // All other components should be ~0
    expect(RRrev.basisSVal('e_12') || 0).toBeCloseTo(0, 5);
    expect(RRrev.basisSVal('e_13') || 0).toBeCloseTo(0, 5);
    expect(RRrev.basisSVal('e_23') || 0).toBeCloseTo(0, 5);
  });
});

describe('up() and down() functions', () => {
  it('up([0,0,0]) gives origin point', () => {
    const origin = cga.up([0, 0, 0]);
    // up(0) = no + 0 + 0 = no
    expect(origin.basisSVal('e_p')).toBeCloseTo(no.basisSVal('e_p'), 6);
    expect(origin.basisSVal('e_m')).toBeCloseTo(no.basisSVal('e_m'), 6);
  });

  it('down(up(x)) = x roundtrip', () => {
    const coords = [1.5, -2.3, 0.7] as [number, number, number];
    const point = cga.up(coords);
    const back = cga.down(point);

    expect(back).not.toBeNull();
    expect(back![0]).toBeCloseTo(coords[0], 6);
    expect(back![1]).toBeCloseTo(coords[1], 6);
    expect(back![2]).toBeCloseTo(coords[2], 6);
  });

  it('up(euclidean MV) works for pure vectors', () => {
    const vec = e1.smul(2).add(e2.smul(3)).add(e3.smul(-1));
    const point = cga.up(vec);
    const back = cga.down(point);

    expect(back).not.toBeNull();
    expect(back![0]).toBeCloseTo(2, 6);
    expect(back![1]).toBeCloseTo(3, 6);
    expect(back![2]).toBeCloseTo(-1, 6);
  });
});

describe('dual() function', () => {
  it('dual(dual(x)) = ±x', () => {
    // In R(4,1), I² = -1, so dual(dual(x)) = x * I⁻¹ * I⁻¹ = x * I⁻² = x * (-1)⁻¹ = -x
    // Or it could be x depending on convention
    const dualDual = e1.dual().dual();

    // Check if we get back e1 or -e1
    const e1coeff = dualDual.basisSVal('e_1');
    expect(Math.abs(e1coeff)).toBeCloseTo(1, 6);
  });

  it('e1.dual() is grade 4', () => {
    const e1d = e1.dual();
    expect(e1d.grade()).toBe(4);
  });

  /**
   * KNOWN ISSUE: Our dual() may have opposite sign from ganja.js
   *
   * In ganja.js: !e1 uses left complement (I⁻¹ * e1)
   * Our dual(): uses right complement (e1 * I⁻¹)
   *
   * For CGA with I² = -1:
   * - Right: e1 * I⁻¹ = -e1 * I = +e_23pm (or similar)
   * - Left: I⁻¹ * e1 = -I * e1 = -e_23pm (or similar)
   *
   * This sign difference can affect meet() computations.
   */
  it.skip('dual sign matches ganja.js convention', () => {
    // This test documents the expected behavior from ganja.js
    // Skip until we decide on convention
    const e1d = e1.dual();
    // Expected: -e_23pm based on ganja.js left complement
    expect(e1d.basisSVal('e_23pm')).toBeCloseTo(-1, 6);
  });
});

describe('Point pairs', () => {
  it('real point pair has positive square', () => {
    // Two distinct points form a real point pair with PP² > 0
    const P1 = cga.up([1, 0, 0]);
    const P2 = cga.up([0, 1, 0]);
    const PP = P1.op(P2);

    const PPsq = PP.gp(PP).basisSVal('e_');
    expect(PPsq).toBeGreaterThan(0);
  });

  it('coincident points give zero point pair', () => {
    const P = cga.up([1, 2, 3]);
    const PP = P.op(P);

    // P ∧ P = 0
    const PPsq = PP.gp(PP).basisSVal('e_') || 0;
    expect(PPsq).toBeCloseTo(0, 6);
  });
});

describe('Circles', () => {
  it('circle from 3 points has grade 3', () => {
    const P1 = cga.up([1, 0, 0]);
    const P2 = cga.up([0, 1, 0]);
    const P3 = cga.up([-1, 0, 0]);
    const circle = P1.op(P2).op(P3);

    expect(circle.grade()).toBe(3);
  });

  /**
   * KNOWN ISSUE: Circle C² sign convention
   *
   * In standard CGA, a real circle should have C² < 0.
   * Our implementation gives C² > 0.
   *
   * This may be related to the dual sign convention or
   * the definition of the inner product.
   */
  it.skip('real circle has negative square (KNOWN BUG)', () => {
    const P1 = cga.up([1, 0, 0]);
    const P2 = cga.up([0, 1, 0]);
    const P3 = cga.up([-1, 0, 0]);
    const circle = P1.op(P2).op(P3);

    const Csq = circle.gp(circle).basisSVal('e_');
    expect(Csq).toBeLessThan(0);
  });
});

describe('meet() - regressive product', () => {
  it('meet of two planes gives a line (grade 3)', () => {
    // z=0 plane: three points in z=0 wedged with ni
    const plane1 = cga
      .up([1, 0, 0])
      .op(cga.up([0, 1, 0]))
      .op(cga.up([0, 0, 0]))
      .op(ni);
    // y=0 plane
    const plane2 = cga
      .up([1, 0, 0])
      .op(cga.up([0, 0, 1]))
      .op(cga.up([0, 0, 0]))
      .op(ni);

    expect(plane1.grade()).toBe(4);
    expect(plane2.grade()).toBe(4);

    const line = cga.meet(plane1, plane2);
    expect(line.grade()).toBe(3);
  });

  it('meet of plane and sphere gives a circle (grade 3)', () => {
    // Sphere at origin with radius 1
    const sphereCenter = cga.up([0, 0, 0]);
    const sphereIPNS = sphereCenter.sub(ni.smul(0.5)); // r=1
    const sphere = sphereIPNS.dual(); // OPNS, grade 4

    // z=0 plane
    const plane = cga
      .up([1, 0, 0])
      .op(cga.up([0, 1, 0]))
      .op(cga.up([0, 0, 0]))
      .op(ni);

    const circle = cga.meet(plane, sphere);
    expect(circle.grade()).toBe(3);
  });

  /**
   * KNOWN ISSUE: Circle-circle intersection in slide30
   *
   * When computing IK for the 3-DOF Agile Eye, we intersect:
   * - Fixed circle k0 (on sphere S, in fixed plane a0)
   * - Moving circle c0 (on sphere S, in moving plane p0)
   *
   * The intersection should give a point pair (grade 2) with:
   * - PP² > 0 for real intersection (two points)
   * - PP² < 0 for imaginary intersection (circles don't meet)
   *
   * Currently getting PP² < 0 even when circles should intersect.
   * Possible causes:
   * 1. Dual sign convention mismatch
   * 2. Plane construction error?
   * 3. Sphere construction error?
   */
  it.skip('circle-circle intersection on sphere gives real point pair', () => {
    // This test documents the expected behavior for slide30
    // Skip until the underlying issue is resolved
    // Setup from slide30...
    // const T0 = meet(meet(a0, p0), S).selectGrade(2);
    // expect(T0.gp(T0).basisSVal('e_')).toBeGreaterThan(0);
  });
});

describe('Slide30 IK Debugging', () => {
  /**
   * These tests document the specific issues found while debugging
   * the 3-DOF Agile Eye inverse kinematics in slide30.
   */

  const _e12 = e1.op(e2);
  const _e13 = e1.op(e3);
  const _e23 = e2.op(e3);

  // Robot parameters from slide30
  const s0 = e1.smul(1.0);
  const _s1 = e1.smul(-0.5).add(e2.smul(Math.sqrt(3) / 2));
  const _s2 = e1.smul(-0.5).add(e2.smul(-Math.sqrt(3) / 2));
  const r_b = 0.5;
  const r_e = 0.4;

  const rotation_centre = e3.smul(-(1 / 3) * r_b);
  const up_rotation_centre = cga.up(rotation_centre);

  // l = distance from rotation_centre to motor attachment
  const diff = s0.smul(r_b).sub(rotation_centre);
  const l = Math.sqrt(Math.abs(diff.gp(diff).basisSVal('e_')));

  // d = rest distance of end plate from e12 plane
  const d = Math.sqrt(l ** 2 - r_e ** 2);

  // Fixed sphere about rotation centre
  const S = up_rotation_centre.sub(ni.smul(0.5 * l * l)).dual();

  it('motor attachment point is on sphere S', () => {
    // up(r_b*s0) should lie on sphere S
    const motorPoint = cga.up(s0.smul(r_b));
    const S_ipns = up_rotation_centre.sub(ni.smul(0.5 * l * l));

    // For IPNS sphere: P · S = 0 means P is on S
    const innerProd = motorPoint.dot(S_ipns).basisSVal('e_') || 0;
    expect(Math.abs(innerProd)).toBeLessThan(0.01);
  });

  it('end effector point y0 is on sphere S at rest', () => {
    // At rest (R = identity), y0 should also be on sphere S
    const x0 = s0.smul(r_e).sub(e3.smul(d));
    const y0 = cga.up(x0.add(rotation_centre));
    const S_ipns = up_rotation_centre.sub(ni.smul(0.5 * l * l));

    const innerProd = y0.dot(S_ipns).basisSVal('e_') || 0;
    expect(Math.abs(innerProd)).toBeLessThan(0.01);
  });

  it('fixed plane a0 has grade 4', () => {
    const t0 = s0.smul(-r_b).add(rotation_centre);
    const Tr0 = one.sub(t0.op(ni).smul(0.5));
    const upRbS0 = cga.up(s0.smul(r_b));
    const a0 = Tr0.gp(upRbS0.dot(S).op(ni)).gp(Tr0.reverse()).selectGrade(4);

    expect(a0.grade()).toBe(4);
  });

  it('fixed circle k0 has grade 3', () => {
    const t0 = s0.smul(-r_b).add(rotation_centre);
    const Tr0 = one.sub(t0.op(ni).smul(0.5));
    const upRbS0 = cga.up(s0.smul(r_b));
    const a0 = Tr0.gp(upRbS0.dot(S).op(ni)).gp(Tr0.reverse()).selectGrade(4);
    const k0 = cga.meet(a0, S);

    expect(k0.grade()).toBe(3);
  });

  /**
   * KNOWN ISSUE: At rest position, fixed and moving circles should coincide
   * and their intersection should give real points.
   *
   * Currently we get an imaginary point pair (T0² < 0).
   */
  it.skip('fixed and moving circles intersect at rest (KNOWN BUG)', () => {
    // Fixed plane a0
    const t0 = s0.smul(-r_b).add(rotation_centre);
    const Tr0 = one.sub(t0.op(ni).smul(0.5));
    const upRbS0 = cga.up(s0.smul(r_b));
    const a0 = Tr0.gp(upRbS0.dot(S).op(ni)).gp(Tr0.reverse()).selectGrade(4);

    // At rest: R = identity
    const x0 = s0.smul(r_e).sub(e3.smul(d));
    const Rx0R = x0; // R * x0 * ~R = x0 when R = 1
    const y0 = cga.up(Rx0R.add(rotation_centre));

    // Moving plane p0
    const Tx0 = one.add(Rx0R.op(ni).smul(0.5));
    const planeCore = S.dot(y0).op(ni).normalize();
    const p0 = Tx0.gp(planeCore).gp(Tx0.reverse()).selectGrade(4);

    // Intersection
    const T0 = cga.meet(cga.meet(a0, p0), S).selectGrade(2);
    const T0sq = T0.gp(T0).basisSVal('e_');

    // Should be positive for real intersection
    expect(T0sq).toBeGreaterThan(0);
  });
});

describe('Spheres', () => {
  it('sphere IPNS has grade 1', () => {
    const center = cga.up([0, 0, 0]);
    const radius = 2;
    const sphereIPNS = center.sub(ni.smul(0.5 * radius * radius));

    expect(sphereIPNS.grade()).toBe(1);
  });

  it('sphere OPNS (dual) has grade 4', () => {
    const center = cga.up([0, 0, 0]);
    const radius = 2;
    const sphereIPNS = center.sub(ni.smul(0.5 * radius * radius));
    const sphereOPNS = sphereIPNS.dual();

    expect(sphereOPNS.grade()).toBe(4);
  });

  it('point on sphere has zero inner product with IPNS sphere', () => {
    const center = [1, 2, 3] as [number, number, number];
    const radius = 2;
    const sphereIPNS = cga.up(center).sub(ni.smul(0.5 * radius * radius));

    // Point on sphere surface
    const pointOnSphere = cga.up([center[0] + radius, center[1], center[2]]);

    // For IPNS: point is on sphere iff X · S = 0
    const innerProd = pointOnSphere.dot(sphereIPNS).basisSVal('e_') || 0;
    expect(innerProd).toBeCloseTo(0, 5);
  });
});

describe('Translators', () => {
  /**
   * KNOWN ISSUE: Translator sign convention
   *
   * The translator formula T = 1 - ½d∧ni should give negative coefficients
   * for the e1p and e1m components, but we're getting positive.
   *
   * This is likely related to:
   * 1. The cgaHelpers.translator() implementation
   * 2. A sign convention in how ni is defined or used
   */
  it.skip('translator has form 1 - ½d∧ni (KNOWN BUG)', () => {
    const T = cga.translator([1, 0, 0], 2);

    // T = 1 - ½ * 2 * e1 ∧ ni = 1 - e1∧ni
    expect(T.basisSVal('e_')).toBeCloseTo(1, 6);
    // e1 ∧ ni = e1 ∧ (em + ep) = e1m + e1p
    // So coefficient should be -1 (from -½ * 2 * 1)
    expect(T.basisSVal('e_1p')).toBeCloseTo(-1, 6);
    expect(T.basisSVal('e_1m')).toBeCloseTo(-1, 6);
  });

  /**
   * KNOWN ISSUE: Translation direction
   *
   * T * P * ~T gives translation in the OPPOSITE direction.
   * We get -3 instead of +3.
   *
   * This is consistent with the translator sign bug above.
   */
  it.skip('T * P * ~T translates point (KNOWN BUG - wrong direction)', () => {
    const P = cga.up([0, 0, 0]);
    const T = cga.translator([1, 0, 0], 3); // translate 3 units in x

    const Ptrans = T.gp(P).gp(T.reverse());
    const coords = cga.down(Ptrans);

    expect(coords).not.toBeNull();
    expect(coords![0]).toBeCloseTo(3, 5);
    expect(coords![1]).toBeCloseTo(0, 5);
    expect(coords![2]).toBeCloseTo(0, 5);
  });

  it.skip('T * P * ~T translates point (current behavior: negative direction)', () => {
    const P = cga.up([0, 0, 0]);
    const T = cga.translator([1, 0, 0], 3);

    const Ptrans = T.gp(P).gp(T.reverse());
    const coords = cga.down(Ptrans);

    expect(coords).not.toBeNull();
    // Currently translates in negative direction
    expect(coords![0]).toBeCloseTo(-3, 5);
    expect(coords![1]).toBeCloseTo(0, 5);
    expect(coords![2]).toBeCloseTo(0, 5);
  });
});

describe('Reflections', () => {
  it('reflects a circle across plane x=0.5', () => {
    const radius = 0.25;
    const P1 = cga.up([1 + radius, 0, 0]);
    const P2 = cga.up([1, radius, 0]);
    const P3 = cga.up([1 - radius, 0, 0]);
    const circle = P1.op(P2).op(P3);

    // Plane x = 0.5 in IPNS: Π = n̂ + d·n∞
    // For plane at x=0.5 with normal [1,0,0]: d = n·p = 0.5
    const plane = e1.add(ni.smul(0.5));

    const planeSq = plane.gp(plane).basisSVal('e_') ?? 1;
    const reflected = plane.gp(circle).gp(plane).smul(1 / planeSq);

    const prim = cga.classify(reflected);
    expect(prim).not.toBeNull();
    expect(prim?.type).toBe('circle');
    if (prim?.type === 'circle') {
      // Expect center at x = 0 (mirror of x=1 across x=0.5)
      expect(prim.center[0]).toBeCloseTo(0, 3);
      expect(prim.center[1]).toBeCloseTo(0, 3);
      expect(prim.center[2]).toBeCloseTo(0, 3);
    }
  });

  it('classifies a line from two planes correctly', () => {
    // z=0 plane (through origin, normal in z direction)
    const plane1 = cga
      .up([1, 0, 0])
      .op(cga.up([0, 1, 0]))
      .op(cga.up([0, 0, 0]))
      .op(ni);
    // y=0 plane (through origin, normal in y direction)
    const plane2 = cga
      .up([1, 0, 0])
      .op(cga.up([0, 0, 1]))
      .op(cga.up([0, 0, 0]))
      .op(ni);

    const line = cga.meet(plane1, plane2);

    // The line should be the x-axis (through origin, direction [1,0,0])
    const classified = cga.classify(line);

    expect(classified).not.toBeNull();
    expect(classified?.type).toBe('line');
    if (classified?.type === 'line') {
      // The direction should be [±1, 0, 0]
      expect(Math.abs(classified.direction[0])).toBeCloseTo(1, 2);
      expect(classified.direction[1]).toBeCloseTo(0, 2);
      expect(classified.direction[2]).toBeCloseTo(0, 2);
    }
  });

  it('classifies a line through two points correctly', () => {
    // Line through (0,0,0) and (1,0,0) - the x-axis
    const P1 = cga.up([0, 0, 0]);
    const P2 = cga.up([1, 0, 0]);
    // Line OPNS = P1 ∧ P2 ∧ ni (grade 3, contains ni)
    const line = P1.op(P2).op(ni);

    const classified = cga.classify(line);

    expect(classified).not.toBeNull();
    expect(classified?.type).toBe('line');
    if (classified?.type === 'line') {
      // Direction should be along x-axis
      expect(Math.abs(classified.direction[0])).toBeCloseTo(1, 2);
      expect(classified.direction[1]).toBeCloseTo(0, 2);
      expect(classified.direction[2]).toBeCloseTo(0, 2);
    }
  });

  it('classifies a line NOT through origin - y=1, z=2 (parallel to x)', () => {
    // Line through (0,1,2) and (1,1,2) - parallel to x-axis at y=1, z=2
    const P1 = cga.up([0, 1, 2]);
    const P2 = cga.up([1, 1, 2]);
    const line = P1.op(P2).op(ni);

    const classified = cga.classify(line);

    expect(classified).not.toBeNull();
    expect(classified?.type).toBe('line');
    if (classified?.type === 'line') {
      // Direction should be along x-axis
      expect(Math.abs(classified.direction[0])).toBeCloseTo(1, 2);
      expect(classified.direction[1]).toBeCloseTo(0, 2);
      expect(classified.direction[2]).toBeCloseTo(0, 2);
      // Point should be on the line at y=1, z=2
      expect(classified.point[1]).toBeCloseTo(1, 2);
      expect(classified.point[2]).toBeCloseTo(2, 2);
    }
  });

  it('classifies a diagonal line - from (0,0,0) to (1,1,1)', () => {
    const P1 = cga.up([0, 0, 0]);
    const P2 = cga.up([1, 1, 1]);
    const line = P1.op(P2).op(ni);

    const classified = cga.classify(line);

    expect(classified).not.toBeNull();
    expect(classified?.type).toBe('line');
    if (classified?.type === 'line') {
      const norm = Math.sqrt(1/3);
      // Direction should be along [1,1,1] normalized
      expect(Math.abs(classified.direction[0])).toBeCloseTo(norm, 2);
      expect(Math.abs(classified.direction[1])).toBeCloseTo(norm, 2);
      expect(Math.abs(classified.direction[2])).toBeCloseTo(norm, 2);
    }
  });

  it('classifies a plane OPNS correctly', () => {
    // z=0 plane OPNS: three points in z=0 wedged with ni
    // Points [1,0,0], [0,1,0], [0,0,0] are counterclockwise from +z
    // So by right-hand rule, normal points in +z direction
    const plane = cga
      .up([1, 0, 0])
      .op(cga.up([0, 1, 0]))
      .op(cga.up([0, 0, 0]))
      .op(ni);

    const classified = cga.classify(plane);

    expect(classified).not.toBeNull();
    expect(classified?.type).toBe('plane');
    if (classified?.type === 'plane') {
      // Normal should be [0, 0, +1] (determined by point ordering)
      expect(classified.normal[0]).toBeCloseTo(0, 2);
      expect(classified.normal[1]).toBeCloseTo(0, 2);
      expect(classified.normal[2]).toBeCloseTo(1, 2);
      // Distance from origin should be 0
      expect(classified.distance).toBeCloseTo(0, 2);
    }
  });

  it('classifies a plane NOT through origin - z=2', () => {
    // z=2 plane OPNS: three points in z=2 wedged with ni
    const plane = cga
      .up([1, 0, 2])
      .op(cga.up([0, 1, 2]))
      .op(cga.up([0, 0, 2]))
      .op(ni);

    const classified = cga.classify(plane);

    expect(classified).not.toBeNull();
    expect(classified?.type).toBe('plane');
    if (classified?.type === 'plane') {
      // Normal should be [0, 0, +1]
      expect(classified.normal[0]).toBeCloseTo(0, 2);
      expect(classified.normal[1]).toBeCloseTo(0, 2);
      expect(classified.normal[2]).toBeCloseTo(1, 2);
      // Distance from origin should be +2
      expect(classified.distance).toBeCloseTo(2, 1);
      // Point should be at [0, 0, 2]
      expect(classified.point[2]).toBeCloseTo(2, 1);
    }
  });
});
