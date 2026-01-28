<script lang="ts">
  import { Slider } from '$lib/components/ui/slider';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { config, jimmyAnimNames, setAnimWeight } from './jimmyState.svelte';
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Jimmy Animation</legend>

  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.debugNoSkinning} id="debugNoSkinning" />
    <label
      for="debugNoSkinning"
      class="cursor-pointer {config.debugNoSkinning ? 'text-yellow-400' : 'text-red-400'}"
      >Debug: no skinning</label
    >
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.debugIdentity} id="debugIdentity" />
    <label
      for="debugIdentity"
      class="cursor-pointer {config.debugIdentity ? 'text-yellow-400' : 'text-red-400'}"
      >Debug: identity transforms</label
    >
  </div>

  <div class="mt-2 pt-2 border-t border-gray-700">
    <div class="text-xs text-gray-400 mb-2">Animation Weights:</div>
    {#each jimmyAnimNames as name, i}
      <div class="flex items-center gap-2 text-xs mb-1">
        <span class="min-w-12 text-gray-400">{name}:</span>
        <Slider
          value={config.animWeights[i]}
          onValueChange={(v) => setAnimWeight(i, v)}
          min={0}
          max={1}
          step={0.01}
          class="flex-1"
        />
        <span class="min-w-8 text-right font-mono text-green-300"
          >{config.animWeights[i].toFixed(2)}</span
        >
      </div>
    {/each}
  </div>

  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-14 text-gray-400">Speed:</span>
    <Slider
      value={config.speed}
      onValueChange={(v) => (config.speed = v)}
      min={0.1}
      max={3}
      step={0.1}
      class="flex-1"
    />
    <span class="min-w-8 text-right font-mono text-green-300">{config.speed.toFixed(1)}x</span>
  </div>
</fieldset>
