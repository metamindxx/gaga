/**
 * PGA Tests - Projective Geometric Algebra R(3,0,1)
 * 
 * Expected values from ganja.js Algebra(3, 0, 1)
 * 
 * Helpful MV logging function for ganja.js:
 
  var log = (mv, label)=>{
    var epsilon = 0.000000001, info = this.describe(), text = "";
    for (var i = 0; i < info.basis.length; i++) {
      if (mv[i] > epsilon) text += " + " + mv[i] + info.basis[i];
      else if (mv[i] < -epsilon) text += " - " + (-mv[i]) + info.basis[i];
    }
    if (label) console.log(`${label}: ${text}`);
    else console.log(text);
  }

 */

import { describe, it, expect } from 'vitest';
import { pga, e0, e1, e2, e3, e01, e02, e03, e12, e13, e23, e123, e0123, multiVector } from './pga';

// ============================================================================
// Metric Tests
// ============================================================================
describe('PGA Metric', () => {
  // 1e0 * 1e0
  it('e0² = 0 (degenerate)', () => {
    expect(e0.gp(e0).basisSVal('e_')).toBeCloseTo(0);
  });

  // 1e1 * 1e1
  it('e1² = 1', () => {
    expect(e1.gp(e1).basisSVal('e_')).toBeCloseTo(1);
  });

  // 1e2 * 1e2
  it('e2² = 1', () => {
    expect(e2.gp(e2).basisSVal('e_')).toBeCloseTo(1);
  });

  // 1e3 * 1e3
  it('e3² = 1', () => {
    expect(e3.gp(e3).basisSVal('e_')).toBeCloseTo(1);
  });
});

// ============================================================================
// Geometric Product Tests
// ============================================================================
describe('PGA Geometric Product', () => {
  // 1e1 * 1e2
  it('e1 * e2 = e12', () => {
    const result = e1.gp(e2);
    expect(result.basisSVal('e_12')).toBeCloseTo(1);
  });

  // 1e2 * 1e1
  it('e2 * e1 = -e12 (anticommutative)', () => {
    const result = e2.gp(e1);
    expect(result.basisSVal('e_12')).toBeCloseTo(-1);
  });

  // 1e0 * 1e1
  it('e0 * e1 = e01', () => {
    const result = e0.gp(e1);
    expect(result.basisSVal('e_01')).toBeCloseTo(1);
  });

  // 1e1 * 1e0
  it('e1 * e0 = -e01 (anticommutative)', () => {
    const result = e1.gp(e0);
    expect(result.basisSVal('e_01')).toBeCloseTo(-1);
  });

  // 1e12 * 1e23
  it('e12 * e23 = e13', () => {
    const result = e12.gp(e23);
    expect(result.basisSVal('e_13')).toBeCloseTo(1);
  });
});

// ============================================================================
// Outer Product Tests
// ============================================================================
describe('PGA Outer Product', () => {
  // 1e1 ^ 1e2
  it('e1 ^ e2 = e12', () => {
    const result = e1.op(e2);
    expect(result.basisSVal('e_12')).toBeCloseTo(1);
  });

  // 1e1 ^ 1e2 ^ 1e3
  it('e1 ^ e2 ^ e3 = e123', () => {
    const result = e1.op(e2).op(e3);
    expect(result.basisSVal('e_123')).toBeCloseTo(1);
  });

  // 1e0 ^ 1e1 ^ 1e2 ^ 1e3
  it('e0 ^ e1 ^ e2 ^ e3 = e0123 (pseudoscalar)', () => {
    const result = e0.op(e1).op(e2).op(e3);
    expect(result.basisSVal('e_0123')).toBeCloseTo(1);
  });
});

// ============================================================================
// Dual Tests
// ============================================================================
describe('PGA Dual', () => {
  // !1e0
  it('!e0 = e123', () => {
    const result = e0.dual();
    expect(result.basisSVal('e_123')).toBeCloseTo(1);
  });

  // !1e1
  it('!e1 = -e023', () => {
    const result = e1.dual();
    expect(result.basisSVal('e_023')).toBeCloseTo(-1);
  });

  // !1e2
  it('!e2 = e013', () => {
    const result = e2.dual();
    expect(result.basisSVal('e_013')).toBeCloseTo(1);
  });

  // !1e3
  it('!e3 = -e012', () => {
    const result = e3.dual();
    expect(result.basisSVal('e_012')).toBeCloseTo(-1);
  });

  // !1e01
  it('!e01 = e23', () => {
    const result = e01.dual();
    expect(result.basisSVal('e_23')).toBeCloseTo(1);
  });

  // !1e02
  it('!e02 = -e13', () => {
    const result = e02.dual();
    expect(result.basisSVal('e_13')).toBeCloseTo(-1);
  });

  // !1e03
  it('!e03 = e12', () => {
    const result = e03.dual();
    expect(result.basisSVal('e_12')).toBeCloseTo(1);
  });

  // !1e12
  it('!e12 = e03', () => {
    const result = e12.dual();
    expect(result.basisSVal('e_03')).toBeCloseTo(1);
  });

  // !1e13
  it('!e13 = -e02', () => {
    const result = e13.dual();
    expect(result.basisSVal('e_02')).toBeCloseTo(-1);
  });

  // !1e23
  it('!e23 = e01', () => {
    const result = e23.dual();
    expect(result.basisSVal('e_01')).toBeCloseTo(1);
  });

  // !1e123
  it('!e123 = -e0', () => {
    const result = e123.dual();
    expect(result.basisSVal('e_0')).toBeCloseTo(-1);
  });
});

