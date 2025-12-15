/**
 * Store for controlling OrbitControls enabled state
 *
 * Used by draggable components to disable orbit during drag operations
 */

import { writable } from 'svelte/store';

export const orbitEnabled = writable(true);

export function disableOrbit() {
  orbitEnabled.set(false);
}

export function enableOrbit() {
  orbitEnabled.set(true);
}
