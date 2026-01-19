<script lang="ts">
  /**
   * AllSlidesApp.svelte
   *
   * A unified viewer for all Geometric Algebra demo slides.
   * Renders multiple slides in a single Threlte (Three.js) canvas with:
   *   - Toggle controls for each slide's visibility
   *   - Theme switching (light/dark)
   *   - Pause/resume animation
   *   - Per-scene configuration panels
   *   - Interactive hover information display
   *   - Cayley table viewer for algebra products
   */

  // ============================================================================
  // IMPORTS
  // ============================================================================

  // Threlte - Svelte wrapper for Three.js
  import { Canvas, T } from '@threlte/core';
  import { Grid, OrbitControls, Gizmo } from '@threlte/extras';

  // Demo slide components - each demonstrates a different GA concept
  import Slide20Refactored from './Slide20Refactored.svelte'; // Robot arm forward kinematics (3D)
  import Slide22Refactored from './Slide22Refactored.svelte'; // Robot arm FK using CGA
  import Slide24Refactored from './Slide24Refactored.svelte'; // Robot arm inverse kinematics
  import Slide28Refactored from './Slide28Refactored.svelte'; // Agile eye gimbal (2-DOF)
  import Slide30Refactored from './Slide30Refactored.svelte'; // Agile eye gimbal (3-DOF)
  import Slide35Refactored from './Slide35Refactored.svelte'; // Delta robot forward kinematics
  import Slide38Refactored from './Slide38Refactored.svelte'; // Delta robot inverse kinematics
  import PgaDemo from './PgaDemo.svelte'; // PGA fundamentals demo
  import PgaDynamics from './PgaDynamics.svelte'; // PGA rigid body dynamics
  import SpinorSU2 from './SpinorSU2.svelte'; // SU(2) spinor visualization
  import DoubletsSU2 from './DoubletsSU2.svelte'; // SU(2) x U(1) doublet flags
  import Dandelion from './Dandelion.svelte'; // Dandelion doublet pattern
  import Skinning from './Skinning.svelte'; // DQS vs LBS skinning demo
  import JimmyAnimation from './JimmyAnimation.svelte'; // Motor skinning & animation blending

  // Spidor (spider robot) demos
  import SpidorLegDemo from './spidor/SpidorLegDemo.svelte'; // Single leg IK
  import SpidorFootDemo from './spidor/SpidorFootDemo.svelte'; // Foot placement with neighbors
  import SpidorFeetDemo from './spidor/SpidorFeetDemo.svelte'; // Multiple feet coordination
  import SpidorFull from './spidor/SpidorFull.svelte'; // Full spider walking

  // Utility components and stores
  import ThreltePause from './ThreltePause.svelte';
  import { hoverInfo, unpinHoverInfo, isPinned } from '../stores/hoverInfo';
  import { orbitEnabled } from '../stores/orbitControl';
  import { cgaBasisSet } from '../algebra/cga';
  import { pgaBasisSet, pga } from '../algebra/pga';
  import type { Multivector as MV } from '../algebra/types.js';

  // ============================================================================
  // SLIDE REGISTRY
  // ============================================================================

  /**
   * Maps slide IDs to human-readable names.
   * IDs roughly correspond to original presentation slide numbers.
   */
  const slideNames: Record<number, string> = {
    20: 'Robot Arm FK (3D)'
    , 22: 'Robot Arm FK (CGA)'
    , 24: 'Robot Arm IK'
    , 28: 'Agile Eye 2-DOF'
    , 30: 'Agile Eye 3-DOF'
    , 35: 'Delta Robot FK'
    , 38: 'Delta Robot IK'
    , 99: 'PGA Demo'
    , 100: 'Spidor Leg'
    , 101: 'Spidor Foot'
    , 102: 'Spidor Feet'
    , 103: 'Spidor Full'
    , 110: 'PGA Dynamics'
    , 111: 'Spinor SU(2)'
    , 112: 'Doublets SU(2)'
    , 113: 'Dandelion SU(2)'
    , 114: 'DQS Skinning'
    , 115: 'Jimmy Animation'
  };

  /** All available slide IDs */
  const slideIds = Object.keys(slideNames).map(Number);

  // ============================================================================
  // SLIDE GROUPS (for accordion organization)
  // ============================================================================

  /**
   * Slides organized into logical groups for the accordion UI.
   * Each group has a name, list of slide IDs, and optional icon.
   */
  const slideGroups = [
    {
      id: 'robot'
      , name: 'Robot Demos'
      , icon: '🤖'
      , slideIds: [20, 22, 24, 28, 30, 35, 38]
    }
    , {
      id: 'spidor'
      , name: 'Spidor Demos'
      , icon: '🕷️'
      , slideIds: [100, 101, 102, 103]
    }
    , {
      id: 'pga'
      , name: 'PGA Demos'
      , icon: '📐'
      , slideIds: [99, 110, 111, 112, 113, 114, 115]
    }
  ] as const;

  // ============================================================================
  // APPLICATION STATE
  // ============================================================================

  // --- Global UI State ---

  /** Current color theme */
  let theme = $state<'light' | 'dark'>((import.meta as any).env?.VITE_THEME ?? 'light');

  /** Whether animation is paused */
  let paused = $state(false);

  /** Increment to force canvas remount (reset all scenes) */
  let resetKey = $state(0);

  /** Which slides are currently visible (slide ID → boolean) */
  let visible = $state<Record<number, boolean>>({ 111: true });

  /** Whether the control panel is collapsed */
  let collapsed = $state(false);

  /** Which accordion groups are expanded (group id → boolean) */
  let accordionExpanded = $state<Record<string, boolean>>({
    robot: false
    , spidor: false
    , pga: true // Default to PGA expanded since slide 111 is initially visible
  });

  /** Whether the Cayley table modal is shown */
  let showCayleyTable = $state(false);

  /** Which algebra's Cayley table to display */
  let cayleyTableAlgebra = $state<string>('cga');

  /** Available algebras for Cayley table display */
  const cayleyTableAlgebras = [
    { id: 'cga', name: 'CGA (4,1)', basisSet: cgaBasisSet }
    , { id: 'pga', name: 'PGA (3,0,1)', basisSet: pgaBasisSet }
  ];

  // --- Per-Scene Configuration ---

  /** Spinor SU(2) demo: current point values */
  let spinorPt1 = $state<MV>(pga.point([1, 0, 0]));
  let spinorPt2 = $state<MV>(pga.point([0, 0, 0]));

  // Format spinor point as complex number string
  function formatSpinorPoint(pt: MV): string {
    const coords = pga.pointCoords(pt);
    if (!coords) return '?';
    const [re, , im] = coords;
    const sign = im >= 0 ? '+' : '-';
    return `${re.toFixed(3)} ${sign} ${Math.abs(im).toFixed(3)}i`;
  }

  /** Spidor leg demo: IK solver parameters */
  let spidorLegConfig = $state({
    segmentCount: 3
    , segmentLength: 0.2
    , lockToPlane: false
    , useKneeHint: false
    , kneePosition: 0.9
    , solverIterations: 1
  });

  /** Spidor full demo: leg and visualization settings */
  let spidorFullConfig = $state({
    segmentCount: 3
    , segmentLength: 0.2
    , lockToPlane: true
    , useKneeHint: true
    , kneePosition: 0.9
    , solverIterations: 4
    , showVisualization: true
  });

  /** Spidor stepping: timing parameters for foot movement */
  let spidorStepConfig = $state({
    minTriggerDistance: 0.12 // Min distance before foot starts moving
    , stepDurationMs: 220 // How long a step takes
    , minRestMs: 120 // Min time between steps
    , finishThreshold: 0.03 // Distance to consider "arrived"
  });

  /** Spidor foot demo: stepping + neighbor + target motion settings */
  let spidorFootConfig = $state({
    minTriggerDistance: 0.12
    , stepDurationMs: 220
    , minRestMs: 120
    , finishThreshold: 0.03
    , neighborAMoving: false
    , neighborBMoving: false
    , targetRadius: 0.6
    , targetSpeed: 0.35
  });

  /** DQS Skinning demo: skinning method and rotation settings */
  let skinningConfig = $state({
    useDQS: true
    , rotationAngle: 0.5
    , animate: true
    , animationSpeed: 1.0
  });

  /** Jimmy Animation demo: animation blending settings */
  let jimmyConfig = $state({
    animWeights: [1.0, 0, 0, 0, 0, 0] as number[]  // [Walk, Jump, Run, Stride, Idle, Zombie]
    , speed: 1.0
    , debugNoSkinning: false
    , debugIdentity: false
  });

  const jimmyAnimNames = ['Walk', 'Jump', 'Run', 'Stride', 'Idle', 'Zombie'];

  // ============================================================================
  // DERIVED VALUES (Theme Colors)
  // ============================================================================

  /** Background color based on current theme */
  const backgroundColor = $derived(theme === 'light' ? '#f0f0f5' : '#1a1a2e');

  /** Grid cell line color */
  const gridCellColor = $derived(theme === 'light' ? '#ccccdd' : '#444466');

  /** Grid section line color (major lines) */
  const gridSectionColor = $derived(theme === 'light' ? '#aaaacc' : '#333344');

  // ============================================================================
  // VISIBILITY ACTIONS
  // ============================================================================

  /** Toggle a single slide's visibility */
  function toggleSlide(slideId: number): void {
    visible[slideId] = !visible[slideId];
  }

  /** Show only one slide (hide all others) */
  function showOnlySlide(slideId: number): void {
    visible = { [slideId]: true };
  }

  /** Show all slides at once */
  function showAllSlides(): void {
    const allVisible: Record<number, boolean> = {};
    for (const id of slideIds) {
      allVisible[id] = true;
    }
    visible = allVisible;
  }

  /** Hide all slides */
  function hideAllSlides(): void {
    visible = {};
  }

  /** Toggle an accordion group's expanded state */
  function toggleAccordion(groupId: string): void {
    accordionExpanded[groupId] = !accordionExpanded[groupId];
  }

  /** Show all slides in a specific group */
  function showGroupSlides(groupSlideIds: readonly number[]): void {
    for (const id of groupSlideIds) {
      visible[id] = true;
    }
  }

  /** Hide all slides in a specific group */
  function hideGroupSlides(groupSlideIds: readonly number[]): void {
    for (const id of groupSlideIds) {
      visible[id] = false;
    }
  }

  /** Check if any slide in a group is visible */
  function isGroupPartiallyVisible(groupSlideIds: readonly number[]): boolean {
    return groupSlideIds.some((id) => visible[id]);
  }

  /** Check if all slides in a group are visible */
  function isGroupFullyVisible(groupSlideIds: readonly number[]): boolean {
    return groupSlideIds.every((id) => visible[id]);
  }
