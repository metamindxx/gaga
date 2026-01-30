<script lang="ts">
  /**
   * Home Page - Overview of all GA demo scenes
   */
  import { getGroups, getScenesForGroup } from '$stores/sceneRegistry.svelte';
</script>

<svelte:head>
  <title>Paparazzi - Geometric Algebra Demos</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-sky-400 mb-2">Geometric Algebra Demos</h1>
    <p class="text-gray-400 mb-8">
      Interactive visualizations of Conformal Geometric Algebra (CGA) and Projective Geometric Algebra (PGA).
    </p>

    <div class="grid gap-6">
      {#each getGroups() as group}
        {@const scenes = getScenesForGroup(group.id)}
        <div class="bg-black/50 rounded-lg p-6 border border-gray-700">
          <h2 class="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <span class="text-2xl">{group.icon}</span>
            {group.name}
          </h2>

          <div class="grid gap-3 sm:grid-cols-2">
            {#each scenes as scene}
              <a
                href="/{group.id}/{scene.id}"
                class="block p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-md border border-gray-600 hover:border-sky-500 transition-colors no-underline"
              >
                <div class="flex items-center gap-3">
                  <span class="font-mono text-sm text-sky-400">#{scene.id}</span>
                  <span class="text-gray-200 font-medium">{scene.name}</span>
                </div>
              </a>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
