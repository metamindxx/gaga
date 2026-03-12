<script lang="ts">
  import { config } from './newtonsCradleState.svelte';
</script>

<fieldset class="p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
  <legend class="text-xs text-sky-400 px-1">Newton's Cradle</legend>

  <div class="text-xs text-gray-400 mb-1">Collision Model:</div>
  <div class="flex gap-1">
    <button
      class="flex-1 text-xs px-2 py-1 rounded {config.collisionModel === 'impulse'
        ? 'bg-sky-500 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
      onclick={() => (config.collisionModel = 'impulse')}
    >
      Impulse
    </button>
    <button
      class="flex-1 text-xs px-2 py-1 rounded {config.collisionModel === 'spring'
        ? 'bg-sky-500 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
      onclick={() => (config.collisionModel = 'spring')}
    >
      Spring
    </button>
  </div>
  <div class="text-[10px] text-gray-500 mt-1">
    {config.collisionModel === 'impulse'
      ? 'Elastic velocity swap (correct 1-in-1-out behavior)'
      : 'Penalty spring (momentum smears across the chain)'}
  </div>
</fieldset>
