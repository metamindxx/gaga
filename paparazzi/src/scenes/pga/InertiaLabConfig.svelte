<script lang="ts">
  import { config, stats } from './inertiaLabState.svelte';
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Inertia Lab</legend>

  <div class="space-y-2">

    <div class="text-[10px] text-gray-500">Body</div>

    <label class="block text-xs text-gray-300">
      Half Offset: {config.halfOffset.toFixed(2)} m
      <input class="w-full" type="range" min="0.1" max="1.2" step="0.01" bind:value={config.halfOffset} />
    </label>

    <label class="block text-xs text-gray-300">
      Sphere Mass: {config.sphereMass.toFixed(2)} kg
      <input class="w-full" type="range" min="0.2" max="4" step="0.05" bind:value={config.sphereMass} />
    </label>

    <label class="block text-xs text-gray-300">
      Sphere Radius: {config.sphereRadius.toFixed(2)} m
      <input class="w-full" type="range" min="0.08" max="0.45" step="0.01" bind:value={config.sphereRadius} />
    </label>

    <div class="text-[10px] text-gray-500 pt-1">Setup (adjust before dropping)</div>

    <label class="block text-xs text-gray-300">
      Drop Height: {config.dropHeight.toFixed(2)} m
      <input class="w-full" type="range" min="0.1" max="3.0" step="0.05" bind:value={config.dropHeight} />
    </label>

    <label class="block text-xs text-gray-300">
      Tilt (X): {(config.dropAngleX * 180 / Math.PI).toFixed(1)}°
      <input class="w-full" type="range" min={-Math.PI / 2} max={Math.PI / 2} step="0.01" bind:value={config.dropAngleX} />
    </label>

    <label class="block text-xs text-gray-300">
      Ground Damping: {config.groundDamping.toFixed(0)}
      <input class="w-full" type="range" min="0" max="300" step="5" bind:value={config.groundDamping} />
    </label>

    <div class="text-[10px] text-gray-500 pt-1">Physics</div>

    <label class="block text-xs text-gray-300">
      Gravity: {config.gravity.toFixed(2)} m/s²
      <input class="w-full" type="range" min="-20" max="0" step="0.1" bind:value={config.gravity} />
    </label>

    <label class="block text-xs text-gray-300">
      Damping: {config.bodyDamping.toFixed(2)}
      <input class="w-full" type="range" min="0" max="20" step="0.1" bind:value={config.bodyDamping} />
    </label>

    <label class="block text-xs text-gray-300">
      Substeps: {config.substeps}
      <input class="w-full" type="range" min="1" max="20" step="1" bind:value={config.substeps} />
    </label>

    <div class="flex gap-2 mt-2">
      <button
        class="flex-1 text-xs px-2 py-1.5 rounded bg-sky-500 text-white hover:bg-sky-400"
        onclick={() => window.dispatchEvent(new CustomEvent('inertialab-drop'))}
      >
        Drop
      </button>
      <button
        class="flex-1 text-xs px-2 py-1.5 rounded bg-gray-600 text-white hover:bg-gray-500"
        onclick={() => window.dispatchEvent(new CustomEvent('inertialab-reset'))}
      >
        Reset
      </button>
    </div>

    <div class="text-[10px] text-gray-500 pt-1">Energy</div>
    <div class="font-mono text-[11px] text-gray-300 space-y-0.5">
      <div class="flex justify-between">
        <span class="text-gray-500">KE</span><span>{stats.ke.toFixed(3)} J</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">PE</span><span>{stats.pe.toFixed(3)} J</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Spring</span><span>{stats.springPE.toFixed(3)} J</span>
      </div>
      <div class="flex justify-between border-t border-gray-700 pt-0.5">
        <span class="text-gray-500">Total</span><span>{stats.total.toFixed(3)} J</span>
      </div>
    </div>
  </div>
</fieldset>
