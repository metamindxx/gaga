<script lang="ts">
  /**
   * FeetConfig - Config panel for the Feet demo slide (slide 102)
   *
   * A wrapper that connects StepControls to stepConfig.
   * Used when showing the multi-foot stepping coordination without leg IK.
   */
  import StepControls from './StepControls.svelte';
  import { stepConfig } from '../state/stepConfig.svelte';
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Spidor Stepping</legend>
  <StepControls config={stepConfig} />
</fieldset>
