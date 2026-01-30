<script lang="ts">
  /**
   * Cayley Table Page - Interactive multiplication tables for geometric algebras
   */
  import { Button } from '$lib/components/ui/button';
  import { cgaBasisSet } from '$algebra/cga';
  import { pgaBasisSet } from '$algebra/pga';

  let selectedAlgebra = $state<string>('cga');

  const algebras = [
    { id: 'cga', name: 'CGA (4,1)', basisSet: cgaBasisSet }
    , { id: 'pga', name: 'PGA (3,0,1)', basisSet: pgaBasisSet }
  ];

  const currentAlgebra = $derived(algebras.find((a) => a.id === selectedAlgebra)!);
</script>

<svelte:head>
  <title>Cayley Table - {currentAlgebra.name}</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 p-8">
  <div class="max-w-full mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-sky-400">Cayley Table</h1>
      
      <!-- Algebra Selector -->
      <div class="flex gap-2">
        {#each algebras as algebra}
          <Button
            variant={selectedAlgebra === algebra.id ? 'default' : 'secondary'}
            size="sm"
            onclick={() => (selectedAlgebra = algebra.id)}
            class={selectedAlgebra === algebra.id ? 'bg-sky-600 hover:bg-sky-700' : ''}
          >
            {algebra.name}
          </Button>
        {/each}
      </div>
    </div>

    <!-- Info -->
    <p class="text-gray-400 mb-6">
      The Cayley table shows the geometric product of all basis elements.
      Rows are left operands, columns are right operands.
    </p>

    <!-- Table -->
    <div
      class="overflow-auto bg-black/50 rounded-lg p-4 text-gray-200 font-mono text-sm
        [&_table]:border-collapse [&_table]:mx-auto
        [&_td]:border [&_td]:border-gray-600 [&_td]:px-3 [&_td]:py-2 [&_td]:text-center
        [&_th]:border [&_th]:border-gray-600 [&_th]:px-3 [&_th]:py-2 [&_th]:text-center [&_th]:bg-gray-800 [&_th]:text-sky-400 [&_th]:font-bold
        [&_tr:hover_td]:bg-gray-800/50"
    >
      {@html currentAlgebra.basisSet.cayleyHtml()}
    </div>
  </div>
</div>
