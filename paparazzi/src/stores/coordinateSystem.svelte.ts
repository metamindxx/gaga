/**
 * Coordinate system state and helpers.
 *
 * "three" keeps the default Three.js orientation (Y-up, grid on XZ).
 * "physics" switches to Z-up with the grid on the XY plane.
 */

import { resetKey } from './sceneControls.svelte';

export type CoordSystem = 'three' | 'physics';

let _coordSystem = $state<CoordSystem>('three');

export const coordSystem = {
  get current() {
    return _coordSystem;
  }
  , set current(v: CoordSystem) {
    _coordSystem = v;
  }
  , toggle() {
    _coordSystem = _coordSystem === 'physics' ? 'three' : 'physics';
    resetKey.increment();
  }
};

// Helpers so components can stay declarative.
export function cameraUp(cs: CoordSystem = _coordSystem): [number, number, number] {
  return cs === 'physics' ? [0, 0, 1] : [0, 1, 0];
}

export function cameraPosition(cs: CoordSystem = _coordSystem): [number, number, number] {
  // Physics: Z-up, looking from front-right
  // Three: Y-up, looking from front-right
  return cs === 'physics' ? [3, 6, 1] : [3, 2, 4];
}

export function gridRotation(cs: CoordSystem = _coordSystem): [number, number, number] {
  return cs === 'physics' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
}

export function orbitTarget(cs: CoordSystem = _coordSystem): [number, number, number] {
  return cs === 'physics' ? [0, 0, 0.5] : [0, 0.5, 0];
}

export function groundPlane(cs: CoordSystem = _coordSystem): {
  position: [number, number, number];
  rotation: [number, number, number];
} {
  if (cs === 'physics') {
    // Plane aligned to XY with normal along +Z
    return { position: [0, 0, -10], rotation: [0, 0, 0] };
  }
  // Plane aligned to XZ with normal along +Y
  return { position: [0, -10, 0], rotation: [-Math.PI / 2, 0, 0] };
}
