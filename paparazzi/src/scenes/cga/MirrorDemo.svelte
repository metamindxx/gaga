<script lang="ts">
  import { interactivity } from '@threlte/extras';
  /**
   * MirrorDemo - CGA Mirror/Inversion Explorer
   *
   * Demonstrates inversion/reflection through multiple spheres/circles in CGA.
   * Based on GeoGebra demo: https://www.geogebra.org/classic/hyabh2kz
   */

  import * as cga from './cgaMirrors';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import type { Coords3D } from '../../geometry/primitives';
  import type { ObjectType, MirrorConfig } from './mirrorState.svelte';

  interactivity();

  // Props from config
  let {
    objectType = 'sphere' as ObjectType
    , objectPosition = [0.5, 0.5, 0] as Coords3D
    , objectRadius = 0.15
    , mirrors = [] as MirrorConfig[]
    , reflectionCount = 1
    , allowBacktracking = false
    , colorByDepth = true
    , sizeDecay = 0.85
    , highlightPath = ''
    , showMirror = true
    , showConnector = true
    , showIntermediates = true
    , mirrorOpacity = 0.3
  }: {
    objectType?: ObjectType;
    objectPosition?: Coords3D;
    objectRadius?: number;
    mirrors?: MirrorConfig[];
    reflectionCount?: number;
    allowBacktracking?: boolean;
    colorByDepth?: boolean;
    sizeDecay?: number;
    highlightPath?: string;
    showMirror?: boolean;
    showConnector?: boolean;
    showIntermediates?: boolean;
    mirrorOpacity?: number;
  } = $props();

  // Type for multivector
  type MV = ReturnType<typeof cga.point>;

  // === Mirror construction using cgaMirrors module ===
  function createMirrorMv(m: MirrorConfig): MV {
    if (m.type === 'sphere') {
      return cga.sphere(m.center, m.radius);
    }
    if (m.type === 'plane') {
      // Plane through center point with given normal
      return cga.planeThroughPoint(m.circleNormal, m.center);
    }
    return cga.circle(m.center, m.radius, m.circleNormal);
  }

  // Object center as CGA point (P)
  const objectCenterPt = $derived(cga.point(objectPosition));

  // Real object: either a point or a sphere (IPNS)
  const realObject = $derived.by(() => {
    if (objectType === 'point') return cga.point(objectPosition);
    return cga.sphere(objectPosition, objectRadius);
  });

  // === Computed: All mirror MVs and chained inversions ===
  interface ImageStep {
    mirrorConfig: MirrorConfig;
    mirrorIndex: number;  // 1-based index in mirrors array
    imagedObject: MV;
    imageCenterPt: MV;
    imageCenterCoords: Coords3D;
    label: string;  // Cumulative path label like "PM1M2"
    lastMirrorId: number;  // To optionally skip backtracking
    depth: number;  // Bounce depth (1, 2, 3, ...)
    mixedColor: number;  // Accumulated color from all mirrors in path
  }

  // Color mixing helper - blend two colors
  function mixColors(color1: number, color2: number, ratio: number = 0.5): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    return (r << 16) | (g << 8) | b;
  }

  const imageChain = $derived.by((): ImageStep[] => {
    const allSteps: ImageStep[] = [];
    const enabledMirrors = mirrors.filter(m => m.enabled);
    
    // Build mirror index map (config id -> 1-based display index)
    const mirrorIndexMap = new Map<number, number>();
    mirrors.forEach((m, i) => mirrorIndexMap.set(m.id, i + 1));
    
    // Start with the base object
    interface WorkItem {
      object: MV;
      centerPt: MV;
      label: string;
      lastMirrorId: number | null;
      currentColor: number;  // Track accumulated color
    }
    
    const baseColor = 0x4488ff;  // Blue starting color
    let currentLevel: WorkItem[] = [{
      object: realObject,
      centerPt: objectCenterPt,
      label: 'P',
      lastMirrorId: null,
      currentColor: baseColor
    }];

    // For each bounce, reflect all current images through all mirrors
    for (let bounce = 0; bounce < reflectionCount; bounce++) {
      const nextLevel: WorkItem[] = [];
      
      for (const item of currentLevel) {
        for (const m of enabledMirrors) {
          // Skip reflecting back through the same mirror unless allowed
          if (!allowBacktracking && m.id === item.lastMirrorId) continue;
          
          const mirrorMv = createMirrorMv(m);
          const mirrorIndex = mirrorIndexMap.get(m.id) ?? 0;
          
          // Build cumulative label
          const newLabel = `${item.label}M${mirrorIndex}`;
          
          // Mix color with mirror color (50/50 blend)
          const newColor = mixColors(item.currentColor, m.color, 0.5);
          
          // Invert the object and center point through mirror
          const imagedObject = cga.invert(item.object, mirrorMv);
          const imageCenterPt = cga.invert(item.centerPt, mirrorMv);
          const imageCenterCoords = cga.down(imageCenterPt);

          const step: ImageStep = {
            mirrorConfig: m,
            mirrorIndex,
            imagedObject,
            imageCenterPt,
            imageCenterCoords,
            label: newLabel,
            lastMirrorId: m.id,
            depth: bounce + 1,
            mixedColor: newColor
          };
          
          allSteps.push(step);
          nextLevel.push({
            object: imagedObject,
            centerPt: imageCenterPt,
            label: newLabel,
            lastMirrorId: m.id,
            currentColor: newColor
          });
        }
      }
      
      currentLevel = nextLevel;
    }

    return allSteps;
  });

  // Filter images by visible depth
  const visibleImages = $derived(
    imageChain.filter(step => step.depth <= reflectionCount)
  );

  // All images at the max visible depth
  const finalBounceImages = $derived(
    visibleImages.filter(step => step.depth === reflectionCount)
  );

  // Intermediate images (all bounces before the max visible)
  const intermediateImages = $derived(
    visibleImages.filter(step => step.depth < reflectionCount)
  );

  // Depth color palette (rainbow-ish)
  const DEPTH_COLORS = [
    0x4488ff,  // depth 0 - blue (real object)
    0xff6622,  // depth 1 - orange
    0x44cc44,  // depth 2 - green
    0xcc44cc,  // depth 3 - magenta
    0xcccc44,  // depth 4 - yellow
    0x44cccc,  // depth 5 - cyan
    0xff4444,  // depth 6 - red
    0x8844ff,  // depth 7 - purple
    0xff8844,  // depth 8 - orange-red
    0x44ff88,  // depth 9 - green-cyan
    0x8888ff,  // depth 10 - light blue
  ];

  function getDepthColor(depth: number): number {
    if (!colorByDepth) return depth === reflectionCount ? 0xff6622 : 0xffaa66;
    return DEPTH_COLORS[depth % DEPTH_COLORS.length];
  }

  function getStepColor(step: ImageStep): number {
    return colorByDepth ? getDepthColor(step.depth) : step.mixedColor;
  }

  function getDepthRadius(baseRadius: number, depth: number): number {
    return baseRadius * Math.pow(sizeDecay, depth);
  }

  function isHighlighted(label: string): boolean {
    if (!highlightPath) return false;
    return label === highlightPath || label.startsWith(highlightPath + '·');
  }

  // === Rendering helpers ===
  function renderObject(mv: MV, isPoint: boolean) {
    return isPoint ? mv : mv.dual();
  }