</script>

<!-- ========================================================================== -->
<!-- MAIN CANVAS CONTAINER                                                     -->
<!-- ========================================================================== -->

<div class="w-screen h-screen bg-slate-900">
  <!-- 
    The {#key resetKey} block forces Svelte to destroy and recreate the Canvas
    whenever resetKey changes, effectively resetting all scene state.
  -->
  {#key resetKey}
    <Canvas>
      <!-- Pause/resume handler for animation frames -->
      <ThreltePause {paused} />

      <!-- ================================================================== -->
      <!-- SCENE SETUP: Camera, Lights, Grid                                  -->
      <!-- ================================================================== -->

      <!-- Set background color (attached to the Three.js scene) -->
      <T.Color args={[backgroundColor]} attach="background" />

      <!-- Main camera with orbit controls for user interaction -->
      <T.PerspectiveCamera makeDefault position={[3, 2, 4]} fov={60}>
        <OrbitControls target={[0, 0.5, 0]} enabled={$orbitEnabled}>
          <!-- Orientation gizmo in corner showing current view direction -->
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

      <!-- Basic lighting setup -->
      <T.AmbientLight intensity={0.4} />
      <T.DirectionalLight position={[5, 10, 5]} intensity={0.8} />

      <!-- Ground grid for spatial reference -->
      <Grid cellColor={gridCellColor} sectionColor={gridSectionColor} fadeDistance={10} />

      <!-- RGB axes helper (1 unit long) -->
      <T.AxesHelper
        args={[1]}
        oncreate={(helper) => {
          helper.setColors('#ff0000', '#00ff00', '#0000ff');
        }}
      />

      <!-- Invisible click plane to unpin hover info when clicking empty space -->
      <T.Mesh position={[0, 0, -10]} onclick={unpinHoverInfo}>
        <T.PlaneGeometry args={[100, 100]} />
        <T.MeshBasicMaterial visible={false} />
      </T.Mesh>

      <!-- ================================================================== -->
      <!-- DEMO SLIDES: Conditionally rendered based on visibility state      -->
      <!-- ================================================================== -->

      <!-- Robot arm demos -->
      {#if visible[20]}<Slide20Refactored />{/if}
      {#if visible[22]}<Slide22Refactored />{/if}
      {#if visible[24]}<Slide24Refactored />{/if}

      <!-- Agile eye gimbal demos -->
      {#if visible[28]}<Slide28Refactored />{/if}
      {#if visible[30]}<Slide30Refactored />{/if}

      <!-- Delta robot demos -->
      {#if visible[35]}<Slide35Refactored />{/if}
      {#if visible[38]}<Slide38Refactored />{/if}

      <!-- PGA fundamentals -->
      {#if visible[99]}<PgaDemo />{/if}

      <!-- Spidor (spider robot) demos with configurable parameters -->
      {#if visible[100]}
        <SpidorLegDemo
          segmentCount={spidorLegConfig.segmentCount}
          segmentLength={spidorLegConfig.segmentLength}
          lockToPlane={spidorLegConfig.lockToPlane}
          setKnee={spidorLegConfig.useKneeHint}
          kneePosition={spidorLegConfig.kneePosition}
          solveN={spidorLegConfig.solverIterations}
        />
      {/if}

      {#if visible[101]}
        <SpidorFootDemo
          stepMinDist={spidorFootConfig.minTriggerDistance}
          stepDurationMs={spidorFootConfig.stepDurationMs}
          minRestMs={spidorFootConfig.minRestMs}
          stepFinishDist={spidorFootConfig.finishThreshold}
          neighborA={spidorFootConfig.neighborAMoving}
          neighborB={spidorFootConfig.neighborBMoving}
          targetRadius={spidorFootConfig.targetRadius}
          targetSpeed={spidorFootConfig.targetSpeed}
        />
      {/if}

      {#if visible[102]}
        <SpidorFeetDemo
          stepMinDist={spidorStepConfig.minTriggerDistance}
          stepDurationMs={spidorStepConfig.stepDurationMs}
          minRestMs={spidorStepConfig.minRestMs}
          stepFinishDist={spidorStepConfig.finishThreshold}
        />
      {/if}

      {#if visible[103]}
        <SpidorFull
          stepMinDist={spidorStepConfig.minTriggerDistance}
          stepDurationMs={spidorStepConfig.stepDurationMs}
          minRestMs={spidorStepConfig.minRestMs}
          stepFinishDist={spidorStepConfig.finishThreshold}
          segmentCount={spidorFullConfig.segmentCount}
          segmentLength={spidorFullConfig.segmentLength}
          lockToPlane={spidorFullConfig.lockToPlane}
          setKnee={spidorFullConfig.useKneeHint}
          kneePosition={spidorFullConfig.kneePosition}
          solveN={spidorFullConfig.solverIterations}
          showViz={spidorFullConfig.showVisualization}
        />
      {/if}

      <!-- Advanced PGA demos -->
      {#if visible[110]}<PgaDynamics />{/if}

      {#if visible[111]}
        <SpinorSU2 bind:pt1={spinorPt1} bind:pt2={spinorPt2} />
      {/if}

      {#if visible[112]}
        <DoubletsSU2 />
      {/if}

      {#if visible[113]}
        <Dandelion />
      {/if}

      {#if visible[114]}
        <Skinning
          useDQS={skinningConfig.useDQS}
          rotationAngle={skinningConfig.rotationAngle}
          animate={skinningConfig.animate}
          animationSpeed={skinningConfig.animationSpeed}
        />
      {/if}

      {#if visible[115]}
        <JimmyAnimation
          bind:animWeights={jimmyConfig.animWeights}
          speed={jimmyConfig.speed}
          debugNoSkinning={jimmyConfig.debugNoSkinning}
          debugIdentity={jimmyConfig.debugIdentity}
        />
      {/if}
    </Canvas>
  {/key}

  <!-- ======================================================================== -->
  <!-- CONTROL PANEL (Left Sidebar)                                            -->
  <!-- ======================================================================== -->

  <div
    class="fixed top-2.5 left-2.5 bg-black/90 p-4 rounded-lg max-w-72 text-sm text-gray-200 font-sans max-h-[calc(100vh-20px)] overflow-y-auto"
    class:!p-2={collapsed}
    class:!min-w-0={collapsed}
  >
    <!-- Collapse/Expand toggle button -->
    <button
      class="absolute top-2 right-2 bg-indigo-900 hover:bg-indigo-700 border-none rounded w-6 h-6 text-white text-xs flex items-center justify-center cursor-pointer"
      class:!static={collapsed}
      onclick={() => (collapsed = !collapsed)}
    >
      {collapsed ? '▶' : '◀'}
    </button>

    {#if !collapsed}
      <!-- Panel Header -->
      <h1 class="text-lg m-0 mb-1 text-sky-400">Geometric Algebra Demos</h1>
      <p class="text-xs text-gray-500 m-0 mb-3">CGA & PGA with algebra-renderer decoupling</p>

      <!-- ================================================================ -->
      <!-- Global Action Buttons                                            -->
      <!-- ================================================================ -->

      <div class="flex gap-2 mb-3 flex-wrap">
        <button
          class="flex-1 min-w-12 px-3 py-1.5 border-none rounded bg-indigo-900 hover:bg-indigo-700 text-white text-xs cursor-pointer"
          onclick={() => (paused = !paused)}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          class="flex-1 min-w-12 px-3 py-1.5 border-none rounded bg-indigo-900 hover:bg-indigo-700 text-white text-xs cursor-pointer"
          onclick={() => resetKey++}
        >
          Reset
        </button>
        <button
          class="flex-1 min-w-12 px-3 py-1.5 border-none rounded bg-indigo-900 hover:bg-indigo-700 text-white text-xs cursor-pointer"
          onclick={() => (theme = theme === 'light' ? 'dark' : 'light')}
        >
          {theme}
        </button>
        <button
          class="flex-1 min-w-12 px-3 py-1.5 border-none rounded bg-indigo-900 hover:bg-indigo-700 text-white text-xs cursor-pointer"
          onclick={() => (showCayleyTable = !showCayleyTable)}
        >
          Cayley
        </button>
      </div>

      <!-- ================================================================ -->
      <!-- Slide Visibility Toggles (Grouped in Accordions)                 -->
      <!-- ================================================================ -->

      <div class="flex flex-col gap-2">
        {#each slideGroups as group}
          <!-- Accordion Container -->
          <div class="rounded-md overflow-hidden border border-gray-700">
            <!-- Accordion Header (always visible) -->
            <div class="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750">
              <!-- Expand/Collapse toggle button -->
              <button
                class="flex items-center gap-2 flex-1 bg-transparent border-none text-left cursor-pointer p-0"
                onclick={() => toggleAccordion(group.id)}
              >
                <!-- Expand/Collapse indicator -->
                <span class="text-gray-400 text-xs w-4">
                  {accordionExpanded[group.id] ? '▼' : '▶'}
                </span>

                <!-- Group icon -->
                <span class="text-sm">{group.icon}</span>

                <!-- Group name -->
                <span class="flex-1 text-sm text-gray-200 font-medium">
                  {group.name}
                </span>
              </button>

              <!-- Visibility indicator: shows if any/all slides in group are visible -->
              <span
                class="w-2 h-2 rounded-full"
                class:bg-green-400={isGroupFullyVisible(group.slideIds)}
                class:bg-yellow-400={isGroupPartiallyVisible(group.slideIds) &&
                  !isGroupFullyVisible(group.slideIds)}
                class:bg-gray-600={!isGroupPartiallyVisible(group.slideIds)}
              ></span>

              <!-- Group action buttons (outside the toggle button) -->
              <button
                class="px-1.5 py-0.5 border-none rounded bg-slate-600 hover:bg-slate-500 text-gray-300 hover:text-white text-[10px] cursor-pointer"
                onclick={() => showGroupSlides(group.slideIds)}
              >
                all
              </button>
              <button
                class="px-1.5 py-0.5 border-none rounded bg-slate-600 hover:bg-slate-500 text-gray-300 hover:text-white text-[10px] cursor-pointer"
                onclick={() => hideGroupSlides(group.slideIds)}
              >
                none
              </button>
            </div>

            <!-- Accordion Content (collapsible) -->
            {#if accordionExpanded[group.id]}
              <div class="flex flex-col gap-1 p-2 bg-black/30">
                {#each group.slideIds as slideId}
                  <label
                    class="flex items-center gap-2 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded cursor-pointer"
                  >
                    <!-- Checkbox to toggle visibility -->
                    <input
                      type="checkbox"
                      checked={visible[slideId] ?? false}
                      onchange={() => toggleSlide(slideId)}
                      class="cursor-pointer"
                    />
                    <!-- Slide ID badge -->
                    <span class="font-mono text-xs text-sky-400 min-w-7">#{slideId}</span>
                    <!-- Slide name -->
                    <span class="flex-1 text-xs">{slideNames[slideId]}</span>
                    <!-- Solo button: show only this slide -->
                    <button
                      class="px-1.5 py-0.5 border-none rounded bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white text-[10px] cursor-pointer"
                      onclick={() => showOnlySlide(slideId)}
                    >
                      solo
                    </button>
                  </label>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- ================================================================ -->
      <!-- Scene-Specific Configuration Panels                              -->
      <!-- ================================================================ -->

      <!-- Spinor SU(2) Controls -->
      {#if visible[111]}
        <fieldset class="mt-3 p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
          <legend class="text-xs text-sky-400 px-1">Spinor SU(2)</legend>

          <!-- Point values display -->
          <div class="mb-2 p-1.5 bg-black/30 rounded text-xs font-mono">
            <div class="flex gap-2">
              <span class="text-gray-400">α:</span>
              <span class="text-green-300">{formatSpinorPoint(spinorPt1)}</span>
            </div>
            <div class="flex gap-2">
              <span class="text-gray-400">β:</span>
              <span class="text-green-300">{formatSpinorPoint(spinorPt2)}</span>
            </div>
          </div>
        </fieldset>
      {/if}

      <!-- Spidor Leg Demo Controls -->
      {#if visible[100]}
        <fieldset class="mt-3 p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
          <legend class="text-xs text-sky-400 px-1">Spidor Leg</legend>

          <!-- Segment count slider -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Segments:</span>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              bind:value={spidorLegConfig.segmentCount}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorLegConfig.segmentCount}
            </span>
          </label>

          <!-- Segment length slider -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Length:</span>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              bind:value={spidorLegConfig.segmentLength}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorLegConfig.segmentLength.toFixed(2)}
            </span>
          </label>

          <!-- Boolean toggles -->
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-1">
            <input type="checkbox" bind:checked={spidorLegConfig.lockToPlane} />
            Lock to plane
          </label>
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-1">
            <input type="checkbox" bind:checked={spidorLegConfig.useKneeHint} />
            Set knee
          </label>

          <!-- Knee position (only shown when knee hint is enabled) -->
          {#if spidorLegConfig.useKneeHint}
            <label class="flex items-center gap-2 text-xs mb-1">
              <span class="min-w-14 text-gray-400">Knee pos:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={spidorLegConfig.kneePosition}
                class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
              />
              <span class="min-w-8 text-right font-mono text-green-300">
                {spidorLegConfig.kneePosition.toFixed(2)}
              </span>
            </label>
          {/if}

          <!-- Solver iterations -->
          <label class="flex items-center gap-2 text-xs">
            <span class="min-w-14 text-gray-400">Iterations:</span>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              bind:value={spidorLegConfig.solverIterations}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorLegConfig.solverIterations}
            </span>
          </label>
        </fieldset>
      {/if}

      <!-- Spidor Full Demo Controls -->
      {#if visible[103]}
        <fieldset class="mt-3 p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
          <legend class="text-xs text-sky-400 px-1">Spidor Full (Legs)</legend>

          <!-- Show visualization toggle -->
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-1">
            <input type="checkbox" bind:checked={spidorFullConfig.showVisualization} />
            Show targets/feet
          </label>

          <!-- Segment count -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Segments:</span>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              bind:value={spidorFullConfig.segmentCount}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorFullConfig.segmentCount}
            </span>
          </label>

          <!-- Segment length -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Length:</span>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              bind:value={spidorFullConfig.segmentLength}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorFullConfig.segmentLength.toFixed(2)}
            </span>
          </label>

          <!-- Boolean toggles -->
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-1">
            <input type="checkbox" bind:checked={spidorFullConfig.lockToPlane} />
            Lock to plane
          </label>
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-1">
            <input type="checkbox" bind:checked={spidorFullConfig.useKneeHint} />
            Set knee
          </label>

          <!-- Knee position -->
          {#if spidorFullConfig.useKneeHint}
            <label class="flex items-center gap-2 text-xs mb-1">
              <span class="min-w-14 text-gray-400">Knee pos:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={spidorFullConfig.kneePosition}
                class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
              />
              <span class="min-w-8 text-right font-mono text-green-300">
                {spidorFullConfig.kneePosition.toFixed(2)}
              </span>
            </label>
          {/if}

          <!-- Solver iterations -->
          <label class="flex items-center gap-2 text-xs">
            <span class="min-w-14 text-gray-400">Iterations:</span>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              bind:value={spidorFullConfig.solverIterations}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorFullConfig.solverIterations}
            </span>
          </label>
        </fieldset>
      {/if}

      <!-- Spidor Stepping Controls (shared by feet demos) -->
      {#if visible[102] || visible[103]}
        <fieldset class="mt-3 p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
          <legend class="text-xs text-sky-400 px-1">Spidor Stepping</legend>

          <!-- Minimum trigger distance -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Min dist:</span>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              bind:value={spidorStepConfig.minTriggerDistance}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorStepConfig.minTriggerDistance.toFixed(2)}
            </span>
          </label>

          <!-- Finish threshold -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Finish:</span>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.005"
              bind:value={spidorStepConfig.finishThreshold}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorStepConfig.finishThreshold.toFixed(3)}
            </span>
          </label>

          <!-- Step duration -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Step ms:</span>
            <input
              type="range"
              min="50"
              max="800"
              step="10"
              bind:value={spidorStepConfig.stepDurationMs}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorStepConfig.stepDurationMs}
            </span>
          </label>

          <!-- Rest duration -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Rest ms:</span>
            <input
              type="range"
              min="0"
              max="800"
              step="10"
              bind:value={spidorStepConfig.minRestMs}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorStepConfig.minRestMs}
            </span>
          </label>
        </fieldset>
      {/if}

      <!-- Spidor Foot Demo Controls -->
      {#if visible[101]}
        <fieldset class="mt-3 p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
          <legend class="text-xs text-sky-400 px-1">Spidor Foot</legend>

          <!-- Stepping parameters -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Min dist:</span>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              bind:value={spidorFootConfig.minTriggerDistance}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorFootConfig.minTriggerDistance.toFixed(2)}
            </span>
          </label>

          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Finish:</span>
            <input
              type="range"
              min="0"
              max="0.2"
              step="0.005"
              bind:value={spidorFootConfig.finishThreshold}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorFootConfig.finishThreshold.toFixed(3)}
            </span>
          </label>

          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Step ms:</span>
            <input
              type="range"
              min="50"
              max="800"
              step="10"
              bind:value={spidorFootConfig.stepDurationMs}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorFootConfig.stepDurationMs}
            </span>
          </label>

          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Rest ms:</span>
            <input
              type="range"
              min="0"
              max="800"
              step="10"
              bind:value={spidorFootConfig.minRestMs}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorFootConfig.minRestMs}
            </span>
          </label>

          <!-- Target motion parameters -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Target r:</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              bind:value={spidorFootConfig.targetRadius}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorFootConfig.targetRadius.toFixed(2)}
            </span>
          </label>

          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Target v:</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              bind:value={spidorFootConfig.targetSpeed}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {spidorFootConfig.targetSpeed.toFixed(2)}
            </span>
          </label>

          <!-- Neighbor toggles -->
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-1">
            <input type="checkbox" bind:checked={spidorFootConfig.neighborAMoving} />
            Neighbor A moving
          </label>
          <label class="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" bind:checked={spidorFootConfig.neighborBMoving} />
            Neighbor B moving
          </label>
        </fieldset>
      {/if}

      <!-- DQS Skinning Controls -->
      {#if visible[114]}
        <fieldset class="mt-3 p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
          <legend class="text-xs text-sky-400 px-1">DQS Skinning</legend>

          <!-- Skinning method toggle -->
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-2">
            <input type="checkbox" bind:checked={skinningConfig.useDQS} />
            <span class:text-green-400={skinningConfig.useDQS} class:text-red-400={!skinningConfig.useDQS}>
              {skinningConfig.useDQS ? 'Dual Quaternion (DQS)' : 'Linear Blend (LBS)'}
            </span>
          </label>

          <!-- Animate toggle -->
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-2">
            <input type="checkbox" bind:checked={skinningConfig.animate} />
            Animate
          </label>

          <!-- Animation speed (only when animating) -->
          {#if skinningConfig.animate}
            <label class="flex items-center gap-2 text-xs mb-1">
              <span class="min-w-14 text-gray-400">Speed:</span>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                bind:value={skinningConfig.animationSpeed}
                class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
              />
              <span class="min-w-8 text-right font-mono text-green-300">
                {skinningConfig.animationSpeed.toFixed(1)}x
              </span>
            </label>
          {/if}

          <!-- Rotation angle (manual control when not animating) -->
          {#if !skinningConfig.animate}
            <label class="flex items-center gap-2 text-xs mb-1">
              <span class="min-w-14 text-gray-400">Rotation:</span>
              <input
                type="range"
                min="0"
                max="3.14159"
                step="0.01"
                bind:value={skinningConfig.rotationAngle}
                class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
              />
              <span class="min-w-10 text-right font-mono text-green-300">
                {(skinningConfig.rotationAngle * 180 / Math.PI).toFixed(0)}°
              </span>
            </label>
          {:else}
            <!-- Show current rotation when animating (read-only) -->
            <div class="flex items-center gap-2 text-xs mb-1">
              <span class="min-w-14 text-gray-400">Rotation:</span>
              <span class="font-mono text-green-300">
                {(skinningConfig.rotationAngle * 180 / Math.PI).toFixed(0)}°
              </span>
            </div>
          {/if}
        </fieldset>
      {/if}

      <!-- Jimmy Animation Controls -->
      {#if visible[115]}
        <fieldset class="mt-3 p-2.5 bg-sky-500/10 border border-sky-400 rounded-md">
          <legend class="text-xs text-sky-400 px-1">Jimmy Animation</legend>

          <!-- Debug: no skinning toggle -->
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-2">
            <input type="checkbox" bind:checked={jimmyConfig.debugNoSkinning} />
            <span class:text-yellow-400={jimmyConfig.debugNoSkinning}>Debug: no skinning</span>
          </label>

          <!-- Debug: identity transform -->
          <label class="flex items-center gap-2 text-xs cursor-pointer mb-2">
            <input type="checkbox" bind:checked={jimmyConfig.debugIdentity} />
            <span class:text-yellow-400={jimmyConfig.debugIdentity}>Debug: identity transforms</span>
          </label>

          <!-- Animation weight sliders -->
          <div class="mt-2 pt-2 border-t border-gray-700">
            <div class="text-xs text-gray-400 mb-2">Animation Weights:</div>
            {#each jimmyAnimNames as name, i}
              <label class="flex items-center gap-2 text-xs mb-1">
                <span class="min-w-12 text-gray-400">{name}:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={jimmyConfig.animWeights[i]}
                  oninput={(e) => {
                    jimmyConfig.animWeights[i] = parseFloat((e.target as HTMLInputElement).value);
                    jimmyConfig.animWeights = [...jimmyConfig.animWeights];
                  }}
                  class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
                />
                <span class="min-w-8 text-right font-mono text-green-300">
                  {jimmyConfig.animWeights[i].toFixed(2)}
                </span>
              </label>
            {/each}
          </div>

          <!-- Speed slider -->
          <label class="flex items-center gap-2 text-xs mb-1">
            <span class="min-w-14 text-gray-400">Speed:</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              bind:value={jimmyConfig.speed}
              class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
            />
            <span class="min-w-8 text-right font-mono text-green-300">
              {jimmyConfig.speed.toFixed(1)}x
            </span>
          </label>
        </fieldset>
      {/if}
    {/if}
  </div>

  <!-- ======================================================================== -->
  <!-- HOVER INFOBOX (Bottom Right)                                            -->
  <!-- Shows details about hovered/pinned geometric elements                   -->
  <!-- ======================================================================== -->

  {#if $hoverInfo}
    <div
      class="fixed bottom-2.5 right-2.5 bg-black/90 p-3 rounded-lg min-w-52 max-w-80 text-sm text-gray-200 font-sans border border-sky-400"
      class:!border-orange-400={$isPinned}
    >
      <!-- Close button (only shown when pinned) -->
      {#if $isPinned}
        <button
          class="absolute top-1 right-2 bg-transparent border-none text-gray-500 hover:text-white text-lg cursor-pointer"
          onclick={unpinHoverInfo}
        >
          ×
        </button>
      {/if}

      <!-- Header: Label and Type Badge -->
      <div class="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-700">
        {#if $hoverInfo.label}
          <span class="font-bold text-sky-400 text-sm">{$hoverInfo.label}</span>
        {/if}
        <span
          class="text-sky-300 text-[11px] uppercase tracking-wide bg-sky-400/15 px-1.5 py-0.5 rounded"
        >
          {$hoverInfo.type}
        </span>
      </div>

      <!-- Multivector String Representation -->
      {#if $hoverInfo.mvString}
        <div class="font-mono text-[11px] text-gray-400 break-all mb-2 p-1.5 bg-white/5 rounded">
          {$hoverInfo.mvString}
        </div>
      {/if}

      <!-- Property Key-Value Pairs -->
      {#if $hoverInfo.properties}
        <div class="flex flex-col gap-0.5">
          {#each Object.entries($hoverInfo.properties) as [propertyKey, propertyValue]}
            <div class="flex gap-1.5 text-xs">
              <span class="text-gray-500">{propertyKey}:</span>
              <span class="text-green-300 font-mono">{propertyValue}</span>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Editable Fields (only when pinned) -->
      {#if $isPinned && $hoverInfo.editableFields?.length}
        <div class="mt-2.5 pt-2.5 border-t border-gray-700 flex flex-col gap-2">
          {#each $hoverInfo.editableFields as field}
            <div class="flex items-center gap-2">
              <!-- Field label -->
              <span class="text-sky-300 text-[11px] min-w-10">
                {field.label ?? field.key}
              </span>

              <!-- Range slider for quick adjustment -->
              <input
                type="range"
                class="flex-1 h-1 appearance-none bg-gray-600 rounded accent-sky-400"
                value={field.value}
                min={field.min ?? -3.14159}
                max={field.max ?? 3.14159}
                step={field.step ?? 0.01}
                oninput={(e) => field.onChange(parseFloat(e.currentTarget.value))}
              />

              <!-- Numeric input for precise values -->
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

      <!-- Action Buttons (only when pinned) -->
      {#if $isPinned && $hoverInfo.actions?.length}
        <div class="mt-2 flex gap-1.5 flex-wrap">
          {#each $hoverInfo.actions as action}
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

  <!-- ======================================================================== -->
  <!-- CAYLEY TABLE MODAL                                                       -->
  <!-- Shows the multiplication table for the selected algebra                 -->
  <!-- ======================================================================== -->

  {#if showCayleyTable}
    <div
      class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/95 rounded-lg max-w-[90vw] max-h-[90vh] overflow-hidden border-2 border-sky-400 flex flex-col"
    >
      <!-- Modal Header -->
      <div
        class="flex justify-between items-center px-4 py-3 border-b border-gray-700 bg-black/80 gap-4"
      >
        <h3 class="m-0 text-base text-sky-400 whitespace-nowrap">Cayley Table</h3>

        <!-- Algebra Selector -->
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

        <!-- Close Button -->
        <button
          class="bg-transparent border-none text-gray-500 hover:text-white text-2xl cursor-pointer px-1"
          onclick={() => (showCayleyTable = false)}
        >
          ×
        </button>
      </div>

      <!-- Table Content -->
      <div
        class="p-4 overflow-auto text-gray-200 font-mono text-xs [&_table]:border-collapse [&_table]:mx-auto [&_td]:border [&_td]:border-gray-600 [&_td]:px-2 [&_td]:py-1 [&_td]:text-center [&_th]:border [&_th]:border-gray-600 [&_th]:px-2 [&_th]:py-1 [&_th]:text-center [&_th]:bg-gray-800 [&_th]:text-sky-400 [&_th]:font-bold"
      >
        {@html cayleyTableAlgebras.find((a) => a.id === cayleyTableAlgebra)?.basisSet.cayleyHtml()}
      </div>
    </div>
  {/if}
</div>
