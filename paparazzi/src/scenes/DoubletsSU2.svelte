<!--
  DoubletsSU2.svelte - Animated SU(2) doublet visualization

  Displays 6 doublets being transformed by cycling through 4 generators:
    Phase 1 (0-15s):  tau1 rotation (X-axis)
    Phase 2 (15-30s): tau2 rotation (Y-axis)
    Phase 3 (30-45s): tau3 rotation (Z-axis)
    Phase 4 (45-60s): I2 rotation (U(1) global phase)

  Each phase sweeps theta from 0 to 2*pi, applying exp(i*theta*tau).
-->
<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import { Color } from 'three';
  import RenderMv from '../geometry/RenderMv.svelte';
  import SpinorFlag from '../geometry/RotorFlag.svelte';
  import { pga, e12, e13, e23, one } from '../algebra/pga';
  import {
    complex
    , coords
    , TAU
    , type Doublet
    , type Mat2x2
    , tau1
    , tau2
    , tau3
    , I2
    , matExp
    , matMul
    , normalizeDoublet
  } from '../algebra/complex';

  interactivity();

  type Props = { speed?: number; paused?: boolean };
  let { speed = 1, paused = false }: Props = $props();

  // Playground config
  const baseDoublets: Doublet[] = [
    [complex(1, 0), complex(1, 0)]
    , [complex(1, 1), complex(1, 1)]
    , [complex(1, 0), complex(0, 1)]
    , [complex(1, 1), complex(0, 2)]
    , [complex(1, 0), complex(0, 0)]
    , [complex(1, 1), complex(0, 0)]
  ].map(normalizeDoublet);

  const baseColors = [0x4c9aff, 0xff7a45, 0x22c55e, 0xa855f7, 0xf43f5e, 0xeab308];
  const WHITE = new Color(0xffffff);

  // Animation timing: 60s total, 15s per generator phase
  const tMax = 60
    , quarter = tMax / 4;
  const generators: Mat2x2[] = [tau1, tau2, tau3, I2]; // X, Y, Z, then U(1) phase

  let time = $state(0);
  useTask((delta) => {
    if (!paused) time = (time + delta * speed) % tMax;
  });

  // Compute current SU(2) transformation matrix
  // idx selects which generator (0=tau1, 1=tau2, 2=tau3, 3=I2)
  // theta sweeps 0 to 2*pi within each 15s phase
  const U = $derived.by(() => {
    const idx = Math.min(3, Math.floor(time / quarter));
    const theta = (TAU * (time - idx * quarter)) / quarter;
    return matExp(generators[idx], theta);
  });

  /**
   * Convert doublet to scene objects (points, rotor, colors)
   * Doublet [alpha, beta] -> pt1 at (Re(a), 0, Im(a)), pt2 at (Re(b), 0, Im(b))
   * Rotor mapping: ar + bi*e23 + br*e13 + ai*e12
   */
  function toScene(d: Doublet, color: number) {
    const [ar, ai] = coords(d[0])
      , [br, bi] = coords(d[1]);
    const rotor = one.smul(ar).add(e23.smul(bi)).add(e13.smul(br)).add(e12.smul(ai));
    const pt1 = pga.point([ar, 0, ai])
      , pt2 = pga.point([br, 0, bi]);
    const c2 = new Color(color).lerp(WHITE, 0.35).getHex(); // pt2 lighter
    return { pt1, pt2, rotor, color, c2, link: new Color(color).lerp(new Color(c2), 0.5).getHex() };
  }

  const scenes = $derived(
    baseDoublets.map((d, i) => toScene(normalizeDoublet(matMul(U, d)), baseColors[i]))
  );
</script>

{#each scenes as s}
  <RenderMv mv={s.pt1} color={s.color} radius={0.05} />
  <RenderMv mv={s.pt2} color={s.c2} radius={0.05} />
  <RenderMv mv={[s.pt1, s.pt2]} color={s.link} opacity={0.2} />
  <SpinorFlag rotor={s.rotor} color={s.color} />
{/each}