</script>

<!-- ================================================================== -->
<!-- MIRRORS - render each mirror sphere/circle/plane (only once each)  -->
<!-- ================================================================== -->
{#if showMirror}
  {#each mirrors as m, i}
    {#if m.enabled}
      {@const mirrorMv = createMirrorMv(m)}
      {@const mirrorCenterPt = cga.point(m.center)}
      {#if m.type === 'sphere'}
        <RenderMv
          mv={mirrorMv.dual()}
          color={m.color}
          opacity={mirrorOpacity}
          disableHover
        />
      {:else if m.type === 'plane'}
        <!-- Plane IPNS needs to be dualed to OPNS for rendering -->
        <RenderMv
          mv={mirrorMv.dual()}
          color={m.color}
          opacity={mirrorOpacity}
          disableHover
        />
      {:else}
        <!-- Circle -->
        <RenderMv
          mv={mirrorMv}
          color={m.color}
          lineWidth={0.03}
          disableHover
        />
      {/if}
    {/if}
  {/each}
{/if}

<!-- ================================================================== -->
<!-- REAL OBJECT (blue) - the original circle/sphere/point              -->
<!-- ================================================================== -->
<RenderMv
  mv={renderObject(realObject, objectType === 'point')}
  color={getDepthColor(0)}
  radius={objectType === 'point' ? 0.08 : undefined}
  opacity={objectType === 'sphere' ? 0.7 : (highlightPath && !isHighlighted('P') ? 0.2 : 1)}
  hoverLabel="P"
/>

<!-- ================================================================== -->
<!-- INTERMEDIATE IMAGES - show each step in the chain                  -->
<!-- ================================================================== -->
{#if showIntermediates && intermediateImages.length > 0}
  {#each intermediateImages as step}
    {@const highlighted = isHighlighted(step.label)}
    {@const dimmed = highlightPath && !highlighted}
    <!-- Intermediate image -->
    <RenderMv
      mv={renderObject(step.imagedObject, objectType === 'point')}
      color={getStepColor(step)}
      radius={objectType === 'point' ? getDepthRadius(0.06, step.depth) : undefined}
      opacity={dimmed ? 0.15 : (objectType === 'sphere' ? 0.5 : 0.7)}
      hoverLabel={step.label}
    />
  {/each}
{/if}

<!-- ================================================================== -->
<!-- FINAL IMAGES - all images at the deepest visible level             -->
<!-- ================================================================== -->
{#each finalBounceImages as step}
  {@const highlighted = isHighlighted(step.label)}
  {@const dimmed = highlightPath && !highlighted}
  <RenderMv
    mv={renderObject(step.imagedObject, objectType === 'point')}
    color={getStepColor(step)}
    radius={objectType === 'point' ? getDepthRadius(0.07, step.depth) : undefined}
    opacity={dimmed ? 0.15 : (objectType === 'sphere' ? 0.7 : 1)}
    hoverLabel={step.label}
  />
{/each}

<!-- ================================================================== -->
<!-- RADIAL LINES - connect parent to child in the reflection tree      -->
<!-- ================================================================== -->
{#if showConnector}
  {@const labelToCenterMap = new Map(visibleImages.map(s => [s.label, s.imageCenterPt]))}
  {@const labelToStepMap = new Map(visibleImages.map(s => [s.label, s]))}
  {#each visibleImages as step}
    {@const parentLabel = step.label.replace(/M\d+$/, '')}
    {@const parentCenter = parentLabel === 'P' ? objectCenterPt : labelToCenterMap.get(parentLabel)}
    {@const highlighted = isHighlighted(step.label)}
    {@const dimmed = highlightPath && !highlighted}
    {#if parentCenter}
      <RenderMv
        mv={[parentCenter, step.imageCenterPt]}
        color={highlighted ? getStepColor(step) : 0x666666}
        lineWidth={highlighted ? 0.012 : 0.006}
        opacity={dimmed ? 0.1 : 1}
        disableHover
      />
    {/if}
  {/each}
{/if}
