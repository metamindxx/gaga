<script lang="ts">
  /**
   * MeshCgaConfig - the control panel for the Mesh to CGA demo
   */
  import { Slider } from '$lib/components/ui/slider';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { config, loadFile } from './meshCgaState.svelte';

  async function onFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) await loadFile(file);
  }
</script>

<fieldset class="p-2.5 bg-cyan-500/10 border border-cyan-400 rounded-md">
  <legend class="text-xs text-cyan-400 px-1">Mesh to CGA Points</legend>

  <!-- File selector -->
  <div class="flex flex-col gap-1 text-xs mb-3">
    <span class="text-gray-400">Model file (.glb / .gltf):</span>
    <input
      type="file"
      accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
      onchange={onFileChange}
      class="text-xs text-gray-300 file:mr-2 file:px-2 file:py-0.5 file:rounded file:border-0 file:bg-cyan-500 file:text-white file:text-xs hover:file:bg-cyan-400"
    />
    {#if config.fileName}
      <span class="font-mono text-green-300">{config.fileName}</span>
    {/if}
  </div>

  <!-- Fit size -->
  <div class="flex items-center gap-2 text-xs mb-2">
    <span class="min-w-16 text-gray-400">Fit size:</span>
    <Slider
      value={config.fitSize}
      onValueChange={(v) => (config.fitSize = v)}
      min={0.5}
      max={5}
      step={0.1}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.fitSize.toFixed(1)}</span>
  </div>

  <!-- Max points -->
  <div class="flex items-center gap-2 text-xs mb-2">
    <span class="min-w-16 text-gray-400">Max pts:</span>
    <Slider
      value={config.maxPoints}
      onValueChange={(v) => (config.maxPoints = Math.round(v))}
      min={100}
      max={10000}
      step={100}
      class="flex-1"
    />
    <span class="min-w-12 text-right font-mono text-green-300">{config.maxPoints}</span>
  </div>

  <!-- Point size -->
  <div class="flex items-center gap-2 text-xs mb-2">
    <span class="min-w-16 text-gray-400">Pt size:</span>
    <Slider
      value={config.pointSize}
      onValueChange={(v) => (config.pointSize = v)}
      min={0.005}
      max={0.1}
      step={0.005}
      class="flex-1"
    />
    <span class="min-w-12 text-right font-mono text-green-300">{config.pointSize.toFixed(3)}</span>
  </div>

  <!-- Toggles -->
  <div class="flex items-center gap-2 text-xs mb-1.5 mt-3">
    <Checkbox checked={config.showPoints} onCheckedChange={(v) => (config.showPoints = !!v)} />
    <span class="text-gray-300">Show CGA points</span>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1.5">
    <Checkbox
      checked={config.showWireframe}
      onCheckedChange={(v) => (config.showWireframe = !!v)}
    />
    <span class="text-gray-300">Show wireframe</span>
  </div>
  <div class="flex items-center gap-2 text-xs mb-1.5">
    <Checkbox checked={config.showStats} onCheckedChange={(v) => (config.showStats = !!v)} />
    <span class="text-gray-300">Show stats</span>
  </div>

  <!-- ================================================================== -->
  <!-- CUTTING PLANE - (CGA IPNS plane)                                   -->
  <!-- ================================================================== -->
  <div class="mt-3 pt-2 border-t border-gray-700">
    <div class="text-xs text-cyan-300 mb-1.5">Cutting plane (Π = n̂ + d·n∞)</div>

    <div class="flex items-center gap-2 text-xs mb-1.5">
      <Checkbox checked={config.showPlane} onCheckedChange={(v) => (config.showPlane = !!v)} />
      <span class="text-gray-300">Show plane</span>
    </div>
    <div class="flex items-center gap-2 text-xs mb-2">
      <Checkbox checked={config.colorBySide} onCheckedChange={(v) => (config.colorBySide = !!v)} />
      <span class="text-gray-300">Color points by side</span>
    </div>
    <div class="flex items-center gap-2 text-xs mb-2">
      <Checkbox checked={config.showContour} onCheckedChange={(v) => (config.showContour = !!v)} />
      <span class="text-gray-300">Show intersection contour</span>
    </div>

    <!-- Which way the plane faces -->
    {#each [{ k: 'nx', label: 'n·x' }, { k: 'ny', label: 'n·y' }, { k: 'nz', label: 'n·z' }] as axis}
      <div class="flex items-center gap-2 text-xs mb-2">
        <span class="min-w-16 text-gray-400">{axis.label}:</span>
        <Slider
          value={config.plane[axis.k as 'nx' | 'ny' | 'nz']}
          onValueChange={(v) => (config.plane[axis.k as 'nx' | 'ny' | 'nz'] = v)}
          min={-1}
          max={1}
          step={0.05}
          class="flex-1"
        />
        <span class="min-w-12 text-right font-mono text-green-300"
          >{config.plane[axis.k as 'nx' | 'ny' | 'nz'].toFixed(2)}</span
        >
      </div>
    {/each}

    <!-- How far the plane is pushed off the origin -->
    <div class="flex items-center gap-2 text-xs mb-2">
      <span class="min-w-16 text-gray-400">distance:</span>
      <Slider
        value={config.plane.distance}
        onValueChange={(v) => (config.plane.distance = v)}
        min={-2}
        max={2}
        step={0.02}
        class="flex-1"
      />
      <span class="min-w-12 text-right font-mono text-green-300"
        >{config.plane.distance.toFixed(2)}</span
      >
    </div>

    <!-- Plane opacity -->
    <div class="flex items-center gap-2 text-xs mb-1">
      <span class="min-w-16 text-gray-400">opacity:</span>
      <Slider
        value={config.planeOpacity}
        onValueChange={(v) => (config.planeOpacity = v)}
        min={0}
        max={1}
        step={0.05}
        class="flex-1"
      />
      <span class="min-w-12 text-right font-mono text-green-300"
        >{config.planeOpacity.toFixed(2)}</span
      >
    </div>
  </div>

  <!-- Stats readout -->
  {#if config.showStats}
    <div class="mt-3 pt-2 border-t border-gray-700 text-xs font-mono text-gray-400 space-y-0.5">
      {#if config.stats.loading}
        <div class="text-yellow-300">Loading…</div>
      {:else if config.stats.error}
        <div class="text-red-400">Error: {config.stats.error}</div>
      {:else}
        <div>Total vertices: <span class="text-green-300">{config.stats.totalVertices}</span></div>
        <div>CGA points: <span class="text-green-300">{config.stats.cgaPoints}</span></div>
        {#if config.colorBySide}
          <div>
            Side split:
            <span style="color:#ff5555">{config.stats.posCount}</span>
            /
            <span style="color:#55aaff">{config.stats.negCount}</span>
          </div>
        {/if}
        {#if config.showContour}
          <div>
            Contour segments:
            <span class="text-green-300">{config.stats.contourSegments}</span>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</fieldset>