// ============================================================================
// UnDual Tests
// ============================================================================
describe('PGA UnDual', () => {
  // 1e0.UnDual
  it('UnDual(e0) = -e123', () => {
    const result = e0.unDual();
    expect(result.basisSVal('e_123')).toBeCloseTo(-1);
  });

  // 1e1.UnDual
  it('UnDual(e1) = e023', () => {
    const result = e1.unDual();
    expect(result.basisSVal('e_023')).toBeCloseTo(1);
  });

  // 1e2.UnDual
  it('UnDual(e2) = -e013', () => {
    const result = e2.unDual();
    expect(result.basisSVal('e_013')).toBeCloseTo(-1);
  });

  // 1e3.UnDual
  it('UnDual(e3) = e012', () => {
    const result = e3.unDual();
    expect(result.basisSVal('e_012')).toBeCloseTo(1);
  });

  // 1e01.UnDual
  it('UnDual(e01) = e23', () => {
    const result = e01.unDual();
    expect(result.basisSVal('e_23')).toBeCloseTo(1);
  });

  // 1e02.UnDual
  it('UnDual(e02) = -e13', () => {
    const result = e02.unDual();
    expect(result.basisSVal('e_13')).toBeCloseTo(-1);
  });

  // 1e03.UnDual
  it('UnDual(e03) = e12', () => {
    const result = e03.unDual();
    expect(result.basisSVal('e_12')).toBeCloseTo(1);
  });

  // 1e12.UnDual
  it('UnDual(e12) = e03', () => {
    const result = e12.unDual();
    expect(result.basisSVal('e_03')).toBeCloseTo(1);
  });

  // 1e13.UnDual
  it('UnDual(e13) = -e02', () => {
    const result = e13.unDual();
    expect(result.basisSVal('e_02')).toBeCloseTo(-1);
  });

  // 1e23.UnDual
  it('UnDual(e23) = e01', () => {
    const result = e23.unDual();
    expect(result.basisSVal('e_01')).toBeCloseTo(1);
  });

  // 1e123.UnDual
  it('UnDual(e123) = e0', () => {
    const result = e123.unDual();
    expect(result.basisSVal('e_0')).toBeCloseTo(1);
  });

  // !(1e0.UnDual)
  it('Dual(UnDual(e0)) = e0', () => {
    const result = e0.unDual().dual();
    expect(result.basisSVal('e_0')).toBeCloseTo(1);
  });

  // !(1e1.UnDual)
  it('Dual(UnDual(e1)) = e1', () => {
    const result = e1.unDual().dual();
    expect(result.basisSVal('e_1')).toBeCloseTo(1);
  });

  // !(1e2.UnDual)
  it('Dual(UnDual(e2)) = e2', () => {
    const result = e2.unDual().dual();
    expect(result.basisSVal('e_2')).toBeCloseTo(1);
  });

  // !(1e3.UnDual)
  it('Dual(UnDual(e3)) = e3', () => {
    const result = e3.unDual().dual();
    expect(result.basisSVal('e_3')).toBeCloseTo(1);
  });

  // !(1e01.UnDual)
  it('Dual(UnDual(e01)) = e01', () => {
    const result = e01.unDual().dual();
    expect(result.basisSVal('e_01')).toBeCloseTo(1);
  });

  // !(1e12.UnDual)
  it('Dual(UnDual(e12)) = e12', () => {
    const result = e12.unDual().dual();
    expect(result.basisSVal('e_12')).toBeCloseTo(1);
  });

  // !(1e23.UnDual)
  it('Dual(UnDual(e23)) = e23', () => {
    const result = e23.unDual().dual();
    expect(result.basisSVal('e_23')).toBeCloseTo(1);
  });

  // !(1e123.UnDual)
  it('Dual(UnDual(e123)) = e123', () => {
    const result = e123.unDual().dual();
    expect(result.basisSVal('e_123')).toBeCloseTo(1);
  });
});

