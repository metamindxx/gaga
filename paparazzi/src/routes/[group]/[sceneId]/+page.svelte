<script lang="ts">
  /**
   * Scene Page - Individual scene viewer
   * Route: /[group]/[sceneId]
   */
  import { page } from '$app/state';
  import { Canvas, T } from '@threlte/core';
  import { Grid, OrbitControls, Gizmo } from '@threlte/extras';

  import ThreltePause from '$stores/ThreltePause.svelte';
  import HoverInfoBox from '$stores/HoverInfoBox.svelte';
  import { unpinHoverInfo } from '$stores/hoverInfo.svelte';
  import { orbitEnabled } from '$stores/orbitControl.svelte';
  import { getScene } from '$stores/sceneRegistry.svelte';
  import { theme, paused, resetKey } from '$stores/sceneControls.svelte';
  import {
    cameraUp
    , cameraPosition
    , gridRotation
    , groundPlane
    , orbitTarget
  } from '$stores/coordinateSystem.svelte';

  let gridReady = $state(false);
  $effect.pre(() => {
    void resetKey.current;
    gridReady = false;
    // Delay grid rendering after reset to avoid shader race.
    // $effect.pre runs BEFORE the DOM update, so gridReady is false
    // when the {#key} block re-renders the Canvas. rAF then defers
    // Grid mounting until the next frame when ShaderMaterial can attach.
    requestAnimationFrame(() => gridReady = true);
  });

  // Get scene from route params
  const sceneId = $derived(parseInt(page.params.sceneId));
  const scene = $derived(getScene(sceneId));

  // Theme colors
  const backgroundColor = $derived(theme.current === 'light' ? '#f0f0f5' : '#1a1a2e');
  const gridCellColor = $derived(theme.current === 'light' ? '#ccccdd' : '#444466');
  const gridSectionColor = $derived(theme.current === 'light' ? '#aaaacc' : '#333344');
  const cameraUpVector = $derived(cameraUp());
  const cameraPos = $derived(cameraPosition());
  const orbitTargetPoint = $derived(orbitTarget());
  const gridRotationEuler = $derived(gridRotation());
  const ground = $derived(groundPlane());
</script>

<svelte:head>
  <title>{scene?.name ?? 'Scene'} - Paparazzi</title>
</svelte:head>

{#if scene}
  <div class="h-screen w-full relative">
    {#key resetKey.current}
      <Canvas>
        <ThreltePause paused={paused.current} />

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
          {#if gridReady}
            <Grid cellColor={gridCellColor} sectionColor={gridSectionColor} fadeDistance={10} />
          {/if}
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

        <!-- Render the scene component -->
        <scene.component {...scene.getSceneProps?.() ?? {}} />
      </Canvas>
    {/key}

    <HoverInfoBox />
  </div>
{:else}
  <div class="h-screen w-full flex items-center justify-center bg-slate-900">
    <div class="text-center">
      <h1 class="text-2xl text-gray-200 mb-4">Scene Not Found</h1>
      <p class="text-gray-400 mb-4">
        Scene #{page.params.sceneId} doesn't exist in the {page.params.group} group.
      </p>
      <a href="/" class="text-sky-400 hover:text-sky-300">← Back to Home</a>
    </div>
  </div>
{/if}
