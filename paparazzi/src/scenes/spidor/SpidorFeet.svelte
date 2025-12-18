<script lang="ts">
  import { useTask } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import { readable } from 'svelte/store';
  import type { Multivector } from '../../algebra/types';
  import RenderMv from '../../geometry/RenderMv.svelte';

  import SpidorFoot from './SpidorFoot.svelte';
  import { getSpidorFullViz } from './spidorFullViz';

  interactivity();

  let {
    feet = $bindable([] as Multivector[])
    , targets
    , stepMinDist = 0.12
    , stepDurationMs = 220
    , minRestMs = 120
    , stepFinishDist = 0.03
  }: {
    feet?: Multivector[];
    targets: Multivector[];
    stepMinDist?: number;
    stepDurationMs?: number;
    minRestMs?: number;
    stepFinishDist?: number;
  } = $props();

  type LegState = { foot: Multivector; moving: boolean };
  let legs = $state<LegState[]>([]);

  const showViz = getSpidorFullViz() ?? readable(true);

  const legCount = $derived(targets.length);

  function neighborsFor(i: number): boolean[] {
    const flags: boolean[] = [];
    if (i > 0) flags.push(!!legs[i - 1]?.moving);
    if (i < legCount - 1) flags.push(!!legs[i + 1]?.moving);
    return flags;
  }

  // Keep internal state sized to `targets`, and publish `feet` once per frame.
  useTask(() => {
    if (legCount === 0) return;

    // Resize/init on leg-count changes.
    if (legs.length !== legCount) {
      legs = targets.map((t) => ({ foot: t, moving: false }));
      feet = legs.map((l) => l.foot);
      return;
    }

    // Publish bindable output for parents.
    feet = legs.map((l) => l.foot);
  });
</script>

{#if $showViz}
  {#each targets as target}
    <RenderMv mv={target} color={0x444444} radius={0.01} draggable={false} />
  {/each}
{/if}

<!-- {#if ready} -->
{#each legs as leg, i (i)}
  <SpidorFoot
    bind:foot={leg.foot}
    bind:moving={leg.moving}
    target={targets[i]}
    neighborsMoving={neighborsFor(i)}
    {stepMinDist}
    {stepDurationMs}
    {minRestMs}
    {stepFinishDist}
    showTarget={false}
    draggable={false}
  />
{/each}
<!-- {/if} -->
