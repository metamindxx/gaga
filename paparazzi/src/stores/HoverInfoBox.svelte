<script lang="ts">
  /**
   * HoverInfoBox.svelte
   *
   * Displays hover information for scene objects with:
   *   - Object label and type
   *   - Multivector string representation
   *   - Custom properties
   *   - Editable fields (when pinned)
   *   - Action buttons (when pinned)
   */

  import { hover, unpinHoverInfo } from './hoverInfo.svelte';
</script>

{#if hover.info}
  <div
    class="fixed bottom-2.5 right-2.5 bg-black/90 p-3 rounded-lg min-w-52 max-w-80 text-sm text-gray-200 font-sans border border-sky-400"
    class:!border-orange-400={hover.isPinned}
  >
    {#if hover.isPinned}
      <button
        class="absolute top-1 right-2 bg-transparent border-none text-gray-500 hover:text-white text-lg cursor-pointer"
        onclick={unpinHoverInfo}
      >
        ×
      </button>
    {/if}

    <div class="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-700">
      {#if hover.info.label}
        <span class="font-bold text-sky-400 text-sm">{hover.info.label}</span>
      {/if}
      <span
        class="text-sky-300 text-[11px] uppercase tracking-wide bg-sky-400/15 px-1.5 py-0.5 rounded"
      >
        {hover.info.type}
      </span>
    </div>

    {#if hover.info.mvString}
      <div class="font-mono text-[11px] text-gray-400 break-all mb-2 p-1.5 bg-white/5 rounded">
        {hover.info.mvString}
      </div>
    {/if}

    {#if hover.info.properties}
      <div class="flex flex-col gap-0.5">
        {#each Object.entries(hover.info.properties) as [propertyKey, propertyValue]}
          <div class="flex gap-1.5 text-xs">
            <span class="text-gray-500">{propertyKey}:</span>
            <span class="text-green-300 font-mono">{propertyValue}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if hover.isPinned && hover.info.editableFields?.length}
      <div class="mt-2.5 pt-2.5 border-t border-gray-700 flex flex-col gap-2">
        {#each hover.info.editableFields as field}
          <div class="flex items-center gap-2">
            <span class="text-sky-300 text-[11px] min-w-10">
              {field.label ?? field.key}
            </span>
            <input
              type="range"
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
              value={field.value}
              min={field.min ?? -3.14159}
              max={field.max ?? 3.14159}
              step={field.step ?? 0.01}
              oninput={(e) => field.onChange(parseFloat(e.currentTarget.value))}
            />
            <input
              type="number"
              class="w-14 px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-green-300 font-mono text-[11px] text-right focus:outline-none focus:border-sky-400"
              value={field.value.toFixed(3)}
              step={field.step ?? 0.01}
              oninput={(e) => field.onChange(parseFloat(e.currentTarget.value) || 0)}
            />
          </div>
        {/each}
      </div>
    {/if}

    {#if hover.isPinned && hover.info.actions?.length}
      <div class="mt-2 flex gap-1.5 flex-wrap">
        {#each hover.info.actions as action}
          <button
            class="px-2.5 py-1 bg-indigo-900 border border-indigo-700 rounded text-white text-[11px] cursor-pointer hover:bg-indigo-700"
            onclick={action.onClick}
          >
            {action.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}
