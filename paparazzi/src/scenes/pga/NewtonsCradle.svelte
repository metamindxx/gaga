<script lang="ts">
  // Newton's Cradle: PGA Dynamics with string constraints and ball-ball collisions
  // String forces taken directly from PgaDynamics (Hooke's law via GA join)
  // Two collision models: overlap-based spring penalty and impulse-based elastic swap
  import { useTask } from '@threlte/core';
  import { pga, e01, e02, e03 } from '../../algebra/pga';
  import type { Multivector as MV } from '../../algebra/types.js';
  import {
    origin
    , dist
    , gravityForque
    , dampingForque
    , springCollisionForque
    , resolveImpulses
    , stateDeriv
    , eulerStep
  } from '../../physics/pgaDynamics';
  import Sphere from '$geometry/Sphere.svelte';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import { interactivity } from '@threlte/extras';
  import { config } from './newtonsCradleState.svelte';

  interactivity();

  const NUM_BALLS = 5;
  const BALL_RADIUS = 0.25;
  const STRING_LENGTH = 2.5;
  const BALL_SPACING = BALL_RADIUS * 2;
  const GRAVITY = -9.81;
  const STRING_STIFFNESS = 400;
  const BALL_STIFFNESS = 8000;
  const CONTACT_DAMPING = 60;
  const DAMPING = 0.1;

  // Pivot points: fixed attachment points at the top, evenly spaced along x
  const pivotOffset = -((NUM_BALLS - 1) * BALL_SPACING) / 2; // center the pivots
  const pivots: MV[] = [];
  for (let i = 0; i < NUM_BALLS; i++) {
    pivots.push(pga.point([pivotOffset + i * BALL_SPACING, STRING_LENGTH, 0]));
  }

  // Initial positions: balls hang at rest, except the first which is pulled aside
  function initPos(i: number): [number, number, number] {
    if (i === 0) {
      const angle = Math.PI / 4;
      const px = pivotOffset + Math.sin(-angle) * STRING_LENGTH;
      const py = STRING_LENGTH - Math.cos(angle) * STRING_LENGTH;
      return [px, py, 0];
    }
    return [pivotOffset + i * BALL_SPACING, 0, 0];
  }

  // Body-frame attachment point (where the string connects on the ball — its center)
  const bodyAttach = origin;

  // State for each ball: [Motor M, Velocity bivector B]
  let S: [MV, MV][] = $state(
    Array.from({ length: NUM_BALLS }, (_, i) => {
      const [x, y, z] = initPos(i);
      return [pga.translator([x, y, z], 1), e01.smul(0)] as [MV, MV];
    })
  );

  // Forque on ball i (gravity + string + optional spring collisions)
  const forque = (i: number, M: MV, B: MV): MV => {
    const Mrev = M.reverse();
    const P = M.sandwich(origin);
    const V = M.sandwich(B);

    // 1. Gravity
    let total = gravityForque(Mrev, GRAVITY);

    // 2. String constraint (Hooke force from PgaDynamics pattern)
    const d = dist(P, pivots[i]);
    if (d > STRING_LENGTH) {
      // only apply force when string is stretched, not compressed
      const stretch = d - STRING_LENGTH;
      const Hooke = Mrev.sandwich(pivots[i])
        .join(bodyAttach)
        .smul(STRING_STIFFNESS * stretch / d);
      total = total.add(Hooke);

      // Damping along string direction to prevent string oscillation.
      // TODO: Probably a more direct (PGA) way to do this
      const posCoords = pga.pointCoords(P)!;
      const pivotCoords = pga.pointCoords(pivots[i])!;
      const nx = (pivotCoords[0] - posCoords[0]) / d;
      const ny = (pivotCoords[1] - posCoords[1]) / d;
      const nz = (pivotCoords[2] - posCoords[2]) / d;
      const vAlongString = V.basisSVal('e_01') * nx + V.basisSVal('e_02') * ny + V.basisSVal('e_03') * nz;
      if (vAlongString < 0) {
        const stringDamp = e01.smul(nx).add(e02.smul(ny)).add(e03.smul(nz))
          .smul(-CONTACT_DAMPING * vAlongString * 0.5);
        total = total.add(Mrev.sandwich(stringDamp).dual());
      }
    }

    // 3. Ball-ball contact (spring model only, impulse model handles this differently)
    if (config.collisionModel === 'spring') {
      total = total.add(springCollisionForque(i, S, BALL_RADIUS, BALL_STIFFNESS, CONTACT_DAMPING));
    }

    // 4. Light damping (air resistance or whatever, keeps the simulation from blowing up over time due to numerical errors)
    total = total.add(dampingForque(B, DAMPING));

    return total;
  };

  // Physics loop
  const stepsPerFrame = 10;
  useTask((delta) => {
    const dt = delta / stepsPerFrame;
    for (let step = 0; step < stepsPerFrame; step++) {
      S = S.map(([M, B], i) => {
        const [dM, dB] = stateDeriv(M, B, forque(i, M, B));
        return eulerStep(M, B, dM, dB, dt) as [MV, MV];
      });

      if (config.collisionModel === 'impulse') {
        S = resolveImpulses(S, BALL_RADIUS);
      }
    }
  });

  // Derived render data
  const positions = $derived(S.map(([M]) => pga.pointCoords(M.sandwich(origin))!));
</script>

<!-- Balls -->
{#each positions as pos}
  <Sphere center={pos} radius={BALL_RADIUS} color={0xbbbbbb} opacity={0.95} />
{/each}

<!-- Strings (lines from pivot to ball) -->
{#each positions as _pos, i}
  <RenderMv
    mv={[pivots[i], S[i][0].sandwich(origin)]}
    color={0x886644}
    lineWidth={0.008}
  />
{/each}
