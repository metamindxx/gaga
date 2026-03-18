import { describe, expect, it } from 'vitest';
import { pga, e01, e02, e03, e12 } from '../../algebra/pga';
import {
  DEFAULT_SPINLAB_DYNAMICS
  , isFiniteRate
  , stepSpinLabState
  , zeroRate
} from './spinLabDynamics';

function horizontalSpeedSq(B: { basisSVal: (blade: string) => number }): number {
  const vx = B.basisSVal('e_01');
  const vz = B.basisSVal('e_03');
  return vx * vx + vz * vz;
}

describe('SpinLab dynamics (PGAdyn)', () => {
  it('accelerates downward under gravity when above contact', () => {
    const M0 = pga.translator([0, 1.0, 0], 1);
    const B0 = zeroRate;

    const [, B1] = stepSpinLabState(M0, B0, 0.01, DEFAULT_SPINLAB_DYNAMICS);
    const vy1 = B1.basisSVal('e_02');

    expect(vy1).toBeLessThan(0);
  });

  it('contact/friction step stays finite with spin and slip', () => {
    const y = DEFAULT_SPINLAB_DYNAMICS.ballRadius * 0.98;
    const M0 = pga.translator([0, y, 0], 1);
    const B0 = e01.smul(1.2).add(e12.smul(-80)).add(e02.smul(-0.2));

    const [M1, B1] = stepSpinLabState(M0, B0, 0.008, DEFAULT_SPINLAB_DYNAMICS);

    expect(isFiniteRate(B1)).toBe(true);
    expect(Number.isFinite(M1.basisSVal('e_'))).toBe(true);
  });

  it('reduces horizontal speed for a slipping contact state', () => {
    const y = DEFAULT_SPINLAB_DYNAMICS.ballRadius * 0.95;
    let M = pga.translator([0, y, 0], 1);
    let B = e01.smul(0.6);

    const v0 = horizontalSpeedSq(B);
    [M, B] = stepSpinLabState(M, B, 0.008, DEFAULT_SPINLAB_DYNAMICS);
    const vN = horizontalSpeedSq(B);

    expect(vN).toBeLessThan(v0);
  });

  it('ball dropped from height settles near ground without diverging', () => {
    const cfg = DEFAULT_SPINLAB_DYNAMICS;
    const dt = 1 / 30 / 8;
    // Initial state: y=0.05m, vz=3m/s, wz=−105 rad/s (worst-case spin)
    let M = pga.translator([0, 0.05, 0], 1);
    let B = e03.smul(3).add(e12.smul(-105));

    for (let i = 0; i < 240; i++) {
      // 1 second of simulation
      [M, B] = stepSpinLabState(M, B, dt, cfg);
    }

    const P = M.sandwich(pga.point([0, 0, 0]));
    const y = P.basisSVal('e_013');

    // Ball must stay within [0, 0.2]m — explosion previously sent it to −18m
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(0.2);
    expect(isFiniteRate(B)).toBe(true);
  });
});
