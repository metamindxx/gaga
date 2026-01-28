<script lang="ts">
  import { useTask } from '@threlte/core';
  import { untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  import type { Multivector } from '../../../algebra/types';
  import RenderMv from '../../../geometry/RenderMv.svelte';
  import { e0, pga } from '../../../algebra/pga';

  type Coords3D = [number, number, number];

  let {
    foot = $bindable(e0.dual())
    , target
    , neighborsMoving = []
    , showViz = true

    , stepMinDist = 0.12
    , stepDurationMs = 220
    , minRestMs = 120
    , stepFinishDist = 0.03

    , showTarget = false
    , footColor = 0x999999
    , targetColor = 0x444444
    , footRadius = 0.035
    , targetRadius = 0.01
    , draggable = false

    , moving = $bindable(false)
  }: {
    foot?: Multivector;
    target: Multivector;
    neighborsMoving?: boolean[];
    showViz?: boolean;

    stepMinDist?: number;
    stepDurationMs?: number;
    minRestMs?: number;
    stepFinishDist?: number;

    showTarget?: boolean;
    footColor?: number;
    targetColor?: number;
    footRadius?: number;
    targetRadius?: number;
    draggable?: boolean;

    moving?: boolean;
  } = $props();

  let tween: Tween<Coords3D> | null = null;
  let restUntilMs = 0;
  let movingSinceMs = 0;

  function pointCoords(mv: Multivector): Coords3D {
    const coords = pga.pointCoords(mv.selectGrade(3));
    if (!coords) return [0, 0, 0];
    return coords;
  }

  function dist2(a: Coords3D, b: Coords3D) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return dx * dx + dy * dy + dz * dz;
  }

  $effect(() => {
    // `foot` is bindable and updated every frame; don't track it here or we'd
    // constantly reset the tween.
    const start = untrack(() => pointCoords(foot));

    tween = new Tween<Coords3D>(start, {
      duration: stepDurationMs
      , easing: cubicOut
    });

    moving = false;
    restUntilMs = 0;
    movingSinceMs = 0;
  });

  const stepMinDist2 = $derived(stepMinDist * stepMinDist);
  const stepFinishDist2 = $derived(stepFinishDist * stepFinishDist);

  function tick(nowMs: number) {
    if (!tween) return;

    if (moving) {
      if (
        dist2(tween.current, tween.target) <= stepFinishDist2 &&
        nowMs - movingSinceMs >= stepDurationMs
      ) {
        moving = false;
        restUntilMs = nowMs + minRestMs;
      }
    } else {
      const targetCoords = pointCoords(target);
      if (
        nowMs >= restUntilMs &&
        dist2(tween.current, targetCoords) > stepMinDist2 &&
        !neighborsMoving.some(Boolean)
      ) {
        moving = true;
        movingSinceMs = nowMs;
        tween.target = targetCoords;
      }
    }

    foot = pga.point(tween.current);
  }

  useTask(() => {
    if (!tween) return;
    tick(performance.now());
  });
</script>

{#if showTarget}
  <RenderMv mv={target} color={targetColor} radius={targetRadius} draggable={false} />
{/if}

{#if showViz}
  <RenderMv mv={foot} color={footColor} radius={footRadius} {draggable} />
{/if}
