import { e01, e02, e03 } from '../../algebra/pga';
import type { Multivector as MV } from '../../algebra/types.js';
import { dist, origin, sphereInertiaInv } from '../../physics/pgaDynamics';

/**
 * Pairwise impulse collision utilities in PGA form.
 *
 * Paper context: "May The Forque Be With You" (Dorst & De Keninck)
 * https://bivector.net/PGAdyn.html
 *
 * Concepts used:
 * - Contact geometry from PGA points/joins (§2.6)
 * - Relative normal velocity and restitution impulse law (§2.6)
 * - Inertia response via I^-1 along contact direction (§2.2, §2.6)
 *
 * Scope note:
 * - This module resolves translational normal impulses for sphere contacts.
 * - Frictional/tangential impulses are intentionally out of scope here.
 */

export type ImpulseConfig = {
  restitution: number;
  ballRadius: number;
  contactSlop: number;
  ballMass: number;
};

export type MotorRatePair = [MV, MV];

// Extract and normalize the Euclidean direction of a line bivector.
// In this codebase convention: e23->x, -e13->y, e12->z.
function normalizedDirectionFromLine(L: MV): MV | null {
  const nx = L.basisSVal('e_23');
  const ny = -L.basisSVal('e_13');
  const nz = L.basisSVal('e_12');
  const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (mag < 1e-8) return null;
  return e01
    .smul(nx / mag)
    .add(e02.smul(ny / mag))
    .add(e03.smul(nz / mag));
}

// Projection helper for translational part of a rate bivector onto a unit direction.
function projectRateOnDirection(B: MV, N: MV): number {
  return (
    B.basisSVal('e_01') * N.basisSVal('e_01') +
    B.basisSVal('e_02') * N.basisSVal('e_02') +
    B.basisSVal('e_03') * N.basisSVal('e_03')
  );
}

/**
 * Resolve pairwise normal impulses for all overlapping sphere pairs.
 *
 * For each overlapping pair (i, j):
 * 1) Build contact normal direction from point join line.
 * 2) Compute relative normal speed.
 * 3) Compute scalar impulse with restitution.
 * 4) Apply opposite velocity updates.
 *
 * This follows the classical impulse pattern, expressed through PGA rate objects.
 */
export function resolveImpulseContactsPga(snapshot: MotorRatePair[], config: ImpulseConfig): MotorRatePair[] {
  const { restitution, ballRadius, contactSlop, ballMass } = config;
  const worldRates = snapshot.map(([M, B]) => M.sandwich(B).selectGrade(2));

  for (let i = 0; i < snapshot.length; i++) {
    for (let j = i + 1; j < snapshot.length; j++) {
      const Pi = snapshot[i][0].sandwich(origin);
      const Pj = snapshot[j][0].sandwich(origin);
      const d = dist(Pi, Pj);
      if (d > 2 * ballRadius + contactSlop || d < 1e-6) continue;

      const Lij = Pj.join(Pi).selectGrade(2);
      const N = normalizedDirectionFromLine(Lij);
      if (!N) continue;

      const vRelN = projectRateOnDirection(worldRates[i].sub(worldRates[j]), N);
      if (vRelN <= 0) continue;

      const invIN = sphereInertiaInv(N.dual(), ballMass, ballRadius);
      const denom = 2 * projectRateOnDirection(invIN, N);
      if (denom <= 1e-8) continue;

      const jImp = ((1 + restitution) * vRelN) / denom;
      const dvx = jImp * N.basisSVal('e_01');
      const dvy = jImp * N.basisSVal('e_02');
      const dvz = jImp * N.basisSVal('e_03');

      const dVi = e01
        .smul(-dvx / ballMass)
        .add(e02.smul(-dvy / ballMass))
        .add(e03.smul(-dvz / ballMass));
      const dVj = e01
        .smul(dvx / ballMass)
        .add(e02.smul(dvy / ballMass))
        .add(e03.smul(dvz / ballMass));

      worldRates[i] = worldRates[i].add(dVi).selectGrade(2);
      worldRates[j] = worldRates[j].add(dVj).selectGrade(2);
    }
  }

  return snapshot.map(
    ([M], i) => [M, M.reverse().sandwich(worldRates[i]).selectGrade(2)] as MotorRatePair
  );
}