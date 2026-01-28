<script lang="ts">
  /**
   * LegConfig - Config panel for the Leg demo slide (slide 100)
   *
   * A thin wrapper that connects LegControls to legState.
   * Used when showing just the leg IK solver without stepping behavior.
   */
  import LegControls from './LegControls.svelte';
  import { config } from '../state/legState.svelte';
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Spidor Leg</legend>
  <LegControls {config} />
</fieldset>
