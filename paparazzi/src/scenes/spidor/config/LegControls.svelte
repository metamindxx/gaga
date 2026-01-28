<script lang="ts">
  /**
   * LegControls - Reusable leg IK configuration controls
   *
   * Controls for segment count, length, plane lock, knee hints, and solver iterations.
   * Used by: LegConfig (leg demo), FullConfig (full spider demo)
   *
   * Takes a config prop so it can bind to different state sources.
   */

  import { Slider } from '$lib/components/ui/slider';
  import { Checkbox } from '$lib/components/ui/checkbox';

  interface LegConfig {
    segmentCount: number;
    segmentLength: number;
    lockToPlane: boolean;
    useKneeHint: boolean;
    kneePosition: number;
    solverIterations: number;
  }

  interface Props {
    config: LegConfig;
  }

  let { config }: Props = $props();
</script>

<div class="flex items-center gap-2 text-xs mb-1">
  <span class="min-w-14 text-gray-400">Segments:</span>
  <Slider
    value={config.segmentCount}
    onValueChange={(v) => (config.segmentCount = v)}
    min={2}
    max={8}
    step={1}
    class="flex-1"
  />
  <span class="min-w-8 text-right font-mono text-green-300">{config.segmentCount}</span>
</div>

<div class="flex items-center gap-2 text-xs mb-1">
  <span class="min-w-14 text-gray-400">Length:</span>
  <Slider
    value={config.segmentLength}
    onValueChange={(v) => (config.segmentLength = v)}
    min={0.05}
    max={0.5}
    step={0.01}
    class="flex-1"
  />
  <span class="min-w-8 text-right font-mono text-green-300">{config.segmentLength.toFixed(2)}</span>
</div>

<div class="flex items-center gap-2 text-xs mb-1">
  <Checkbox bind:checked={config.lockToPlane} id="lockToPlane" />
  <label for="lockToPlane" class="cursor-pointer">Lock to plane</label>
</div>

<div class="flex items-center gap-2 text-xs mb-1">
  <Checkbox bind:checked={config.useKneeHint} id="useKneeHint" />
  <label for="useKneeHint" class="cursor-pointer">Set knee</label>
</div>

{#if config.useKneeHint && config.kneePosition !== undefined}
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-14 text-gray-400">Knee pos:</span>
    <Slider
      value={config.kneePosition}
      onValueChange={(v) => (config.kneePosition = v)}
      min={0}
      max={1}
      step={0.01}
      class="flex-1"
    />
    <span class="min-w-8 text-right font-mono text-green-300">{config.kneePosition.toFixed(2)}</span
    >
  </div>
{/if}

<div class="flex items-center gap-2 text-xs mb-1">
  <span class="min-w-14 text-gray-400">Iterations:</span>
  <Slider
    value={config.solverIterations}
    onValueChange={(v) => (config.solverIterations = v)}
    min={1}
    max={10}
    step={1}
    class="flex-1"
  />
  <span class="min-w-8 text-right font-mono text-green-300">{config.solverIterations}</span>
</div>
