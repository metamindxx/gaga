<!-- <!--
  Dandelion.svelte - Multi-petal doublet visualization

  Creates a dandelion of doublets arranged in spherical layers.
-->
<script lang="ts">
  import { useTask } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import { Color } from 'three';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import SpinorFlag from '../../geometry/RotorFlag.svelte';
  import { pga, e12, e13, e23, one } from '../../algebra/pga';
  import {
    complex
    , coords
    , cExp
    , TAU
    , type Doublet
    , matMul
    , normalizeDoublet
    , matExpTau3
  } from '../../algebra/complex';

  interactivity();

  type Props = { speed?: number; paused?: boolean; numLayers?: number; petalsPerLayer?: number };
  let { speed = 1, paused = false, numLayers = 5, petalsPerLayer = 8 }: Props = $props();

  const { PI, sin, cos } = Math;

  function genDoublets(layers: number, petals: number): Doublet[] {
    const d: Doublet[] = [
      normalizeDoublet([complex(1, 0), complex(0.0001, 0)])
      , normalizeDoublet([complex(0.0001, 0), complex(1, 0)])
    ];
    for (let n = 0; n < layers - 2; n++) {
      const a = ((PI / 2) * (n + 1)) / (layers - 1);
      if (a > 0.01 && a < PI - 0.01) {
        for (let m = 1; m < petals; m++) {
          d.push(normalizeDoublet([complex(sin(a), 0), cExp((TAU * m) / petals).smul(cos(a))]));
        }
      }
    }
    return d;
  }

  const baseDoublets = $derived(genDoublets(numLayers, petalsPerLayer));
  const palette = [0x4c9aff, 0xff7a45, 0x22c55e, 0xa855f7, 0xf43f5e, 0xeab308, 0x14b8a6, 0x60a5fa];
  const WHITE = new Color(0xffffff);

  let time = $state(0);
  const tMax = 60;
  useTask((delta) => {
    if (!paused) time = (time + delta * speed) % tMax;
  });

  // phi sweeps 0 to 4*TAU over 60s (4 full rotations)
  // U = diag(e^(i*phi), e^(-i*phi)) rotates doublets about Z in SU(2)
  // phase = e^(i*phi) applies global U(1) phase
  const transform = $derived.by(() => {
    const phi = (4 * TAU * time) / tMax;
    return { U: matExpTau3(phi), phase: cExp(phi) };
  });

  function toScene(d: Doublet, color: number) {
    const [ar, ai] = coords(d[0])
      , [br, bi] = coords(d[1]);
    const rotor = one.smul(ar).add(e23.smul(bi)).add(e13.smul(br)).add(e12.smul(ai));
    const pt1 = pga.point([ar, 0, ai])
      , pt2 = pga.point([br, 0, bi]);
    const c2 = new Color(color).lerp(WHITE, 0.35).getHex();
    return { pt1, pt2, rotor, color, c2, link: new Color(color).lerp(new Color(c2), 0.5).getHex() };
  }

  const scenes = $derived(
    baseDoublets.map((d, i) => {
      const t = matMul(transform.U, d);
      const td = normalizeDoublet([t[0].gp(transform.phase), t[1].gp(transform.phase)]);
      return toScene(td, palette[i % palette.length]);
    })
  );
</script>

{#each scenes as s}
  <RenderMv mv={s.pt1} color={s.color} radius={0.03} />
  <RenderMv mv={s.pt2} color={s.c2} radius={0.03} />
  <RenderMv mv={[s.pt1, s.pt2]} color={s.link} opacity={0.18} />
  <SpinorFlag rotor={s.rotor} color={s.color} />
{/each}
