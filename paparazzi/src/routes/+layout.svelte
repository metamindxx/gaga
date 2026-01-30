<script lang="ts">
  /**
   * Root Layout - App shell with navigation sidebar
   */
  import '../app.css';
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';

  // Scene registry (import triggers all registrations)
  import '$scenes/index';
  import { getScene } from '$stores/sceneRegistry.svelte';
  import { theme, paused, resetKey } from '$stores/sceneControls.svelte';

  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // Local state
  let collapsed = $state(false);

  // Get current route info
  const currentSceneId = $derived(page.params?.sceneId ? parseInt(page.params.sceneId) : null);
  const currentScene = $derived(currentSceneId !== null ? getScene(currentSceneId) : null);
</script>

<div class="flex min-h-screen bg-slate-900">
  <!-- Sidebar only shown on scene pages -->
  {#if currentScene}
    <!-- Expand Button (shown when collapsed) -->
    {#if collapsed}
      <Button
        variant="secondary"
        size="sm"
        class="fixed top-2 left-2 w-8 h-8 p-0 z-50 bg-black/80 hover:bg-black/90"
        onclick={() => (collapsed = false)}
      >
        ☰
      </Button>
    {/if}

    <!-- Control Sidebar -->
    {#if !collapsed}
      <aside
        class="fixed top-0 left-0 h-screen w-72 bg-black/90 p-4 rounded-r-lg text-sm text-gray-200 font-sans overflow-y-auto z-50"
      >
        <!-- Navigation -->
        <div class="flex gap-2 mb-3 flex-wrap">
          <a
            href="/"
            class="flex-1 min-w-12 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-center text-gray-200 text-sm no-underline"
          >
            Home
          </a>
          <a
            href="/cayley"
            class="flex-1 min-w-12 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-center text-gray-200 text-sm no-underline"
          >
            Cayley
          </a>
        </div>
        <!-- Collapse toggle -->
        <Button
          variant="secondary"
          size="sm"
          class="w-6 h-6 p-0 absolute top-2 right-2"
          onclick={() => (collapsed = true)}
        >
          ✕
        </Button>

        <!-- Scene Controls -->
        <div class="flex gap-2 mb-3 flex-wrap">
          <Button variant="secondary" size="sm" class="flex-1 min-w-12" onclick={() => paused.toggle()}>
            {paused.current ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="secondary" size="sm" class="flex-1 min-w-12" onclick={() => resetKey.increment()}>
            Reset
          </Button>
          <Button variant="secondary" size="sm" class="flex-1 min-w-12" onclick={() => theme.toggle()}>
            {theme.current}
          </Button>
        </div>

        <!-- Config Panel -->
        {#if currentScene.ConfigPanel}
          <div class="mb-3">
            <h3 class="text-sm text-sky-400 mb-2">{currentScene.name} Config</h3>
            <currentScene.ConfigPanel />
          </div>
        {/if}
      </aside>
    {/if}
  {/if}

  <!-- Main Content Area -->
  <main class="flex-1" class:ml-72={currentScene && !collapsed}>
    {@render children()}
  </main>
</div>