// ============================================================================
// Regressive Product (Join) Tests
// ============================================================================
describe('PGA Regressive Product (Join)', () => {
  // !(1e0 + 1e1) & !(1e0 + 1e2)
  it('joins two points to create a line', () => {
    // p1 = !(e0 + e1) - point at (1,0,0)
    const p1 = multiVector({ e_0: 1, e_1: 1 }).dual();
    expect(p1.basisSVal('e_023')).toBeCloseTo(-1);
    expect(p1.basisSVal('e_123')).toBeCloseTo(1);

    // p2 = !(e0 + e2) - point at (0,1,0)
    const p2 = multiVector({ e_0: 1, e_2: 1 }).dual();
    expect(p2.basisSVal('e_013')).toBeCloseTo(1);
    expect(p2.basisSVal('e_123')).toBeCloseTo(1);

    // Line through two points: p1 & p2
    const line = p1.join(p2);
    expect(line.basisSVal('e_03')).toBeCloseTo(-1);
    expect(line.basisSVal('e_13')).toBeCloseTo(1);
    expect(line.basisSVal('e_23')).toBeCloseTo(1);
  });
});

// ============================================================================
// Dot Product (Inner/Contraction) Tests
// ============================================================================
describe('PGA Dot Product', () => {
  // 1e1 | 1e12
  it('e1 | e12 = e2', () => {
    const result = e1.dot(e12);
    expect(result.basisSVal('e_2')).toBeCloseTo(1);
  });

  // 1e12 | 1e1
  it('e12 | e1 = -e2', () => {
    const result = e12.dot(e1);
    expect(result.basisSVal('e_2')).toBeCloseTo(-1);
  });
});

// ============================================================================
// Reverse Tests
// ============================================================================
describe('PGA Reverse', () => {
  // ~1e1
  it('~e1 = e1 (grade 1 unchanged by reverse)', () => {
    const result = e1.reverse();
    expect(result.basisSVal('e_1')).toBeCloseTo(1);
  });

  // ~1e12
  it('~e12 = -e12 (grade 2 negated)', () => {
    const result = e12.reverse();
    expect(result.basisSVal('e_12')).toBeCloseTo(-1);
  });

  // ~1e123
  it('~e123 = -e123 (grade 3 negated)', () => {
    const result = e123.reverse();
    expect(result.basisSVal('e_123')).toBeCloseTo(-1);
  });

  // ~1e0123
  it('~e0123 = e0123 (grade 4 unchanged)', () => {
    const result = e0123.reverse();
    expect(result.basisSVal('e_0123')).toBeCloseTo(1);
  });

  // ~(0.5 + 0.5*1e12 + 0.1*1e01)
  it('reverses a motor correctly', () => {
    // motor = 0.5 + 0.5*e12 + 0.1*e01
    const motor = multiVector({ e_: 0.5, e_12: 0.5, e_01: 0.1 });
    const rev = motor.reverse();
    expect(rev.basisSVal('e_')).toBeCloseTo(0.5); // scalar unchanged
    expect(rev.basisSVal('e_01')).toBeCloseTo(-0.1); // bivector negated
    expect(rev.basisSVal('e_12')).toBeCloseTo(-0.5); // bivector negated
  });
});

// ============================================================================
// Norm Tests
// ============================================================================
describe('PGA Norm', () => {
  // (1e1).Length
  it('|e1| = 1', () => {
    expect(e1.norm()).toBeCloseTo(1);
  });

  // (1e12).Length
  it('|e12| = 1', () => {
    expect(e12.norm()).toBeCloseTo(1);
  });

  // (3*1e1 + 4*1e2).Length
  it('|3e1 + 4e2| = 5', () => {
    const vec = multiVector({ e_1: 3, e_2: 4 });
    expect(vec.norm()).toBeCloseTo(5);
  });
});

// ============================================================================
// Normalize Tests
// ============================================================================
describe('PGA Normalize', () => {
  // (3*1e1 + 4*1e2).Normalized
  it('(3e1 + 4e2).normalize() = 0.6e1 + 0.8e2', () => {
    const vec = multiVector({ e_1: 3, e_2: 4 });
    const normalized = vec.normalize();
    expect(normalized.basisSVal('e_1')).toBeCloseTo(0.6);
    expect(normalized.basisSVal('e_2')).toBeCloseTo(0.8);
  });
});

// ============================================================================
// Inverse Tests
// ============================================================================
describe('PGA Inverse', () => {
  // 1e1 * (1e1).Inverse
  it('e1 * e1.inverse() = 1', () => {
    const inv = e1.inverse();
    const result = e1.gp(inv);
    expect(result.basisSVal('e_')).toBeCloseTo(1);
  });

  // 1e12 * (1e12).Inverse
  it('e12 * e12.inverse() = 1', () => {
    const inv = e12.inverse();
    const result = e12.gp(inv);
    expect(result.basisSVal('e_')).toBeCloseTo(1);
  });

  // (1e12).Inverse
  it('e12.inverse() = -e12', () => {
    const inv = e12.inverse();
    expect(inv.basisSVal('e_12')).toBeCloseTo(-1);
  });
});

