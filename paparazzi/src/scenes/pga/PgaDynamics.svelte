<script lang="ts">
  // PGA Dynamics - "May The Forque Be With You" (Dorst & De Keninck)
  import { useTask } from '@threlte/core';
  import { pga, e02, e12, e13, e23 } from '../../algebra/pga';
  import type { Multivector as MV } from '../../algebra/types.js';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import { interactivity } from '@threlte/extras';
  interactivity();

  const d = 3;

  // Create a hypercube (square in 2D, cube in 3D, ...)
  // Start by defining its vertices.
  const cubePoints: MV[] = [];
  for (let i = 0; i < 2 ** d; i++) {
    // i |> binary string |> left pad with 0 |> split |> convert to centered vertex coord
    const coords = i
      .toString(2)
      .padStart(d, '0')
      .split('')
      .map((x) => +x - 0.5);
    cubePoints.push(pga.point(coords as [number, number, number]));
  }

  // Now consider all vertex pairs and create edges for those pairs that differ only in one coordinate.
  const cubeEdges: MV[][] = [];
  for (let i = 0; i < 2 ** d; i++)
    for (let j = i + 1; j < 2 ** d; j++) {
      const hasEdge = ((i ^ j) & ((i ^ j) - 1)) == 0;
      if (hasEdge) cubeEdges.push([cubePoints[i], cubePoints[j]]);
    }

  // Physics state: [Motor M, Velocity bivector B]
  let S: [MV, MV] = $state([
    pga.translator([0, 1, 0], -1.5).gp(e12.exp(0.1))
    , e12.add(e13.smul(1.3)).add(e23.smul(0.5))
  ]);

  // Spring attachment point
  let attach = $state(pga.translator([0, -0.5, 0], 1).sandwich(cubePoints[2 ** d - 1]));

  // Our forques (forces as lines, in body frame)
  const F = (M: MV, B: MV) => {
    const Mrev = M.reverse();
    const Gravity = Mrev.sandwich(e02.smul(-9.81)).dual();
    const Hooke = Mrev.sandwich(attach)
      .join(cubePoints[2 ** d - 1])
      .smul(12);
    const Damping = B.smul(-0.25).dual();
    return Gravity.add(Hooke).add(Damping);
  };

  // The derivative of the state: dM=-0.5*M*B, dB=(F-0.5*[B*,B]).undual
  const dS = ([M, B]: [MV, MV]): [MV, MV] => [
    M.gp(B).smul(-0.5)
    , F(M, B)
      .sub(B.dual().gp(B).sub(B.gp(B.dual())).smul(0.5))
      .unDual()
  ];

  // Physics loop
  const stepsPerFrame = 10;
  useTask((delta) => {
    const dt = delta / stepsPerFrame;
    for (let i = 0; i < stepsPerFrame; i++) {
      const [dM, dB] = dS(S);
      S = [S[0].add(dM.smul(dt)).normalize(), S[1].add(dB.smul(dt)).selectGrade(2)];
    }
  });

  // Derived render data
  const M = $derived(S[0]);
  const movedPoints = $derived(cubePoints.map((v) => M.sandwich(v)));
  const movedEdges = $derived(cubeEdges.map(([a, b]) => [M.sandwich(a), M.sandwich(b)]));
</script>

{#each movedEdges as edge}
  <RenderMv mv={edge} color={0x007799} lineWidth={0.02} />
{/each}
{#each movedPoints as wv}
  <RenderMv mv={wv} radius={0.03} color={0x007799} />
{/each}
<RenderMv bind:mv={attach} color={0x007799} radius={0.08} label="attach" draggable />
<RenderMv
  mv={[attach, M.sandwich(cubePoints[cubePoints.length - 1])]}
  color={0x007799}
  lineWidth={0.015}
/>
