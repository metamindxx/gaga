<script lang="ts">
  import { Slider } from '$lib/components/ui/slider';
  import { config, loadSceneData, toggleAnimation } from './jsonSceneState.svelte';
  import type { JsonScene } from './jsonSceneLoader';

  let fileInput: HTMLInputElement;
  let error = $state('');

  function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    error = '';

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as JsonScene;
        if (!data.nodes) {
          error = 'Invalid: missing "nodes"';
          return;
        }
        loadSceneData(data, file.name);
      } catch {
        error = 'Invalid JSON file';
      }
    };
    reader.readAsText(file);
  }
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Scene V4</legend>

  <!-- File upload -->
  <div class="flex flex-col gap-1 mb-2">
    <button
      class="w-full px-2 py-1.5 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded cursor-pointer"
      onclick={() => fileInput.click()}
    >
      Load JSON file...
    </button>
    <input
      bind:this={fileInput}
      type="file"
      accept=".json"
      class="hidden"
      onchange={handleFileUpload}
    />
    {#if config.loadedFileName}
      <span class="text-[10px] text-green-400 truncate" title={config.loadedFileName}>
        {config.loadedFileName}
      </span>
    {/if}
    {#if error}
      <span class="text-[10px] text-red-400">{error}</span>
    {/if}
  </div>

  <!-- Animation buttons -->
  {#if config.animationNames.length > 0}
    <div class="flex flex-wrap gap-1 mb-2">
      {#each config.animationNames as name}
        <button
          class="px-2 py-1 text-[11px] rounded cursor-pointer transition-colors
            {config.activeAnimations[name]
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}"
          onclick={() => toggleAnimation(name)}
        >
          {name}
        </button>
      {/each}
    </div>
  {/if}

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
    <span class="min-w-14 text-gray-400">Scale:</span>
    <input
      type="number"
      step="0.1"
      value={config.scale}
      oninput={(e) => {
        const v = parseFloat((e.target as HTMLInputElement).value);
        if (Number.isFinite(v) && v > 0) config.scale = v;
      }}
      class="flex-1 bg-gray-800 text-green-300 text-xs font-mono px-2 py-1 rounded border border-gray-600 w-16"
    />
  </div>
</fieldset>
