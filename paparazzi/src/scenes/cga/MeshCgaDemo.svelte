<script lang="ts">
  /**
   * MeshCgaDemo - load a .glb model and treat its vertices as CGA points.
   *
   * The pipeline (all the heavy lifting lives in meshToCga.ts):
   *   .glb > THREE scene > world vertices > centre + scale > cga.up(...) points
   *
   * The lifted CGA point array (`cgaPoints`) is the main data here; the
   * rendered cloud is just a round-trip (cga.up -> cga.down) to confirm the
   * conformal embedding is faithful.
   */

  import { T } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

  import { config } from './meshCgaState.svelte';
  import {
    extractVertices
    , normalizeVertices
    , downsample
    , liftToCgaPoints
    , lowerToCoords
    , computeContourSegments
    , type MeshVertices
  } from './meshToCga';
  import * as cgaM from './cgaMirrors';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import { Color } from 'three';

  interactivity();

  // === Parse the picked file ===============================================
  const loader = new GLTFLoader();

  let root = $state<THREE.Object3D | null>(null);
  let loading = $state(false);
  let loadError = $state<string | null>(null);

  $effect(() => {
    const buffer = config.fileBuffer;
    if (!buffer) {
      root = null;
      return;
    }

    let cancelled = false;
    loading = true;
    loadError = null;

    // GLTFLoader.parse handles both binary (.glb) and JSON (.gltf) buffers.
    loader.parse(
      buffer
      , ''
      , (gltf) => {
        if (cancelled) return;
        root = gltf.scene;
        loading = false;
      }
      , (err) => {
        if (cancelled) return;
        loadError = err instanceof Error ? err.message : String(err);
        loading = false;
      }
    );

    return () => {
      cancelled = true;
    };
  });

  // === Mesh to CGA pipeline =================================================
  const mesh = $derived<MeshVertices | null>(root ? extractVertices(root) : null);
  const normalized = $derived(mesh ? normalizeVertices(mesh, config.fitSize) : []);
  const sampled = $derived(downsample(normalized, config.maxPoints));

  /** The conformal model proper: one CGA null vector per sampled vertex. */
  const cgaPoints = $derived(liftToCgaPoints(sampled));

  /** Round-trip cga.down for rendering (confirms up/down fidelity). */
  const coords = $derived(lowerToCoords(cgaPoints));

  // === Cutting plane (CGA) =================================================
  /** IPNS plane Π = n̂ + d·n∞, or null if the normal is degenerate. */
  const planeIPNS = $derived.by(() => {
    const { nx, ny, nz, distance } = config.plane;
    if (nx * nx + ny * ny + nz * nz < 1e-12) return null;
    return cgaM.plane([nx, ny, nz], distance);
  });

  /** The same plane in OPNS form (grade 4), which is what classify/RenderMv want. */
  const planeOPNS = $derived(planeIPNS ? cgaM.dual(planeIPNS) : null);

  /**
   * All mesh vertices as CGA points (full topology, NOT downsampled).
   * Cached off `normalized` so plane edits don't re-run cga.up per vertex.
   */
  const meshCgaPoints = $derived(normalized.length ? liftToCgaPoints(normalized) : []);

  /**
   * Which side of the plane each vertex falls on, determined from the
   * sign of the CGA inner product P · Π:  +1 one side, -1 the other, 0 on it.
   */
  const sides = $derived.by<number[]>(() => {
    const Pi = planeIPNS;
    if (!Pi) return [];
    return cgaPoints.map((P) => {
      const s = P.dot(Pi).basisSVal('e_') ?? 0;
      return s > 1e-9 ? 1 : s < -1e-9 ? -1 : 0;
    });
  });

  /**
   * Intersection contour: meet the plane with every crossed triangle edge
   * (CGA meet to flat point), yielding line segments along the cut.
   */
  const contour = $derived.by<number[]>(() => {
    if (!config.showContour || !mesh || !planeIPNS || meshCgaPoints.length === 0) return [];
    return computeContourSegments(meshCgaPoints, mesh.indices, planeIPNS);
  });

  // === Geometries =====
  let pointsGeometry = $state<THREE.BufferGeometry | null>(null);
  let wireGeometry = $state<THREE.WireframeGeometry | null>(null);

  $effect(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(coords.length * 3);
    for (let i = 0; i < coords.length; i++) {
      arr[i * 3] = coords[i][0];
      arr[i * 3 + 1] = coords[i][1];
      arr[i * 3 + 2] = coords[i][2];
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));

    // Per-vertex colors when classifying by plane side.
    if (config.colorBySide && sides.length === coords.length) {
      const base = new Color(config.pointColor);
      const pos = new Color(config.posColor);
      const neg = new Color(config.negColor);
      const col = new Float32Array(coords.length * 3);
      for (let i = 0; i < coords.length; i++) {
        const c = sides[i] > 0 ? pos : sides[i] < 0 ? neg : base;
        col[i * 3] = c.r;
        col[i * 3 + 1] = c.g;
        col[i * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    }

    pointsGeometry = g;
    return () => g.dispose();
  });

  $effect(() => {
    if (!config.showWireframe || !mesh || normalized.length === 0) {
      wireGeometry = null;
      return;
    }
    const tri = new THREE.BufferGeometry();
    const arr = new Float32Array(normalized.length * 3);
    for (let i = 0; i < normalized.length; i++) {
      arr[i * 3] = normalized[i][0];
      arr[i * 3 + 1] = normalized[i][1];
      arr[i * 3 + 2] = normalized[i][2];
    }
    tri.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    tri.setIndex(mesh.indices);
    const wire = new THREE.WireframeGeometry(tri);
    tri.dispose();
    wireGeometry = wire;
    return () => wire.dispose();
  });

  let contourGeometry = $state<THREE.BufferGeometry | null>(null);
  $effect(() => {
    if (contour.length === 0) {
      contourGeometry = null;
      return;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(contour), 3));
    contourGeometry = g;
    return () => g.dispose();
  });

  // === Stats ===============================================================
  $effect(() => {
    config.stats.totalVertices = mesh?.positions.length ?? 0;
    config.stats.cgaPoints = cgaPoints.length;
    config.stats.loading = loading;
    config.stats.error = loadError;
    config.stats.posCount = sides.reduce((n, s) => n + (s > 0 ? 1 : 0), 0);
    config.stats.negCount = sides.reduce((n, s) => n + (s < 0 ? 1 : 0), 0);
    config.stats.contourSegments = contour.length / 6;
  });

</script>

{#if pointsGeometry && config.showPoints}
  <T.Points geometry={pointsGeometry}>
    <T.PointsMaterial
      size={config.pointSize}
      sizeAttenuation={true}
      color={config.pointColor}
      vertexColors={config.colorBySide}
    />
  </T.Points>
{/if}

{#if wireGeometry && config.showWireframe}
  <T.LineSegments geometry={wireGeometry}>
    <T.LineBasicMaterial
      color={config.wireframeColor}
      transparent={true}
      opacity={config.wireframeOpacity}
    />
  </T.LineSegments>
{/if}

{#if planeOPNS && config.showPlane}
  <RenderMv
    mv={planeOPNS}
    color={config.planeColor}
    opacity={config.planeOpacity}
    disableHover
  />
{/if}

{#if contourGeometry && config.showContour}
  <T.LineSegments geometry={contourGeometry}>
    <T.LineBasicMaterial color={config.contourColor} />
  </T.LineSegments>
{/if}

<!-- Simple ground reference -->
<T.GridHelper args={[4, 16, 0x333333, 0x222222]} position={[0, -1.01, 0]} />