// ============================================================================
// Exponential Tests
// ============================================================================
describe('PGA Exponential', () => {
  // Math.E ** (0.5 * 1e12)
  it('exp(0.5 * e12) produces correct rotor', () => {
    // From ganja: { e_: 0.8775825500488281, e_12: 0.4794255495071411 }
    const rotor = e12.exp(0.5);
    expect(rotor.basisSVal('e_')).toBeCloseTo(0.8775825, 5);
    expect(rotor.basisSVal('e_12')).toBeCloseTo(0.4794255, 5);
  });

  // Math.E ** (Math.PI/4 * 1e12)
  it('exp(pi/4 * e12) = 45° rotor (cos + sin*e12)', () => {
    // From ganja: { e_: 0.7071067690849304, e_12: 0.7071068286895752 }
    const rotor = e12.exp(Math.PI / 4);
    expect(rotor.basisSVal('e_')).toBeCloseTo(Math.SQRT1_2, 5);
    expect(rotor.basisSVal('e_12')).toBeCloseTo(Math.SQRT1_2, 5);
  });

  // Math.E ** (0.5 * 1e01)
  it('exp(0.5 * e01) = translator (1 + 0.5*e01)', () => {
    // From ganja: { e_: 1, e_01: 0.5 }
    const translator = e01.exp(0.5);
    expect(translator.basisSVal('e_')).toBeCloseTo(1);
    expect(translator.basisSVal('e_01')).toBeCloseTo(0.5);
  });
});

// ============================================================================
// Sandwich Product Tests
// ============================================================================
describe('PGA Sandwich Product', () => {
  // (Math.E ** (Math.PI/4 * 1e12)) >>> !(1e0 + 1e1)
  it('rotates point (1,0,0) by 90° around z to get (0,1,0)', () => {
    // Point at (1,0,0): !(e0 + e1)
    const pt = multiVector({ e_0: 1, e_1: 1 }).dual();
    expect(pt.basisSVal('e_023')).toBeCloseTo(-1);
    expect(pt.basisSVal('e_123')).toBeCloseTo(1);

    // 90° rotor around z: exp(pi/4 * e12)
    const rot90 = e12.exp(Math.PI / 4);

    // Apply rotation: rot90 >>> pt
    const rotated = rot90.sandwich(pt);

    // From ganja: { e_013: -1, e_023: ~0, e_123: 1 }
    // Point at (0,1,0) has e_013 = -1, e_123 = 1
    expect(rotated.basisSVal('e_013')).toBeCloseTo(-1, 5);
    expect(rotated.basisSVal('e_023')).toBeCloseTo(0, 5);
    expect(rotated.basisSVal('e_123')).toBeCloseTo(1, 5);
  });
});

// ============================================================================
// Addition/Subtraction Tests
// ============================================================================
describe('PGA Addition/Subtraction', () => {
  // 1e1 + 1e2
  it('e1 + e2 has both components', () => {
    const sum = e1.add(e2);
    expect(sum.basisSVal('e_1')).toBeCloseTo(1);
    expect(sum.basisSVal('e_2')).toBeCloseTo(1);
  });

  // 1e1 - 1e2
  it('e1 - e2 has correct signs', () => {
    const diff = e1.sub(e2);
    expect(diff.basisSVal('e_1')).toBeCloseTo(1);
    expect(diff.basisSVal('e_2')).toBeCloseTo(-1);
  });

  // 3 * 1e1
  it('3 * e1 scales correctly', () => {
    const scaled = e1.smul(3);
    expect(scaled.basisSVal('e_1')).toBeCloseTo(3);
  });
});

// ============================================================================
// Select Grade Tests
// ============================================================================
describe('PGA Select Grade', () => {
  // (1 + 2*1e1 + 3*1e12 + 4*1e123).Grade(0)
  it('extracts grade 0 (scalar) from mixed MV', () => {
    // mixed = 1 + 2*e1 + 3*e12 + 4*e123
    const mixed = multiVector({ e_: 1, e_1: 2, e_12: 3, e_123: 4 });
    const grade0 = mixed.selectGrade(0);
    expect(grade0.basisSVal('e_')).toBeCloseTo(1);
    expect(grade0.basisSVal('e_1')).toBeCloseTo(0);
  });

  // (1 + 2*1e1 + 3*1e12 + 4*1e123).Grade(1)
  it('extracts grade 1 (vector) from mixed MV', () => {
    const mixed = multiVector({ e_: 1, e_1: 2, e_12: 3, e_123: 4 });
    const grade1 = mixed.selectGrade(1);
    expect(grade1.basisSVal('e_1')).toBeCloseTo(2);
    expect(grade1.basisSVal('e_')).toBeCloseTo(0);
  });

  // (1 + 2*1e1 + 3*1e12 + 4*1e123).Grade(2)
  it('extracts grade 2 (bivector) from mixed MV', () => {
    const mixed = multiVector({ e_: 1, e_1: 2, e_12: 3, e_123: 4 });
    const grade2 = mixed.selectGrade(2);
    expect(grade2.basisSVal('e_12')).toBeCloseTo(3);
  });

  // (1 + 2*1e1 + 3*1e12 + 4*1e123).Grade(3)
  it('extracts grade 3 (trivector) from mixed MV', () => {
    const mixed = multiVector({ e_: 1, e_1: 2, e_12: 3, e_123: 4 });
    const grade3 = mixed.selectGrade(3);
    expect(grade3.basisSVal('e_123')).toBeCloseTo(4);
  });
});

