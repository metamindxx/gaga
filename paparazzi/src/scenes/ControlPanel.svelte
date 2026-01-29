<script lang="ts">
  /**
   * ControlPanel - Left sidebar for demo controls
   *
   * This component is completely scene-agnostic.
   * It reads from the scene registry to render:
   * - Scene visibility toggles (organized in accordion groups)
   * - Per-scene configuration panels (from registered ConfigPanel components)
   */

  import { Button } from '$lib/components/ui/button';
  import * as Accordion from '$lib/components/ui/accordion';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Checkbox } from '$lib/components/ui/checkbox';

  import {
    getGroups
    , getScenesForGroup
    , isVisible
    , toggleVisible
    , showOnly
    , showGroup
    , hideGroup
    , isGroupPartiallyVisible
    , isGroupFullyVisible
  } from '../stores/sceneRegistry.svelte';
  import { cgaBasisSet } from '../algebra/cga';
  import { pgaBasisSet } from '../algebra/pga';

  // ============================================================================
  // PROPS
  // ============================================================================

  interface Props {
    theme: 'light' | 'dark';
    paused: boolean;
    onTogglePause: () => void;
    onReset: () => void;
    onToggleTheme: () => void;
  }

  let { theme, paused, onTogglePause, onReset, onToggleTheme }: Props = $props();

  // ============================================================================
  // LOCAL STATE
  // ============================================================================

  let collapsed = $state(false);
  let accordionValue = $state<string[]>(['pga']);
  let showCayleyTable = $state(false);
  let cayleyTableAlgebra = $state<string>('cga');

  const cayleyTableAlgebras = [
    { id: 'cga', name: 'CGA (4,1)', basisSet: cgaBasisSet }
    , { id: 'pga', name: 'PGA (3,0,1)', basisSet: pgaBasisSet }
  ];
</script>

<!-- ========================================================================== -->
<!-- CONTROL PANEL                                                              -->
<!-- ========================================================================== -->

<div
  class="fixed top-2.5 left-2.5 bg-black/90 p-4 rounded-lg max-w-72 text-sm text-gray-200 font-sans max-h-[calc(100vh-20px)] overflow-y-auto"
  class:!p-2={collapsed}
  class:!min-w-0={collapsed}
