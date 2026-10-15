/**
 * Mesh to CGA Demo - State
 *
 * The user picks a .glb/.gltf file and we lift its vertices into CGA
 * conformal points with cga.up. Think of the whole model as a
 * conformal point cloud where you can fit spheres through vertices,
 * invert it, intersect it, and so on.
 */

export const config = $state({
  /** Loaded file buffer (null until the user picks one) */
  fileBuffer: null as ArrayBuffer | null
  , fileName: '' as string

  // --- Normalization ---
  /** Longest side after centring, in world units */
  , fitSize: 2

  // --- Sampling ---
  /** Upper limit on how many vertices we lift to CGA points (0 = all) */
  , maxPoints: 2000

  // --- Rendering ---
  , showPoints: true
  , pointSize: 0.02
  , pointColor: 0x44ccff
  , showWireframe: false
  , wireframeOpacity: 0.15
  , wireframeColor: 0x888888

  // --- Cutting plane (CGA IPNS plane: Π = n̂ + d·n∞) ---
  , plane: {
    /** Which way the plane faces (normalized later) */
    nx: 0
    , ny: 1
    , nz: 0
    /** How far the plane sits from the origin */
    , distance: 0
  }
  , showPlane: true
  , planeOpacity: 0.25
  , planeColor: 0xffcc44
  /** Tint each point by which side of the plane it lands on (the sign of P·Π) */
  , colorBySide: true
  , posColor: 0xff5555 // P·Π > 0  (the side opposite the normal)
  , negColor: 0x55aaff // P·Π < 0

  // --- Intersection contour (where the plane cuts the mesh edges, via CGA meet) ---
  , showContour: true
  , contourColor: 0x00ff88

  // --- Readout ---
  , showStats: true

  // --- Live stats (the demo fills these in as it runs) ---
  , stats: {
    totalVertices: 0
    , cgaPoints: 0
    , loading: false
    , error: null as string | null
    , posCount: 0
    , negCount: 0
    , contourSegments: 0
  }
});

/** Read a File (straight from an <input type=file>) into config.fileBuffer. */
export async function loadFile(file: File): Promise<void> {
  config.stats.loading = true;
  config.stats.error = null;
  try {
    const buf = await file.arrayBuffer();
    config.fileName = file.name;
    config.fileBuffer = buf;
  } catch (err) {
    config.stats.error = err instanceof Error ? err.message : String(err);
    config.stats.loading = false;
  }
}
