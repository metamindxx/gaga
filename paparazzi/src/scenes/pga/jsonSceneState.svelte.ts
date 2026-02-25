/**
 * JsonScene - State
 *
 * Controls for the v4 JSON scene viewer.
 */

import { SvelteSet } from 'svelte/reactivity';
import type { JsonScene } from './jsonSceneLoader';

export const config = $state({
  activeAnimations: {} as Record<string, boolean>
  , animationNames: [] as string[]
  , speed: 1.0
  , scale: 1.0
  , sceneData: null as JsonScene | null
  , loadedFileName: ''
});

export function getSceneProps() {
  return {
    activeAnimations: config.activeAnimations
    , speed: config.speed
    , scale: config.scale
    , sceneData: config.sceneData
  };
}

/** Toggle an animation on or off. Resets elapsed time when re-activating. */
export function toggleAnimation(name: string) {
  const wasActive = config.activeAnimations[name];
  if (wasActive) {
    config.activeAnimations[name] = false;
  } else {
    // Signal JsonScene to reset this animation's elapsed time
    resetRequests.add(name);
    config.activeAnimations[name] = true;
  }
}

/** Stop an animation (e.g. when a non-looping anim finishes) */
export function stopAnimation(name: string) {
  config.activeAnimations[name] = false;
}

/** Set of animation names that need their elapsed time reset */
export const resetRequests = new SvelteSet<string>();

/** Load a JSON object directly (e.g. from file upload) */
export function loadSceneData(data: JsonScene, fileName: string) {
  config.sceneData = data;
  config.loadedFileName = fileName;
  config.animationNames = data.animations ? Object.keys(data.animations) : [];
  config.activeAnimations = {};
}
