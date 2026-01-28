<script lang="ts">
  /**
   * StepControls - Reusable stepping/gait configuration controls
   *
   * Controls for step trigger distance, finish threshold, duration, and rest time.
   * Used by: FeetConfig (feet demo), FullConfig (full spider demo)
   *
   * Takes a config prop so it can bind to different state sources.
   */

  import { Slider } from '$lib/components/ui/slider';

  interface StepConfig {
    minTriggerDistance: number;
    finishThreshold: number;
    stepDurationMs: number;
    minRestMs: number;
  }

  interface Props {
    config: StepConfig;
  }

  let { config }: Props = $props();
</script>

<div class="flex items-center gap-2 text-xs mb-1">
  <span class="min-w-14 text-gray-400">Min dist:</span>
  <Slider
    value={config.minTriggerDistance}
    onValueChange={(v) => (config.minTriggerDistance = v)}
    min={0}
    max={0.5}
    step={0.01}
    class="flex-1"
  />
  <span class="min-w-8 text-right font-mono text-green-300"
    >{config.minTriggerDistance.toFixed(2)}</span
  >
</div>

<div class="flex items-center gap-2 text-xs mb-1">
  <span class="min-w-14 text-gray-400">Finish:</span>
  <Slider
    value={config.finishThreshold}
    onValueChange={(v) => (config.finishThreshold = v)}
    min={0}
    max={0.2}
    step={0.005}
    class="flex-1"
  />
  <span class="min-w-8 text-right font-mono text-green-300"
    >{config.finishThreshold.toFixed(3)}</span
  >
</div>

<div class="flex items-center gap-2 text-xs mb-1">
  <span class="min-w-14 text-gray-400">Step ms:</span>
  <Slider
    value={config.stepDurationMs}
    onValueChange={(v) => (config.stepDurationMs = v)}
    min={50}
    max={800}
    step={10}
    class="flex-1"
  />
  <span class="min-w-8 text-right font-mono text-green-300">{config.stepDurationMs}</span>
</div>

<div class="flex items-center gap-2 text-xs mb-1">
  <span class="min-w-14 text-gray-400">Rest ms:</span>
  <Slider
    value={config.minRestMs}
    onValueChange={(v) => (config.minRestMs = v)}
    min={0}
    max={800}
    step={10}
    class="flex-1"
  />
  <span class="min-w-8 text-right font-mono text-green-300">{config.minRestMs}</span>
</div>