>
  <!-- Collapse/Expand toggle -->
  <Button
    variant="secondary"
    size="sm"
    class="w-6 h-6 p-0 {collapsed ? 'static' : 'absolute top-2 right-2'}"
    onclick={() => (collapsed = !collapsed)}
  >
    {collapsed ? '▶' : '◀'}
  </Button>

  {#if !collapsed}
    <h1 class="text-lg m-0 mb-1 text-sky-400">Geometric Algebra Demos</h1>
    <!-- ================================================================ -->
    <!-- Global Action Buttons                                            -->
    <!-- ================================================================ -->

    <div class="flex gap-2 mb-3 flex-wrap">
      <Button variant="secondary" size="sm" class="flex-1 min-w-12" onclick={onTogglePause}>
        {paused ? 'Resume' : 'Pause'}
      </Button>
      <Button variant="secondary" size="sm" class="flex-1 min-w-12" onclick={onReset}>Reset</Button>
      <Button variant="secondary" size="sm" class="flex-1 min-w-12" onclick={onToggleTheme}>
        {theme}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        class="flex-1 min-w-12"
        onclick={() => (showCayleyTable = true)}
      >
        Cayley
      </Button>
    </div>

    <!-- ================================================================ -->
    <!-- Scene Visibility Toggles (Accordions) - From Registry            -->
    <!-- ================================================================ -->

    <Accordion.Root type="multiple" bind:value={accordionValue} class="flex flex-col gap-2">
      {#each getGroups() as group}
        {@const groupScenes = getScenesForGroup(group.id)}
        <Accordion.Item value={group.id} class="rounded-md overflow-hidden border border-gray-700">
          <div class="flex items-center gap-2 px-3 py-2 bg-gray-800">
            <Accordion.Trigger
              class="flex items-center gap-2 flex-1 bg-transparent border-none text-left cursor-pointer p-0 [&[data-state=open]>span:first-child]:rotate-90"
            >
              <span class="text-gray-400 text-xs w-4 transition-transform">▶</span>
              <span class="text-sm">{group.icon}</span>
              <span class="flex-1 text-sm text-gray-200 font-medium">
                {group.name}
              </span>
            </Accordion.Trigger>

            <span
              class="w-2 h-2 rounded-full"
              class:bg-green-400={isGroupFullyVisible(group.id)}
              class:bg-yellow-400={isGroupPartiallyVisible(group.id) &&
                !isGroupFullyVisible(group.id)}
              class:bg-gray-600={!isGroupPartiallyVisible(group.id)}
            ></span>

            <Button
              variant="ghost"
              size="sm"
              class="px-1.5 py-0.5 h-auto text-[10px]"
              onclick={() => showGroup(group.id)}
            >
              all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="px-1.5 py-0.5 h-auto text-[10px]"
              onclick={() => hideGroup(group.id)}
            >
              none
            </Button>
          </div>

          <Accordion.Content class="flex flex-col gap-1 p-2 bg-black/30">
            {#each groupScenes as scene}
              <div>
                <label
                  class="flex items-center gap-2 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={isVisible(scene.id)}
                    onCheckedChange={() => toggleVisible(scene.id)}
                  />
                  <span class="font-mono text-xs text-sky-400 min-w-7">#{scene.id}</span>
                  <span class="flex-1 text-xs">{scene.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="px-1.5 py-0.5 h-auto text-[10px]"
                    onclick={() => showOnly(scene.id)}
                  >
                    solo
                  </Button>
                </label>
                {#if isVisible(scene.id) && scene.ConfigPanel}
                  <div class="ml-6 mt-1">
                    <scene.ConfigPanel />
                  </div>
                {/if}
              </div>
            {/each}
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
  {/if}
</div>

<!-- ========================================================================== -->
<!-- CAYLEY TABLE MODAL                                                         -->
<!-- ========================================================================== -->

<Dialog.Root bind:open={showCayleyTable}>
  <Dialog.Content
    class="max-w-[100vw] max-h-[100vh] bg-black/95 border-2 border-sky-400 p-0 gap-0 flex flex-col overflow-hidden"
  >
    <Dialog.Header
      class="flex flex-row justify-between items-center px-4 py-3 border-b border-gray-700 bg-black/80 gap-4 shrink-0"
    >
      <Dialog.Title class="text-base text-sky-400">Cayley Table</Dialog.Title>

      <div class="flex gap-3 flex-1 justify-center">
        {#each cayleyTableAlgebras as algebraOption}
          <label
            class="flex items-center gap-1 text-gray-300 text-xs cursor-pointer"
            class:!text-sky-400={cayleyTableAlgebra === algebraOption.id}
          >
            <input
              type="radio"
              name="algebra"
              value={algebraOption.id}
              checked={cayleyTableAlgebra === algebraOption.id}
              onchange={() => (cayleyTableAlgebra = algebraOption.id)}
              class="cursor-pointer"
            />
            {algebraOption.name}
          </label>
        {/each}
      </div>
    </Dialog.Header>

    <div
      class="p-4 overflow-auto flex-1 min-h-0 text-gray-200 font-mono text-xs [&_table]:border-collapse [&_table]:mx-auto [&_td]:border [&_td]:border-gray-600 [&_td]:px-2 [&_td]:py-1 [&_td]:text-center [&_th]:border [&_th]:border-gray-600 [&_th]:px-2 [&_th]:py-1 [&_th]:text-center [&_th]:bg-gray-800 [&_th]:text-sky-400 [&_th]:font-bold"
    >
      {@html cayleyTableAlgebras.find((a) => a.id === cayleyTableAlgebra)?.basisSet.cayleyHtml()}
    </div>
  </Dialog.Content>
</Dialog.Root>
