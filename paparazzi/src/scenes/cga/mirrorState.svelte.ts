/**
 * CGA Mirror Scene - State
 *
 * Configures the mirror demonstration:
 * - Real object (point or small sphere/circle)
 * - Multiple mirrors (sphere or circle) with individual parameters
 * - Chained inversions: object → mirror1 → image1 → mirror2 → image2 → ...
 *
 * In CGA, inversion through a sphere M maps any "round" to another round:
 *   X' = M · X · M  (sandwich product)
 */

import type { Coords3D } from '../../geometry/primitives';

export type MirrorType = 'sphere' | 'circle' | 'plane';
export type ObjectType = 'point' | 'sphere';

export interface MirrorConfig {
  id: number;
  type: MirrorType;
  center: Coords3D;      // For sphere/circle: center. For plane: point on plane
  radius: number;        // For sphere/circle only
  circleNormal: Coords3D; // For circle: normal to plane. For plane: plane normal
  color: number;
  enabled: boolean;
}

// Color palette for mirrors
const MIRROR_COLORS = [
  0x44aa44 // green
  , 0xaa44aa // purple
  , 0xaaaa44 // yellow
  , 0x44aaaa // cyan
  , 0xaa4444 // red
  , 0x4444aa // blue
];

let nextMirrorId = 1;

export function createMirror(overrides: Partial<MirrorConfig> = {}): MirrorConfig {
  const id = nextMirrorId++;
  return {
    id
    , type: 'sphere'
    , center: [0, 0, 0]
    , radius: 1.0
    , circleNormal: [0, 0, 1]
    , color: MIRROR_COLORS[(id - 1) % MIRROR_COLORS.length]
    , enabled: true
    , ...overrides
  };
}

export const config = $state({
  // Real object configuration - point P at (0.5, 0.5) from GeoGebra
  objectType: 'sphere' as ObjectType
  , objectPosition: [0.5, 0.5, 0] as Coords3D
  , objectRadius: 0.05

  // Multiple mirrors - start with something similiar to the GeoGebra demo setup
  , mirrors: [
    createMirror({ center: [0, 0, 0], radius: 1.005, color: 0x669900 })          // green - large circle at origin
    , createMirror({ center: [0.5, 0.75, 0], radius: 0.245, color: 0xff7f00 })   // orange
    , createMirror({ center: [0.67, 1, 0], radius: 0.332, color: 0x0000ff })     // blue
    , createMirror({ type: 'plane', center: [0.5, 0, 0], circleNormal: [1, 0, 0], color: 0xffd700 }) // gold - vertical line at x=0.5
  ]

  // Currently selected mirror for editing
  , selectedMirrorId: 1

  // Bounce count (how many times to reflect through each mirror)
  , reflectionCount: 3

  // Exploration controls
  , allowBacktracking: false  // Allow reflecting back through same mirror
  , colorByDepth: true        // Different colors per depth level
  , sizeDecay: 0.85           // Scale factor for point size per depth (1 = no decay)
  , highlightPath: ''         // Highlight a specific path (e.g., 'P·M1·M2')

  // Display options
  , showMirror: true
  , showConnector: true
  , showIntermediates: true  // Show intermediate images between mirrors
  , mirrorOpacity: 0.3
});

export function addMirror() {
  const newMirror = createMirror({
    center: [0.3 * config.mirrors.length, 0, 0]
    , radius: 0.8
  });
  config.mirrors = [...config.mirrors, newMirror];
  config.selectedMirrorId = newMirror.id;
}

export function removeMirror(id: number) {
  if (config.mirrors.length <= 1) return; // Keep at least one mirror
  config.mirrors = config.mirrors.filter(m => m.id !== id);
  if (config.selectedMirrorId === id) {
    config.selectedMirrorId = config.mirrors[0].id;
  }
}

export function getSelectedMirror(): MirrorConfig | undefined {
  return config.mirrors.find(m => m.id === config.selectedMirrorId);
}

export function updateMirror(id: number, updates: Partial<MirrorConfig>) {
  config.mirrors = config.mirrors.map(m => 
    m.id === id ? { ...m, ...updates } : m
  );
}

export function getSceneProps() {
  return {
    objectType: config.objectType
    , objectPosition: config.objectPosition
    , objectRadius: config.objectRadius
    , mirrors: config.mirrors
    , reflectionCount: config.reflectionCount
    , allowBacktracking: config.allowBacktracking
    , colorByDepth: config.colorByDepth
    , sizeDecay: config.sizeDecay
    , highlightPath: config.highlightPath
    , showMirror: config.showMirror
    , showConnector: config.showConnector
    , showIntermediates: config.showIntermediates
    , mirrorOpacity: config.mirrorOpacity
  };
}
