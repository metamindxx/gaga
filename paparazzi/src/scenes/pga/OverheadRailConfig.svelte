<script lang="ts">
  import { Slider } from '$lib/components/ui/slider';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { config } from './overheadRailState.svelte';

  const latchLabels = ['L1', 'L2', 'L3', 'R1', 'R2', 'R3'];

  function closeAll() {
    for (let i = 0; i < 6; i++) config.latches[i] = false;
  }
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Overhead Rail</legend>

  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.animate} id="railAnimate" />
    <label for="railAnimate" class="cursor-pointer">Animate</label>
  </div>

  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-14 text-gray-400">Speed:</span>
    <Slider
      value={config.speed}
      onValueChange={(v) => (config.speed = v)}
      min={0}
      max={4}
      step={0.1}
      class="flex-1"
    />
    <span class="min-w-8 text-right font-mono text-green-300">{config.speed.toFixed(1)}</span>
  </div>

  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-14 text-gray-400">Position:</span>
    <Slider
      value={config.cartPosition}
      onValueChange={(v) => (config.cartPosition = v)}
      min={0}
      max={1}
      step={0.01}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300"
      >{(config.cartPosition * 100).toFixed(0)}%</span
    >
  </div>

  <div class="mt-2 border-t border-sky-400/30 pt-2">
    <div class="flex items-center justify-between mb-1">
      <span class="text-xs text-gray-400">Latches:</span>
      <button class="text-xs text-sky-300 hover:text-sky-100" onclick={closeAll}>
        Close All
      </button>
    </div>
    <div class="grid grid-cols-3 gap-1">
      {#each latchLabels as label, i}
        <div class="flex items-center gap-1 text-xs">
          <Checkbox
            checked={config.latches[i]}
            onCheckedChange={(v) => (config.latches[i] = !!v)}
            id="latch{i}"
          />
          <label for="latch{i}" class="cursor-pointer font-mono {config.latches[i] ? 'text-green-300' : 'text-red-300'}">
            {label}
          </label>
        </div>
      {/each}
    </div>
  </div>
</fieldset>
