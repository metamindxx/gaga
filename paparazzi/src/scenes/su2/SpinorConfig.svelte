<script lang="ts">
  /**
   * Spinor SU(2) Config Panel
   *
   * Displays the current complex number representation of the spinor points.
   * Reads from shared config module.
   */

  import { config, formatSpinorPoint } from './spinorState.svelte';
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Spinor SU(2)</legend>
  <div class="mb-2 p-1.5 bg-black/30 rounded text-xs font-mono">
    <div class="flex gap-2">
      <span class="text-gray-400">α:</span>
      <span class="text-green-300">{formatSpinorPoint(config.pt1)}</span>
    </div>
    <div class="flex gap-2">
      <span class="text-gray-400">β:</span>
      <span class="text-green-300">{formatSpinorPoint(config.pt2)}</span>
    </div>
  </div>
</fieldset>
