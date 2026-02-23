<script lang="ts">
  import { Slider } from '$lib/components/ui/slider';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { config } from './wagonState.svelte';
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Wagon</legend>

  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.animate} id="wagonAnimate" />
    <label for="wagonAnimate" class="cursor-pointer">Animate</label>
  </div>

  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-14 text-gray-400">Speed:</span>
    <Slider
      value={config.speed}
      onValueChange={(v) => (config.speed = v)}
      min={-2}
      max={4}
      step={0.1}
      class="flex-1"
    />
    <span class="min-w-8 text-right font-mono text-green-300">{config.speed.toFixed(1)}</span>
  </div>

  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-14 text-gray-400">Steer:</span>
    <Slider
      value={config.steerAngle}
      onValueChange={(v) => (config.steerAngle = v)}
      min={-0.6}
      max={0.6}
      step={0.01}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300"
      >{((config.steerAngle * 180) / Math.PI).toFixed(0)}°</span
    >
  </div>
</fieldset>
