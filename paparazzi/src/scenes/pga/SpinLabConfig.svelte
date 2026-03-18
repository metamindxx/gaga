<script lang="ts">
  import { Slider } from '$lib/components/ui/slider';
  import { config } from './spinLabState.svelte';
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <div class="text-[10px] text-gray-500 mb-1.5">Velocity (m/s)</div>

  <!-- vx (e₀₁) -->
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">vx (e₀₁):</span>
    <Slider
      value={config.vx}
      onValueChange={(v) => (config.vx = v)}
      min={-10}
      max={10}
      step={0.1}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.vx.toFixed(1)}</span>
  </div>

  <!-- vy (e₀₂) -->
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">vy (e₀₂):</span>
    <Slider
      value={config.vy}
      onValueChange={(v) => (config.vy = v)}
      min={-10}
      max={10}
      step={0.1}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.vy.toFixed(1)}</span>
  </div>

  <!-- vz (e₀₃) -->
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">vz (e₀₃):</span>
    <Slider
      value={config.vz}
      onValueChange={(v) => (config.vz = v)}
      min={-10}
      max={10}
      step={0.1}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.vz.toFixed(1)}</span>
  </div>

  <div class="text-[10px] text-gray-500 mt-2 mb-1.5">Spin (rad/s)</div>

  <!-- ωx (e₂₃ — sidespin) -->
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">ωx (e₂₃):</span>
    <Slider
      value={config.wx}
      onValueChange={(v) => (config.wx = v)}
      min={-200}
      max={200}
      step={1}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.wx.toFixed(0)}</span>
  </div>

  <!-- ωy (e₁₃ — English) -->
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">ωy (e₁₃):</span>
    <Slider
      value={config.wy}
      onValueChange={(v) => (config.wy = v)}
      min={-200}
      max={200}
      step={1}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.wy.toFixed(0)}</span>
  </div>

  <!-- ωz (e₁₂ — topspin/backspin) -->
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">ωz (e₁₂):</span>
    <Slider
      value={config.wz}
      onValueChange={(v) => (config.wz = v)}
      min={-200}
      max={200}
      step={1}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.wz.toFixed(0)}</span>
  </div>

  <div class="text-[10px] text-gray-500 mt-2 mb-1.5">Setup</div>

  <!-- Drop height -->
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">Height:</span>
    <Slider
      value={config.dropHeight}
      onValueChange={(v) => (config.dropHeight = v)}
      min={0.03}
      max={2}
      step={0.01}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{config.dropHeight.toFixed(2)}m</span
    >
  </div>

  <!-- Physics substeps per frame -->
  <div class="flex items-center gap-2 text-xs mb-1">
    <span class="min-w-16 text-gray-400">Steps/frame:</span>
    <Slider
      value={config.stepsPerFrame}
      onValueChange={(v) => (config.stepsPerFrame = Math.round(v))}
      min={1}
      max={16}
      step={1}
      class="flex-1"
    />
    <span class="min-w-10 text-right font-mono text-green-300">{Math.round(config.stepsPerFrame)}</span>
  </div>

  <div class="text-[10px] text-gray-500 mt-1">Set velocity + spin, then launch.</div>

  <div class="flex gap-2 mt-2">
    <button
      class="flex-1 text-xs px-2 py-1.5 rounded bg-sky-500 text-white hover:bg-sky-400"
      onclick={() => window.dispatchEvent(new CustomEvent('spinlab-drop'))}
    >
      Launch
    </button>
    <button
      class="flex-1 text-xs px-2 py-1.5 rounded bg-gray-600 text-white hover:bg-gray-500"
      onclick={() => window.dispatchEvent(new CustomEvent('spinlab-reset'))}
    >
      Reset
    </button>
  </div>
</fieldset>
