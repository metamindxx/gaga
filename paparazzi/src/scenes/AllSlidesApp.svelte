<script lang="ts">
  /**
   * AllSlidesApp - All refactored slides in one Threlte canvas with toggles
   */

  import { Canvas, T } from '@threlte/core';
  import Slide20Refactored from './Slide20Refactored.svelte';
  import Slide22Refactored from './Slide22Refactored.svelte';
  import Slide24Refactored from './Slide24Refactored.svelte';
  import Slide28Refactored from './Slide28Refactored.svelte';
  import Slide30Refactored from './Slide30Refactored.svelte';
  import Slide35Refactored from './Slide35Refactored.svelte';
  import Slide38Refactored from './Slide38Refactored.svelte';
  import PgaDemo from './PgaDemo.svelte';
  import { Grid, OrbitControls, Gizmo } from '@threlte/extras';
  import { hoverInfo, unpinHoverInfo, isPinned } from '../stores/hoverInfo';
  import { orbitEnabled } from '../stores/orbitControl';
  import { cgaBasisSet } from '../algebra/cga';
  import { pgaBasisSet } from '../algebra/pga';

  // Theme: default to light unless env var or localStorage says dark
  type ThemeEnvMeta = ImportMeta & {
    env?: {
      VITE_THEME?: string;
    };
  };

  const getInitialTheme = (): 'light' | 'dark' => {
    // Check env var (set VITE_THEME=dark in .env)
    if ((import.meta as ThemeEnvMeta).env?.VITE_THEME === 'dark') return 'dark';
    return 'light';
  };

  let theme = $state<'light' | 'dark'>(getInitialTheme());

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
  }

  // Theme-dependent colors
  const bgColor = $derived(theme === 'light' ? '#f0f0f5' : '#1a1a2e');
  const gridCellColor = $derived(theme === 'light' ? '#ccccdd' : '#444466');
  const gridSectionColor = $derived(theme === 'light' ? '#aaaacc' : '#333344');

  // Toggle states for each slide
  let showSlide20 = $state(true);
  let showSlide22 = $state(false);
  let showSlide24 = $state(false);
  let showSlide28 = $state(false);
  let showSlide30 = $state(false);
  let showSlide35 = $state(false);
  let showSlide38 = $state(false);
  let showPgaDemo = $state(false);
  let showCayley = $state(false);

  // Available algebras for Cayley table viewer
  const algebras = [
    { id: 'cga', name: 'CGA (4,1)', basisSet: cgaBasisSet },
    { id: 'pga', name: 'PGA (3,0,1)', basisSet: pgaBasisSet }
  ];
  let selectedAlgebra = $state('cga');

  const slides = [
    {
      id: 20
      , name: 'Robot Arm FK (3D)'
      , get show() {
        return showSlide20;
      }
      , set show(v) {
        showSlide20 = v;
      }
    }
    , {
      id: 22
      , name: 'Robot Arm FK (CGA)'
      , get show() {
        return showSlide22;
      }
      , set show(v) {
        showSlide22 = v;
      }
    }
    , {
      id: 24
      , name: 'Robot Arm IK'
      , get show() {
        return showSlide24;
      }
      , set show(v) {
        showSlide24 = v;
      }
    }
    , {
      id: 28
      , name: 'Agile Eye 2-DOF'
      , get show() {
        return showSlide28;
      }
      , set show(v) {
        showSlide28 = v;
      }
    }
    , {
      id: 30
      , name: 'Agile Eye 3-DOF'
      , get show() {
        return showSlide30;
      }
      , set show(v) {
        showSlide30 = v;
      }
    }
    , {
      id: 35
      , name: 'Delta Robot FK'
      , get show() {
        return showSlide35;
      }
      , set show(v) {
        showSlide35 = v;
      }
    }
    , {
      id: 38
      , name: 'Delta Robot IK'
      , get show() {
        return showSlide38;
      }
      , set show(v) {
        showSlide38 = v;
      }
    }
    , {
      id: 99
      , name: 'PGA Demo'
      , get show() {
        return showPgaDemo;
      }
      , set show(v) {
        showPgaDemo = v;
      }
    }
  ];

  function showOnly(id: number) {
    showSlide20 = id === 20;
    showSlide22 = id === 22;
    showSlide24 = id === 24;
    showSlide28 = id === 28;
    showSlide30 = id === 30;
    showSlide35 = id === 35;
    showSlide38 = id === 38;
    showPgaDemo = id === 99;
  }

  function showAll() {
    showSlide20 = true;
    showSlide22 = true;
    showSlide24 = true;
    showSlide28 = true;
    showSlide30 = true;
    showSlide35 = true;
    showSlide38 = true;
    showPgaDemo = true;
  }

  function hideAll() {
    showSlide20 = false;
    showSlide22 = false;
    showSlide24 = false;
    showSlide28 = false;
    showSlide30 = false;
    showSlide35 = false;
    showSlide38 = false;
    showPgaDemo = false;
  }
