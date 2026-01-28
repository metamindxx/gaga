<script lang="ts">
  import { Slider } from '$lib/components/ui/slider';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { config } from './skinningState.svelte';

  function formatDegrees(v: number) {
    return `${((v * 180) / Math.PI).toFixed(0)}°`;
  }
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">DQS Skinning</legend>

  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.useDQS} id="useDQS" />
    <label for="useDQS" class="cursor-pointer {config.useDQS ? 'text-green-400' : 'text-red-400'}"
      >{config.useDQS ? 'Dual Quaternion (DQS)' : 'Linear Blend (LBS)'}</label
    >
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.animate} id="animate" />
    <label for="animate" class="cursor-pointer">Animate</label>
  </div>

  {#if config.animate}
    <div class="flex items-center gap-2 text-xs mb-1">
      <span class="min-w-14 text-gray-400">Speed:</span>
      <Slider
        value={config.animationSpeed}
        onValueChange={(v) => (config.animationSpeed = v)}
        min={0.1}
        max={3}
        step={0.1}
        class="flex-1"
      />
      <span class="min-w-8 text-right font-mono text-green-300"
        >{config.animationSpeed.toFixed(1)}x</span
      >
    </div>
  {:else}
    <div class="flex items-center gap-2 text-xs mb-1">
      <span class="min-w-14 text-gray-400">Rotation:</span>
      <Slider
        value={config.rotationAngle}
        onValueChange={(v) => (config.rotationAngle = v)}
        min={0}
        max={3.14159}
        step={0.01}
        class="flex-1"
      />
      <span class="min-w-10 text-right font-mono text-green-300"
        >{formatDegrees(config.rotationAngle)}</span
      >
    </div>
  {/if}

  {#if config.animate}
    <div class="flex items-center gap-2 text-xs mb-1">
      <span class="min-w-14 text-gray-400">Rotation:</span>
      <span class="font-mono text-green-300">{formatDegrees(config.rotationAngle)}</span>
    </div>
  {/if}
</fieldset>
