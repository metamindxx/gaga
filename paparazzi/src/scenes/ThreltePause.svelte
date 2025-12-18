<script lang="ts">
  import { useThrelte } from '@threlte/core';
  import { get } from 'svelte/store';

  interface Props {
    paused: boolean;
  }

  let { paused }: Props = $props();

  const { scheduler, mainStage, renderStage, renderMode, advance, invalidate } = useThrelte();

  let initialRenderMode: 'always' | 'on-demand' | 'manual' | undefined = undefined;

  function setPaused(p: boolean) {
    if (initialRenderMode === undefined) {
      initialRenderMode = get(renderMode);
    }

    if (p) {
      // Pause all task stages, but keep the render stage alive so we can draw a frame.
      mainStage.stop();
      for (const stage of scheduler.stages) {
        if (stage !== renderStage) stage.stop();
      }
      renderStage.start();

      // Ensure we still draw a single frame while paused.
      renderMode.set('manual');
      advance();
    } else {
      for (const stage of scheduler.stages) stage.start();
      renderMode.set(initialRenderMode ?? 'on-demand');
      invalidate();
    }
  }

  $effect(() => setPaused(paused));
</script>