// ============================================================================
// Translation Motor Tests
// ============================================================================
describe('PGA Translation Motor', () => {
  // 1 + 0.5*1e01
  it('T = 1 + 0.5*e01 is a valid translator', () => {
    // From ganja: { e_: 1, e_01: 0.5 }
    const T = multiVector({ e_: 1, e_01: 0.5 });
    expect(T.basisSVal('e_')).toBeCloseTo(1);
    expect(T.basisSVal('e_01')).toBeCloseTo(0.5);
  });

  // (1 + 0.5*1e01) >>> !1e0
  it('translating origin produces point at (1,0,0)', () => {
    // Origin = !e0
    const origin = e0.dual();
    expect(origin.basisSVal('e_123')).toBeCloseTo(1);

    // T_x = 1 + 0.5*e01 (translate 1 unit in x)
    const T_x = multiVector({ e_: 1, e_01: 0.5 });

    // T_x >>> origin
    const moved = T_x.sandwich(origin);

    // From ganja: { e_023: 1, e_123: 1 }
    // This is the point at (1, 0, 0) = !(e0 + e1)
    expect(moved.basisSVal('e_023')).toBeCloseTo(1);
    expect(moved.basisSVal('e_123')).toBeCloseTo(1);
  });
});

// ============================================================================
// Line Operations Tests
// ============================================================================
describe('PGA Line Operations', () => {
  // !1e0 & !(1e0 + 1e1)
  it('x-axis line = origin & (1,0,0)', () => {
    const p_origin = e0.dual(); // origin point
    const p_x = multiVector({ e_0: 1, e_1: 1 }).dual(); // point at (1,0,0)

    const x_axis = p_origin.join(p_x);

    // From ganja: { e_23: -1 }
    expect(x_axis.basisSVal('e_23')).toBeCloseTo(-1);
  });

  // (!1e0 & !(1e0 + 1e1)).Length
  it('x-axis line has unit length', () => {
    const p_origin = e0.dual();
    const p_x = multiVector({ e_0: 1, e_1: 1 }).dual();
    const x_axis = p_origin.join(p_x);

    expect(x_axis.norm()).toBeCloseTo(1);
  });
});

// ============================================================================
// PGA Points (from original tests)
// ============================================================================
describe('PGA Points', () => {
  it('creates origin point correctly', () => {
    const origin = pga.point([0, 0, 0]);
    // Origin is just e123
    expect(origin.basisSVal('e_123')).toBeCloseTo(1);
    expect(origin.basisSVal('e_023')).toBeCloseTo(0);
    expect(origin.basisSVal('e_013')).toBeCloseTo(0);
    expect(origin.basisSVal('e_012')).toBeCloseTo(0);
  });

  it('extracts coordinates from point', () => {
    const pt = pga.point([1, 2, 3]);
    const coords = pga.pointCoords(pt);
    expect(coords).not.toBeNull();
    expect(coords![0]).toBeCloseTo(1);
    expect(coords![1]).toBeCloseTo(2);
    expect(coords![2]).toBeCloseTo(3);
  });

  it('round-trips point coordinates', () => {
    const original: [number, number, number] = [3.5, -1.2, 7.8];
    const pt = pga.point(original);
    const coords = pga.pointCoords(pt);
    expect(coords![0]).toBeCloseTo(original[0]);
    expect(coords![1]).toBeCloseTo(original[1]);
    expect(coords![2]).toBeCloseTo(original[2]);
  });
});

// ============================================================================
// PGA Planes (from original tests)
// ============================================================================
describe('PGA Planes', () => {
  it('creates xy-plane (z=0)', () => {
    const xy = pga.plane([0, 0, 1], 0); // normal = z, distance = 0
    expect(xy.basisSVal('e_3')).toBeCloseTo(1);
    expect(xy.basisSVal('e_0')).toBeCloseTo(0);
  });

  it('extracts plane parameters', () => {
    const pl = pga.plane([0, 1, 0], 5); // y = 5
    const params = pga.planeParams(pl);
    expect(params).not.toBeNull();
    expect(params!.normal[1]).toBeCloseTo(1);
    expect(params!.distance).toBeCloseTo(5);
  });
});

// ============================================================================
// PGA Classification (from original tests)
// ============================================================================
describe('PGA Classification', () => {
  it('classifies points', () => {
    const pt = pga.point([1, 2, 3]);
    const prim = pga.classify(pt);
    expect(prim).not.toBeNull();
    expect(prim!.type).toBe('point');
    if (prim!.type === 'point') {
      expect(prim!.coords[0]).toBeCloseTo(1);
      expect(prim!.coords[1]).toBeCloseTo(2);
      expect(prim!.coords[2]).toBeCloseTo(3);
    }
  });

  it('classifies planes', () => {
    const pl = pga.plane([0, 0, 1], 2);
    const prim = pga.classify(pl);
    expect(prim).not.toBeNull();
    expect(prim!.type).toBe('plane');
    if (prim!.type === 'plane') {
      expect(prim!.normal[2]).toBeCloseTo(1);
    }
  });
});

