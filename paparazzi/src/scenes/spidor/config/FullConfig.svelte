<script lang="ts">
  /**
   * FullConfig - Config panel for the Full spider demo slide (slide 103)
   *
   * Composes both LegControls and StepControls since the full spider
   * combines leg IK with stepping behavior. Also adds a visibility toggle.
   *
   * This demonstrates why Controls are separate from Config panels -
   * we can mix and match reusable control groups as needed.
   */
  import { Checkbox } from '$lib/components/ui/checkbox';
  import LegControls from './LegControls.svelte';
  import StepControls from './StepControls.svelte';
  import { config } from '../state/fullState.svelte';
  import { stepConfig } from '../state/stepConfig.svelte';
</script>

<!-- Leg Config -->
<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Spidor Full (Legs)</legend>
  <div class="flex items-center gap-2 text-xs mb-1">
    <Checkbox bind:checked={config.showVisualization} id="showViz" />
    <label for="showViz" class="cursor-pointer">Show targets/feet</label>
  </div>
  <LegControls {config} />
</fieldset>

<!-- Step Config (shared) -->
<fieldset class="mt-3 p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Spidor Stepping</legend>
  <StepControls config={stepConfig} />
</fieldset>