</script>

<div class="container">
  <Canvas>
    <!-- Scene background color -->
    <T.Color args={[bgColor]} attach="background" />

    <!-- Camera -->
    <T.PerspectiveCamera makeDefault position={[3, 2, 4]} fov={60}>
      <OrbitControls target={[0, 0.5, 0]} enabled={$orbitEnabled}>
        <Gizmo
          type="cube"
          placement="bottom-left"
          size={80}
          x={{ color: '#ff4444', label: 'X' }}
          y={{ color: '#44ff44', label: 'Y' }}
          z={{ color: '#4444ff', label: 'Z' }}
          nx={{ color: '#994444', label: '-X' }}
          ny={{ color: '#449944', label: '-Y' }}
          nz={{ color: '#444499', label: '-Z' }}
        />
      </OrbitControls>
    </T.PerspectiveCamera>

    <!-- Lighting -->
    <T.AmbientLight intensity={0.4} />
    <T.DirectionalLight position={[5, 10, 5]} intensity={0.8} />

    <!-- Grid -->
    <Grid cellColor={gridCellColor} sectionColor={gridSectionColor} fadeDistance={10} />

    <!-- Axes -->
    <T.AxesHelper
      args={[1]}
      oncreate={(ref) => {
        ref.setColors('#ff0000', '#00ff00', '#0000ff');
      }}
    />

    <!-- Invisible background plane for click-away deselection -->
    <T.Mesh position={[0, 0, -10]} onclick={unpinHoverInfo}>
      <T.PlaneGeometry args={[100, 100]} />
      <T.MeshBasicMaterial visible={false} />
    </T.Mesh>

    {#if showSlide20}
      <Slide20Refactored />
    {/if}
    {#if showSlide22}
      <Slide22Refactored />
    {/if}
    {#if showSlide24}
      <Slide24Refactored />
    {/if}
    {#if showSlide28}
      <Slide28Refactored />
    {/if}
    {#if showSlide30}
      <Slide30Refactored />
    {/if}
    {#if showSlide35}
      <Slide35Refactored />
    {/if}
    {#if showSlide38}
      <Slide38Refactored />
    {/if}
    {#if showPgaDemo}
      <PgaDemo />
    {/if}
  </Canvas>

  <div class="controls">
    <h1>Geometric Algebra Demos</h1>
    <p class="subtitle">CGA & PGA with algebra-renderer decoupling</p>

    <div class="button-row">
      <button onclick={showAll}>Show All</button>
      <button onclick={hideAll}>Hide All</button>
      <button onclick={toggleTheme}>{theme}</button>
      <button onclick={() => (showCayley = !showCayley)}>Cayley</button>
    </div>

    <div class="toggles">
      {#each slides as slide}
        <label class="toggle">
          <input type="checkbox" bind:checked={slide.show} />
          <span class="slide-id">#{slide.id}</span>
          <span class="slide-name">{slide.name}</span>
          <button class="solo-btn" onclick={() => showOnly(slide.id)}>solo</button>
        </label>
      {/each}
    </div>

    <div class="legend">
      <h2>Controls</h2>
      <p>
        Drag red points (IK demos)<br />
        Drag background to orbit<br />
        Scroll to zoom
      </p>
    </div>

    <div class="architecture">
      <h2>Architecture</h2>
      <p><code>$state(MV)</code> → <code>$derived(coords)</code> → render</p>
    </div>
  </div>

  {#if $hoverInfo}
    <div class="infobox" class:pinned={$isPinned}>
      {#if $isPinned}
        <button class="infobox-close" onclick={unpinHoverInfo}>×</button>
      {/if}
      <div class="infobox-header">
        {#if $hoverInfo.label}
          <span class="infobox-label">{$hoverInfo.label}</span>
        {/if}
        <span class="infobox-type">{$hoverInfo.type}</span>
      </div>
      {#if $hoverInfo.mvString}
        <div class="infobox-mv">{$hoverInfo.mvString}</div>
      {/if}
      {#if $hoverInfo.properties}
        <div class="infobox-props">
          {#each Object.entries($hoverInfo.properties) as [key, value]}
            <div class="infobox-prop">
              <span class="prop-key">{key}:</span>
              <span class="prop-value">{value}</span>
            </div>
          {/each}
        </div>
      {/if}
      {#if $isPinned && $hoverInfo.editableFields && $hoverInfo.editableFields.length > 0}
        <div class="infobox-editors">
          {#each $hoverInfo.editableFields as field, i}
            <div class="infobox-editor">
              <span class="editor-label">{field.label ?? field.key}</span>
              <input
                type="range"
                class="editor-slider"
                id="editor-slider-{i}"
                value={field.value}
                min={field.min ?? -3.14159}
                max={field.max ?? 3.14159}
                step={field.step ?? 0.01}
                oninput={(e) => field.onChange(parseFloat(e.currentTarget.value))}
              />
              <input
                type="number"
                class="editor-number"
                value={field.value.toFixed(3)}
                step={field.step ?? 0.01}
                oninput={(e) => field.onChange(parseFloat(e.currentTarget.value) || 0)}
              />
            </div>
          {/each}
        </div>
      {/if}
      {#if $isPinned && $hoverInfo.actions && $hoverInfo.actions.length > 0}
        <div class="infobox-actions">
          {#each $hoverInfo.actions as action}
            <button class="action-btn" onclick={action.onClick}>{action.label}</button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  {#if showCayley}
    <div class="cayley-overlay">
      <div class="cayley-header">
        <h3>Cayley Table</h3>
        <div class="cayley-algebra-selector">
          {#each algebras as algebra}
            <label class="algebra-radio">
              <input
                type="radio"
                name="algebra"
                value={algebra.id}
                checked={selectedAlgebra === algebra.id}
                onchange={() => (selectedAlgebra = algebra.id)}
              />
              {algebra.name}
            </label>
          {/each}
        </div>
        <button class="cayley-close" onclick={() => (showCayley = false)}>×</button>
      </div>
      <div class="cayley-content">
        {@html algebras.find((a) => a.id === selectedAlgebra)?.basisSet.cayleyHtml()}
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    width: 100vw;
    height: 100vh;
    background: #1a1a2e;
  }

  .controls {
    position: fixed;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.9);
    padding: 15px 20px;
    border-radius: 8px;
    max-width: 280px;
    font-size: 14px;
    line-height: 1.5;
    color: #eee;
    font-family: system-ui, sans-serif;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }

  .controls h1 {
    font-size: 18px;
    margin: 0 0 4px 0;
    color: #4af;
  }

  .controls h2 {
    font-size: 13px;
    margin: 12px 0 4px 0;
    color: #8cf;
  }

  .subtitle {
    font-size: 11px;
    color: #888;
    margin: 0 0 12px 0;
  }

  .button-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .button-row button {
    flex: 1;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    background: #335;
    color: #fff;
    cursor: pointer;
    font-size: 12px;
  }

  .button-row button:hover {
    background: #447;
  }

  .toggles {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    cursor: pointer;
  }

  .toggle:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .toggle input {
    margin: 0;
    cursor: pointer;
  }

  .slide-id {
    font-family: monospace;
    font-size: 11px;
    color: #4af;
    min-width: 28px;
  }

  .slide-name {
    flex: 1;
    font-size: 12px;
  }

  .solo-btn {
    padding: 2px 6px;
    border: none;
    border-radius: 3px;
    background: #445;
    color: #aaa;
    cursor: pointer;
    font-size: 10px;
  }

  .solo-btn:hover {
    background: #556;
    color: #fff;
  }

  .legend,
  .architecture {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #333;
  }

  .legend p,
  .architecture p {
    margin: 4px 0;
    font-size: 12px;
    color: #aaa;
  }

  .architecture code {
    background: rgba(255, 255, 170, 0.1);
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 11px;
    color: #ffa;
  }

  /* Hover infobox - bottom right */
  .infobox {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    padding: 12px 16px;
    border-radius: 8px;
    min-width: 200px;
    max-width: 350px;
    font-size: 13px;
    line-height: 1.4;
    color: #eee;
    font-family: system-ui, sans-serif;
    border: 1px solid #4af;
  }

  .infobox-close {
    position: absolute;
    top: 4px;
    right: 8px;
    background: none;
    border: none;
    color: #888;
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  }

  .infobox-close:hover {
    color: #fff;
  }

  .infobox.pinned {
    border-color: #f84;
  }

  .pin-indicator {
    margin-left: auto;
    font-size: 12px;
  }

  .infobox-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #333;
  }

  .infobox-label {
    font-weight: bold;
    color: #4af;
    font-size: 14px;
  }

  .infobox-type {
    color: #8cf;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: rgba(136, 204, 255, 0.15);
    padding: 2px 6px;
    border-radius: 3px;
  }

  .infobox-mv {
    font-family: monospace;
    font-size: 11px;
    color: #aaa;
    word-break: break-all;
    margin-bottom: 8px;
    padding: 4px 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .infobox-props {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .infobox-prop {
    display: flex;
    gap: 6px;
    font-size: 12px;
  }

  .prop-key {
    color: #888;
  }

  .prop-value {
    color: #cfc;
    font-family: monospace;
  }

  /* Editor controls */
  .infobox-editors {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #333;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .infobox-editor {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .editor-label {
    color: #8cf;
    font-size: 11px;
    min-width: 40px;
  }

  .editor-slider {
    flex: 1;
    height: 4px;
    appearance: none;
    background: #444;
    border-radius: 2px;
    cursor: pointer;
  }

  .editor-slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #4af;
    border-radius: 50%;
    cursor: pointer;
  }

  .editor-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #4af;
    border-radius: 50%;
    border: none;
    cursor: pointer;
  }

  .editor-number {
    width: 60px;
    padding: 2px 4px;
    background: #222;
    border: 1px solid #444;
    border-radius: 3px;
    color: #cfc;
    font-family: monospace;
    font-size: 11px;
    text-align: right;
  }

  .editor-number:focus {
    outline: none;
    border-color: #4af;
  }

  /* Action buttons */
  .infobox-actions {
    margin-top: 8px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 4px 10px;
    background: #335;
    border: 1px solid #446;
    border-radius: 4px;
    color: #fff;
    font-size: 11px;
    cursor: pointer;
  }

  .action-btn:hover {
    background: #446;
    border-color: #557;
  }

  /* Cayley table overlay */
  .cayley-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.95);
    padding: 0;
    border-radius: 8px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    border: 2px solid #4af;
    display: flex;
    flex-direction: column;
  }

  .cayley-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #333;
    background: rgba(0, 0, 0, 0.8);
    gap: 16px;
  }

  .cayley-header h3 {
    margin: 0;
    font-size: 16px;
    color: #4af;
    white-space: nowrap;
  }

  .cayley-algebra-selector {
    display: flex;
    gap: 12px;
    flex: 1;
    justify-content: center;
  }

  .algebra-radio {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #ccc;
    font-size: 12px;
    cursor: pointer;
  }

  .algebra-radio input {
    cursor: pointer;
  }

  .algebra-radio:has(input:checked) {
    color: #4af;
  }

  .cayley-close {
    background: none;
    border: none;
    color: #888;
    font-size: 24px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  }

  .cayley-close:hover {
    color: #fff;
  }

  .cayley-content {
    padding: 16px;
    overflow: auto;
    color: #eee;
    font-family: monospace;
    font-size: 12px;
  }

  .cayley-content :global(table) {
    border-collapse: collapse;
    margin: 0 auto;
  }

  .cayley-content :global(td),
  .cayley-content :global(th) {
    border: 1px solid #444;
    padding: 4px 8px;
    text-align: center;
  }

  .cayley-content :global(th) {
    background: #222;
    color: #4af;
    font-weight: bold;
  }
</style>