// ============================================================================
// PGA Motors (from original tests)
// ============================================================================
describe('PGA Motors', () => {
  it('creates identity translator', () => {
    const T = pga.translator([1, 0, 0], 0);
    // Should be just scalar 1
    expect(T.basisSVal('e_')).toBeCloseTo(1);
  });

  it('creates rotor around z-axis', () => {
    const R = pga.rotor([0, 0, 1], Math.PI / 2); // 90° around z
    // Should have scalar and e12 components
    expect(R.basisSVal('e_')).toBeCloseTo(Math.cos(Math.PI / 4));
    expect(R.basisSVal('e_12')).toBeCloseTo(Math.sin(Math.PI / 4));
  });
});

// ============================================================================
// Spidor Operations Tests - Operations used in the spider IK animation
// ============================================================================
describe('PGA Spidor Operations', () => {
  // line = !1e0 & !(1e0 + 1e1); Math.E ** (-0.5 * 1e0 * line.Normalized * !1e0)
  it('translate along x-axis creates correct motor', () => {
    // x-axis line from ganja: origin & (1,0,0) = -e23
    const p_origin = e0.dual();
    const p_x = multiVector({ e_0: 1, e_1: 1 }).dual();
    const line = p_origin.join(p_x);
    expect(line.basisSVal('e_23')).toBeCloseTo(-1);

    // Translation bivector: -0.5 * dist * e0 * line.Normalized * !e0
    // From ganja: -0.5 * 1 * e0 * (-e23) * !e0 = -0.5*e01
    const dist = 1;
    const bivector = e0
      .smul(-0.5 * dist)
      .gp(line.normalize())
      .gp(e0.dual());
    expect(bivector.basisSVal('e_01')).toBeCloseTo(-0.5);

    // exp(bivector) = 1 - 0.5*e01
    const translator = bivector.exp(1);
    expect(translator.basisSVal('e_')).toBeCloseTo(1);
    expect(translator.basisSVal('e_01')).toBeCloseTo(-0.5);
  });

  // pt = !(1e0 + 1e1 + 1e2 + 1e3); plane = 1e3; (pt | plane) * plane.Inverse
  it('projects point onto plane', () => {
    // Point at (1,1,1) projected onto z=0 plane should give (1,1,0)
    const pt = multiVector({ e_0: 1, e_1: 1, e_2: 1, e_3: 1 }).dual();

    // z=0 plane is e3
    const plane = e3;

    // pt | plane
    const dotResult = pt.dot(plane);
    expect(dotResult.basisSVal('e_01')).toBeCloseTo(1);
    expect(dotResult.basisSVal('e_02')).toBeCloseTo(-1);
    expect(dotResult.basisSVal('e_12')).toBeCloseTo(1);

    // (pt | plane) * plane^-1
    // plane^2 = 1, so plane^-1 = plane
    const projected = dotResult.gp(plane.inverse());
    // From ganja: e_013 - e_023 + e_123 = point at (1,1,0)
    expect(projected.basisSVal('e_013')).toBeCloseTo(1);
    expect(projected.basisSVal('e_023')).toBeCloseTo(-1);
    expect(projected.basisSVal('e_123')).toBeCloseTo(1);
  });

  // !(1e0 + 0.5*1e1 + 0.5*1e2) * 1e2
  it('point * e2 creates mixed grade object', () => {
    // somePoint = !(e0 + 0.5*e1 + 0.5*e2)
    const somePoint = multiVector({ e_0: 1, e_1: 0.5, e_2: 0.5 }).dual();

    // point * e2 gives a mixed grade object
    const result = somePoint.gp(e2);
    // From ganja: 0.5*e03 - e13 - 0.5*e0123
    expect(result.basisSVal('e_03')).toBeCloseTo(0.5);
    expect(result.basisSVal('e_13')).toBeCloseTo(-1);
    expect(result.basisSVal('e_0123')).toBeCloseTo(-0.5);
  });

  // line = !1e0 & !(1e0 + 2*1e1); line.Length
  it('line inorm gives Euclidean distance', () => {
    // Line from origin to (2,0,0) should have length 2
    const p_origin = e0.dual();
    const p_2x = multiVector({ e_0: 1, e_1: 2 }).dual();
    const line = p_origin.join(p_2x);

    // From ganja: -2*e23, Length = 2
    expect(line.basisSVal('e_23')).toBeCloseTo(-2);
    expect(line.norm()).toBeCloseTo(2);
  });

  // line = !1e0 & !(1e0 + 1e1 + 1e2); Math.E ** (0.1 * line.Normalized)
  it('motor from diagonal line', () => {
    const origin = e0.dual();
    const pt110 = multiVector({ e_0: 1, e_1: 1, e_2: 1 }).dual();
    const motorLine = origin.join(pt110);

    // From ganja: e13 - e23
    expect(motorLine.basisSVal('e_13')).toBeCloseTo(1);
    expect(motorLine.basisSVal('e_23')).toBeCloseTo(-1);

    // Normalized: 0.707*e13 - 0.707*e23
    const normalized = motorLine.normalize();
    expect(normalized.basisSVal('e_13')).toBeCloseTo(Math.SQRT1_2, 5);
    expect(normalized.basisSVal('e_23')).toBeCloseTo(-Math.SQRT1_2, 5);

    // exp(0.1 * normalized) = rotor
    const rotor = normalized.exp(0.1);
    expect(rotor.basisSVal('e_')).toBeCloseTo(0.995, 3);
    expect(rotor.basisSVal('e_13')).toBeCloseTo(0.0706, 3);
    expect(rotor.basisSVal('e_23')).toBeCloseTo(-0.0706, 3);
  });

  // !(1e0 + 1e1) & !(1e0 + 1e1 + 0.001*1e2)
  it('join of close points gives small line', () => {
    const p1 = multiVector({ e_0: 1, e_1: 1 }).dual();
    const p2 = multiVector({ e_0: 1, e_1: 1, e_2: 0.001 }).dual();
    const closeLine = p1.join(p2);

    // From ganja: -0.001*e03 + 0.001*e13, Length ≈ 0.001
    expect(closeLine.basisSVal('e_03')).toBeCloseTo(-0.001, 5);
    expect(closeLine.basisSVal('e_13')).toBeCloseTo(0.001, 5);
    expect(closeLine.norm()).toBeCloseTo(0.001, 5);
  });

  // (Math.E ** (0.5 * 1e12)) >>> !(1e0 + 1e1)
  it('sandwich with exp(0.5*e12) rotor', () => {
    const testPt = multiVector({ e_0: 1, e_1: 1 }).dual();
    const rotor = e12.exp(0.5); // ~57 degree rotation

    const sandwiched = rotor.sandwich(testPt);
    // From ganja: -0.841*e013 - 0.540*e023 + e123
    expect(sandwiched.basisSVal('e_013')).toBeCloseTo(-0.8414710164, 5);
    expect(sandwiched.basisSVal('e_023')).toBeCloseTo(-0.5403022766, 5);
    expect(sandwiched.basisSVal('e_123')).toBeCloseTo(1, 5);
  });

  // (!(1e0 + 1e1) + 0.001*1e12).Grade(3)
  it('selectGrade(3) removes non-point components', () => {
    // Point with some bivector junk
    const mixedPt = multiVector({ e_0: 1, e_1: 1 }).dual().add(e12.smul(0.001));

    // Should have e12 component
    expect(mixedPt.basisSVal('e_12')).toBeCloseTo(0.001);

    // After selectGrade(3), should only have trivector
    const cleanPt = mixedPt.selectGrade(3);
    expect(cleanPt.basisSVal('e_023')).toBeCloseTo(-1);
    expect(cleanPt.basisSVal('e_123')).toBeCloseTo(1);
    expect(cleanPt.basisSVal('e_12')).toBeCloseTo(0);
  });

  // a = !(1e0 + 1e1); b = !(1e0 + 1e2); a*0.7 + b*0.3
  it('lerp interpolates points correctly', () => {
    const a = multiVector({ e_0: 1, e_1: 1 }).dual(); // (1,0,0)
    const b = multiVector({ e_0: 1, e_2: 1 }).dual(); // (0,1,0)

    // lerp(a, b, 0.3) = a*0.7 + b*0.3
    const lerped = a.smul(0.7).add(b.smul(0.3));

    // From ganja: 0.3*e013 - 0.7*e023 + e123
    expect(lerped.basisSVal('e_013')).toBeCloseTo(0.3);
    expect(lerped.basisSVal('e_023')).toBeCloseTo(-0.7);
    expect(lerped.basisSVal('e_123')).toBeCloseTo(1);
  });

  // !(1e0+1e1)*0.25 + !(1e0-1e1)*0.25 + !(1e0+1e2)*0.25 + !(1e0-1e2)*0.25
  it('sums points correctly for body center', () => {
    // 4 points at corners of unit square in xy plane
    const pts = [
      multiVector({ e_0: 1, e_1: 1 }).dual() // (1,0,0)
      , multiVector({ e_0: 1, e_1: -1 }).dual() // (-1,0,0)
      , multiVector({ e_0: 1, e_2: 1 }).dual() // (0,1,0)
      , multiVector({ e_0: 1, e_2: -1 }).dual() // (0,-1,0)
    ];

    // Sum and scale by 1/4
    const center = pts.reduce((sum, pt) => sum.add(pt.smul(0.25)), multiVector({}));

    // Center should be at origin (0,0,0)
    // e123 coefficient should be 1 (normalized point)
    expect(center.basisSVal('e_123')).toBeCloseTo(1);
    expect(center.basisSVal('e_023')).toBeCloseTo(0);
    expect(center.basisSVal('e_013')).toBeCloseTo(0);
    expect(center.basisSVal('e_012')).toBeCloseTo(0);
  });
});

