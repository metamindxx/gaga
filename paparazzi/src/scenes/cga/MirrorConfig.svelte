<script lang="ts">
  /**
   * MirrorConfig - Config panel for the CGA Mirror demo
   * Supports multiple configurable mirrors
   */
  import { Slider } from '$lib/components/ui/slider';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { 
    config, 
    addMirror, 
    removeMirror, 
    getSelectedMirror, 
    updateMirror,
    type MirrorConfig as MirrorConfigType
  } from './mirrorState.svelte';

  // Get the currently selected mirror
  const selectedMirror = $derived(getSelectedMirror());
</script>

<fieldset class="p-2.5 bg-emerald-500/10 border border-emerald-400 rounded-md">
  <legend class="text-xs text-emerald-400 px-1">CGA Mirrors</legend>

  <!-- Object Type Toggle -->
  <div class="flex items-center gap-2 text-xs mb-2">
    <span class="min-w-16 text-gray-400">Object:</span>
    <button
      class="px-2 py-0.5 rounded text-xs {config.objectType === 'point'
        ? 'bg-blue-500 text-white'
        : 'bg-gray-700 text-gray-300'}"
      onclick={() => (config.objectType = 'point')}
    >
      Point
    </button>
    <button
      class="px-2 py-0.5 rounded text-xs {config.objectType === 'sphere'
        ? 'bg-blue-500 text-white'
        : 'bg-gray-700 text-gray-300'}"
      onclick={() => (config.objectType = 'sphere')}
    >
      Sphere
    </button>
  </div>

  <!-- Object Position -->
  <div class="text-xs text-gray-500 mb-1 mt-2">Object Position</div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-8 text-gray-400">X:</span>
    <Slider
      value={config.objectPosition[0]}
      onValueChange={(v) => (config.objectPosition = [v, config.objectPosition[1], config.objectPosition[2]])}
      min={-2}
      max={2}
      step={0.05}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.objectPosition[0].toFixed(2)}</span>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-8 text-gray-400">Y:</span>
    <Slider
      value={config.objectPosition[1]}
      onValueChange={(v) => (config.objectPosition = [config.objectPosition[0], v, config.objectPosition[2]])}
      min={-2}
      max={2}
      step={0.05}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.objectPosition[1].toFixed(2)}</span>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-8 text-gray-400">Z:</span>
    <Slider
      value={config.objectPosition[2]}
      onValueChange={(v) => (config.objectPosition = [config.objectPosition[0], config.objectPosition[1], v])}
      min={-2}
      max={2}
      step={0.05}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.objectPosition[2].toFixed(2)}</span>
  </div>

  <!-- Object Radius (only for sphere object) -->
  {#if config.objectType === 'sphere'}
    <div class="flex items-center gap-2 text-xs mb-1">
      <span class="min-w-16 text-gray-400">Obj radius:</span>
      <Slider
        value={config.objectRadius}
        onValueChange={(v) => (config.objectRadius = v)}
        min={0.02}
        max={0.5}
        step={0.01}
        class="flex-1"
      />
      <span class="min-w-10 text-right font-mono text-green-300">{config.objectRadius.toFixed(2)}</span>
    </div>
  {/if}

  <!-- ================================================================== -->
  <!-- MIRRORS SECTION                                                    -->
  <!-- ================================================================== -->
  <div class="text-xs text-gray-500 mb-1 mt-3 flex items-center justify-between">
    <span>Mirrors ({config.mirrors.length})</span>
    <button
      class="px-2 py-0.5 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-500"
      onclick={addMirror}
    >
      + Add
    </button>
  </div>

  <!-- Mirror Tabs -->
  <div class="flex flex-wrap gap-1 mb-2">
    {#each config.mirrors as mirror, i}
      <button
        class="px-2 py-0.5 rounded text-xs flex items-center gap-1 {config.selectedMirrorId === mirror.id
          ? 'bg-emerald-500 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
        onclick={() => (config.selectedMirrorId = mirror.id)}
      >
        <span 
          class="w-2 h-2 rounded-full" 
          style="background-color: #{mirror.color.toString(16).padStart(6, '0')}"
        ></span>
        M{i + 1}
      </button>
    {/each}
  </div>

  <!-- Selected Mirror Config -->
  {#if selectedMirror}
    <div class="border border-gray-600 rounded p-2 bg-gray-800/50">
      <!-- Mirror Header -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <Checkbox 
            checked={selectedMirror.enabled} 
            onCheckedChange={(v) => updateMirror(selectedMirror.id, { enabled: !!v })}
            id={`mirror-${selectedMirror.id}-enabled`}
          />
          <label for={`mirror-${selectedMirror.id}-enabled`} class="text-xs cursor-pointer">
            Enabled
          </label>
        </div>
        {#if config.mirrors.length > 1}
          <button
            class="px-2 py-0.5 rounded text-xs bg-red-600/50 text-red-200 hover:bg-red-500"
            onclick={() => removeMirror(selectedMirror.id)}
          >
            Remove
          </button>
        {/if}
      </div>

      <!-- Mirror Type Toggle -->
      <div class="flex items-center gap-2 text-xs mb-2">
        <span class="min-w-12 text-gray-400">Type:</span>
        <button
          class="px-2 py-0.5 rounded text-xs {selectedMirror.type === 'sphere'
            ? 'bg-emerald-500 text-white'
            : 'bg-gray-700 text-gray-300'}"
          onclick={() => updateMirror(selectedMirror.id, { type: 'sphere' })}
        >
          Sphere
        </button>
        <button
          class="px-2 py-0.5 rounded text-xs {selectedMirror.type === 'circle'
            ? 'bg-emerald-500 text-white'
            : 'bg-gray-700 text-gray-300'}"
          onclick={() => updateMirror(selectedMirror.id, { type: 'circle' })}
        >
          Circle
        </button>
        <button
          class="px-2 py-0.5 rounded text-xs {selectedMirror.type === 'plane'
            ? 'bg-emerald-500 text-white'
            : 'bg-gray-700 text-gray-300'}"
          onclick={() => updateMirror(selectedMirror.id, { type: 'plane' })}
        >
          Plane
        </button>
      </div>

      <!-- Mirror Color -->
      <div class="flex items-center gap-2 text-xs mb-2">
        <span class="min-w-12 text-gray-400">Color:</span>
        <input
          type="color"
          value="#{selectedMirror.color.toString(16).padStart(6, '0')}"
          oninput={(e) => updateMirror(selectedMirror.id, { color: parseInt(e.currentTarget.value.slice(1), 16) })}
          class="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
        />
        <span class="font-mono text-green-300">#{selectedMirror.color.toString(16).padStart(6, '0')}</span>
      </div>

      <!-- Mirror Center / Point on plane -->
      <div class="text-xs text-gray-500 mb-1">{selectedMirror.type === 'plane' ? 'Point on plane' : 'Center'}</div>
      <div class="flex items-center gap-2 text-xs mb-1">
        <span class="min-w-6 text-gray-400">X:</span>
        <Slider
          value={selectedMirror.center[0]}
          onValueChange={(v) => updateMirror(selectedMirror.id, { 
            center: [v, selectedMirror.center[1], selectedMirror.center[2]] 
          })}
          min={-2}
          max={2}
          step={0.05}
          class="flex-1"
        />
        <span class="min-w-8 text-right font-mono text-green-300">{selectedMirror.center[0].toFixed(2)}</span>
      </div>
      <div class="flex items-center gap-2 text-xs mb-1">
        <span class="min-w-6 text-gray-400">Y:</span>
        <Slider
          value={selectedMirror.center[1]}
          onValueChange={(v) => updateMirror(selectedMirror.id, { 
            center: [selectedMirror.center[0], v, selectedMirror.center[2]] 
          })}
          min={-2}
          max={2}
          step={0.05}
          class="flex-1"
        />
        <span class="min-w-8 text-right font-mono text-green-300">{selectedMirror.center[1].toFixed(2)}</span>
      </div>
      <div class="flex items-center gap-2 text-xs mb-1">
        <span class="min-w-6 text-gray-400">Z:</span>
        <Slider
          value={selectedMirror.center[2]}
          onValueChange={(v) => updateMirror(selectedMirror.id, { 
            center: [selectedMirror.center[0], selectedMirror.center[1], v] 
          })}
          min={-2}
          max={2}
          step={0.05}
          class="flex-1"
        />
        <span class="min-w-8 text-right font-mono text-green-300">{selectedMirror.center[2].toFixed(2)}</span>
      </div>

      <!-- Mirror Radius (not for planes) -->
      {#if selectedMirror.type !== 'plane'}
        <div class="flex items-center gap-2 text-xs mb-1 mt-2">
          <span class="min-w-12 text-gray-400">Radius:</span>
          <Slider
            value={selectedMirror.radius}
            onValueChange={(v) => updateMirror(selectedMirror.id, { radius: v })}
            min={0.1}
            max={3}
            step={0.05}
            class="flex-1"
          />
          <span class="min-w-8 text-right font-mono text-green-300">{selectedMirror.radius.toFixed(2)}</span>
        </div>
      {/if}

      <!-- Normal (for circle and plane modes) -->
      {#if selectedMirror.type === 'circle' || selectedMirror.type === 'plane'}
        <div class="text-xs text-gray-500 mb-1 mt-2">Normal</div>
        <div class="flex items-center gap-2 text-xs mb-1">
          <span class="min-w-6 text-gray-400">X:</span>
          <Slider
            value={selectedMirror.circleNormal[0]}
            onValueChange={(v) => updateMirror(selectedMirror.id, { 
              circleNormal: [v, selectedMirror.circleNormal[1], selectedMirror.circleNormal[2]] 
            })}
            min={-1}
            max={1}
            step={0.05}
            class="flex-1"
          />
          <span class="min-w-8 text-right font-mono text-green-300">{selectedMirror.circleNormal[0].toFixed(2)}</span>
        </div>
        <div class="flex items-center gap-2 text-xs mb-1">
          <span class="min-w-6 text-gray-400">Y:</span>
          <Slider
            value={selectedMirror.circleNormal[1]}
            onValueChange={(v) => updateMirror(selectedMirror.id, { 
              circleNormal: [selectedMirror.circleNormal[0], v, selectedMirror.circleNormal[2]] 
            })}
            min={-1}
            max={1}
            step={0.05}
            class="flex-1"
          />
          <span class="min-w-8 text-right font-mono text-green-300">{selectedMirror.circleNormal[1].toFixed(2)}</span>
        </div>
        <div class="flex items-center gap-2 text-xs mb-1">
          <span class="min-w-6 text-gray-400">Z:</span>
          <Slider
            value={selectedMirror.circleNormal[2]}
            onValueChange={(v) => updateMirror(selectedMirror.id, { 
              circleNormal: [selectedMirror.circleNormal[0], selectedMirror.circleNormal[1], v] 
            })}
            min={-1}
            max={1}
            step={0.05}
            class="flex-1"
          />
          <span class="min-w-8 text-right font-mono text-green-300">{selectedMirror.circleNormal[2].toFixed(2)}</span>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Reflection Count -->
  <div class="flex items-center gap-2 text-xs mb-1 mt-3">
    <span class="min-w-16 text-gray-400">Bounces:</span>
    <Slider
      value={config.reflectionCount}
      onValueChange={(v) => (config.reflectionCount = v)}
      min={0}
      max={10}
      step={1}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.reflectionCount}</span>
  </div>

  <!-- Exploration Controls -->
  <div class="text-xs text-gray-500 mb-1 mt-3">Exploration</div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.allowBacktracking} id="allowBacktracking" />
    <label for="allowBacktracking" class="cursor-pointer">Allow backtracking</label>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.colorByDepth} id="colorByDepth" />
    <label for="colorByDepth" class="cursor-pointer">Color by depth (vs. mirror mix)</label>
  </div>

  <!-- Highlight Path -->
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">Highlight:</span>
    <input
      type="text"
      bind:value={config.highlightPath}
      placeholder="e.g. PM1M2"
      class="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-xs text-green-300 font-mono"
    />
    {#if config.highlightPath}
      <button
        class="px-1 text-gray-400 hover:text-white"
        onclick={() => (config.highlightPath = '')}
      >×</button>
    {/if}
  </div>

  <!-- Display Options -->
  <div class="text-xs text-gray-500 mb-1 mt-3">Display</div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.showMirror} id="showMirror" />
    <label for="showMirror" class="cursor-pointer">Show mirrors</label>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.showConnector} id="showConnector" />
    <label for="showConnector" class="cursor-pointer">Show radial lines</label>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.showIntermediates} id="showIntermediates" />
    <label for="showIntermediates" class="cursor-pointer">Show intermediate images</label>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">Opacity:</span>
    <Slider
      value={config.mirrorOpacity}
      onValueChange={(v) => (config.mirrorOpacity = v)}
      min={0.1}
      max={1}
      step={0.05}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.mirrorOpacity.toFixed(2)}</span>
  </div>
</fieldset>
