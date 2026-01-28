<script lang="ts">
  /**
   * FootConfig - Config panel for the Foot demo slide (slide 101)
   */
  import { Slider } from '$lib/components/ui/slider';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { config } from '../state/footState.svelte';
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Spidor Foot</legend>

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
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-14 text-gray-400">Target r:</span>
    <Slider
      value={config.targetRadius}
      onValueChange={(v) => (config.targetRadius = v)}
      min={0}
      max={2}
      step={0.01}
      class="flex-1"
    />
    <span class="min-w-8 text-right font-mono text-green-300">{config.targetRadius.toFixed(2)}</span
    >
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-14 text-gray-400">Target v:</span>
    <Slider
      value={config.targetSpeed}
      onValueChange={(v) => (config.targetSpeed = v)}
      min={0}
      max={2}
      step={0.01}
      class="flex-1"
    />
    <span class="min-w-8 text-right font-mono text-green-300">{config.targetSpeed.toFixed(2)}</span>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.neighborAMoving} id="neighborA" />
    <label for="neighborA" class="cursor-pointer">Neighbor A moving</label>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.neighborBMoving} id="neighborB" />
    <label for="neighborB" class="cursor-pointer">Neighbor B moving</label>
  </div>
</fieldset>