// ============================================================================
// projectOnto Tests
// ============================================================================
describe('PGA projectOnto', () => {
  // In ganja.js, projection is typically written as:
  //   project(a, b) = (a | b) / b
  // (equivalently (a | b) * b.Inverse when b has an inverse)

  // a = 3e1 + 4e2; b = e1; p = (a | b) / b
  it('projects Euclidean vector onto axis', () => {
    const a = multiVector({ e_1: 3, e_2: 4 });
    const p = a.projectOnto(e1);

    expect(p.basisSVal('e_1')).toBeCloseTo(3);
    expect(p.basisSVal('e_2')).toBeCloseTo(0);
    expect(p.basisSVal('e_3')).toBeCloseTo(0);
    expect(p.basisSVal('e_0')).toBeCloseTo(0);
  });

  // a = 3e1 + 4e2; b = 2e1; p = (a | b) / b
  it('is invariant to target scaling (vector)', () => {
    const a = multiVector({ e_1: 3, e_2: 4 });
    const b = e1.smul(2);
    const p = a.projectOnto(b);

    expect(p.basisSVal('e_1')).toBeCloseTo(3);
    expect(p.basisSVal('e_2')).toBeCloseTo(0);
  });

  // a = 3e1 + 4e2; b = 5e1; p = (a | b) / b; r = a - p;
  it('residual is orthogonal to target (vector)', () => {
    const a = multiVector({ e_1: 3, e_2: 4 });
    const b = e1.smul(5);
    const p = a.projectOnto(b);
    const r = a.sub(p);

    // For vectors, orthogonality means (r | b) == 0 (scalar)
    expect(r.dot(b).basisSVal('e_')).toBeCloseTo(0);
  });

  // a = 3e1 + 4e2; b = e1 + e2; p1 = (a | b) / b; p2 = (p1 | b) / b;
  it('is idempotent (project(project(a,b),b) == project(a,b))', () => {
    const a = multiVector({ e_1: 3, e_2: 4 });
    const b = multiVector({ e_1: 1, e_2: 1 });

    const p1 = a.projectOnto(b);
    const p2 = p1.projectOnto(b);

    expect(p2.basisSVal('e_1')).toBeCloseTo(p1.basisSVal('e_1'));
    expect(p2.basisSVal('e_2')).toBeCloseTo(p1.basisSVal('e_2'));
    expect(p2.basisSVal('e_3')).toBeCloseTo(p1.basisSVal('e_3'));
    expect(p2.basisSVal('e_0')).toBeCloseTo(p1.basisSVal('e_0'));
  });

  // a = 1e12 + 2e13; b = e12; p = (a | b) / b
  it('projects bivector onto bivector (extracts matching component)', () => {
    const a = multiVector({ e_12: 2, e_13: 2 });
    const p = a.projectOnto(e12);

    expect(p.basisSVal('e_12')).toBeCloseTo(2);
    expect(p.basisSVal('e_13')).toBeCloseTo(0);
    expect(p.basisSVal('e_23')).toBeCloseTo(0);
  });

  it('projects point onto plane (y = 0)', () => {
    const pt = pga.point([1, 2, 3]);
    const plane = pga.plane([0, 1, 0], 0);

    // Projection can introduce tiny non-grade-3 noise; select grade 3 to clean up
    const projected = pt.projectOnto(plane).selectGrade(3);
    const prim = pga.classify(projected);

    expect(prim).not.toBeNull();
    expect(prim?.type).toBe('point');
    if (prim?.type === 'point') {
      expect(prim.coords[0]).toBeCloseTo(1);
      expect(prim.coords[1]).toBeCloseTo(0);
      expect(prim.coords[2]).toBeCloseTo(3);
    }
  });

  it('projects point onto line (point.gp(e2))', () => {
    // Mirrors how SpidorLeg computes kneeLine
    //   kneeLine = lerp(base, target, t).gp(e2)
    const base = pga.point([0, 0, 0]);
    const target = pga.point([1, 0, 0]);
    const mid = base.smul(0.5).add(target.smul(0.5));
    const kneeLine = mid.gp(e2);

    const pt = pga.point([0.5, 2, 0]);
    const projected = pt.projectOnto(kneeLine).selectGrade(3);
    const prim = pga.classify(projected);

    expect(prim).not.toBeNull();
    expect(prim?.type).toBe('point');

    // The projected point should lie on the line's carrier.
    // For a point P on line L (grade-2), we expect P ^ L == 0.
    const lineBlade = kneeLine.selectGrade(2);
    const join = projected.op(lineBlade);
    expect(join.norm()).toBeCloseTo(0);
  });
});
