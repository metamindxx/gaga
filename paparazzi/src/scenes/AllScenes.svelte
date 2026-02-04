<script lang="ts">
  /**
   * AllScenes.svelte
   *
   * A unified viewer for all Geometric Algebra demo scenes.
   * Completely scene-agnostic - reads from the scene registry.
   *
   * Renders multiple scenes in a single Threlte (Three.js) canvas with:
   *   - Toggle controls for each scene's visibility
   *   - Theme switching (light/dark)
   *   - Pause/resume animation
   *   - Hover information display
   */

  // ============================================================================
  // IMPORTS
  // ============================================================================

  // Threlte - Svelte wrapper for Three.js
  import { Canvas, T } from '@threlte/core';
  import { Grid, OrbitControls, Gizmo } from '@threlte/extras';

  // Scene registry (import triggers all registrations)
  import './index';
  import { getVisibleScenes } from '../stores/sceneRegistry.svelte';

  // Utility components and stores
  import ThreltePause from '../stores/ThreltePause.svelte';
  import ControlPanel from './ControlPanel.svelte';
  import HoverInfoBox from '../stores/HoverInfoBox.svelte';
  import { unpinHoverInfo } from '../stores/hoverInfo.svelte';
  import { orbitEnabled } from '../stores/orbitControl.svelte';
  import {
    cameraUp
    , cameraPosition
    , gridRotation
    , groundPlane
    , orbitTarget
  } from '../stores/coordinateSystem.svelte';

  // ============================================================================
  // APPLICATION STATE
  // ============================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let theme = $state<'light' | 'dark'>((import.meta as any).env?.VITE_THEME ?? 'light');
  let paused = $state(false);
  let resetKey = $state(0);
  // Trigger a reset after initial load to ensure all scenes initialize correctly
  setTimeout(() => resetKey++, 0);

  // ============================================================================
  // DERIVED VALUES (Theme Colors)
  // ============================================================================

  const backgroundColor = $derived(theme === 'light' ? '#f0f0f5' : '#1a1a2e');
  const gridCellColor = $derived(theme === 'light' ? '#ccccdd' : '#444466');
  const gridSectionColor = $derived(theme === 'light' ? '#aaaacc' : '#333344');
  const cameraUpVector = $derived(cameraUp());
  const cameraPos = $derived(cameraPosition());
  const orbitTargetPoint = $derived(orbitTarget());
  const gridRotationEuler = $derived(gridRotation());
  const ground = $derived(groundPlane());
</script>

<!-- ========================================================================== -->
<!-- MAIN CANVAS CONTAINER                                                     -->
<!-- ========================================================================== -->

<div class="w-screen h-screen bg-slate-900">
  {#key resetKey}
    <Canvas>
      <ThreltePause {paused} />

      <!-- Scene Setup -->
      <T.Color args={[backgroundColor]} attach="background" />

      <T.PerspectiveCamera makeDefault position={cameraPos} fov={60} up={cameraUpVector}>
        <OrbitControls target={orbitTargetPoint} enabled={orbitEnabled.current}>
          <Gizmo
            type="cube"
            placement="top-right"
            size={60}
            x={{ color: '#ff4444', label: 'X' }}
            y={{ color: '#44ff44', label: 'Y' }}
            z={{ color: '#4444ff', label: 'Z' }}
            nx={{ color: '#994444', label: '-X' }}
            ny={{ color: '#449944', label: '-Y' }}
            nz={{ color: '#444499', label: '-Z' }}
          />
        </OrbitControls>
      </T.PerspectiveCamera>

      <T.AmbientLight intensity={0.4} />
      <T.DirectionalLight position={[5, 10, 5]} intensity={0.8} />

      <T.Group rotation={gridRotationEuler}>
        <Grid
          cellColor={gridCellColor}
          sectionColor={gridSectionColor}
          fadeDistance={10}
        />
      </T.Group>

      <T.AxesHelper
        args={[1]}
        oncreate={(helper) => {
          helper.setColors('#ff0000', '#00ff00', '#0000ff');
        }}
      />

      <!-- Click plane to unpin hover info -->
      <T.Mesh position={ground.position} rotation={ground.rotation} onclick={unpinHoverInfo}>
        <T.PlaneGeometry args={[100, 100]} />
        <T.MeshBasicMaterial visible={false} />
      </T.Mesh>

      <!-- ================================================================== -->
      <!-- DEMO SCENES - Dynamically rendered from registry                   -->
      <!-- ================================================================== -->

      {#each getVisibleScenes() as scene (scene.id)}
        <scene.component {...scene.getSceneProps?.() ?? {}} />
      {/each}
    </Canvas>
  {/key}

  <!-- ======================================================================== -->
  <!-- CONTROL PANEL                                                           -->
  <!-- ======================================================================== -->

  <ControlPanel
    {theme}
    {paused}
    onTogglePause={() => (paused = !paused)}
    onReset={() => resetKey++}
    onToggleTheme={() => (theme = theme === 'light' ? 'dark' : 'light')}
  />

  <!-- ======================================================================== -->
  <!-- HOVER INFOBOX                                                           -->
  <!-- ======================================================================== -->

  <HoverInfoBox />
</div>
