/**
 * useDrag - Composable for 3D drag interactions
 *
 * Handles raycasting to a camera-facing plane and calls back with new positions.
 * Automatically disables/enables orbit controls during drag.
 *
 * Usage:
 *   const drag = useDrag({
 *     getPosition: () => cga.down(myPoint) ?? [0, 0, 0],
 *     onDrag: (pos) => { myPoint = cga.up(pos); }
 *   });
 *
 *   <T.Mesh onpointerdown={drag.onPointerDown}>
 *   <svelte:window onpointermove={drag.onPointerMove} onpointerup={drag.onPointerUp} />
 */

import { useThrelte } from '@threlte/core';
import * as THREE from 'three';
import { enableOrbit, disableOrbit } from '../stores/orbitControl';
import type { Coords3D } from '../primitives/types';

export interface UseDragOptions {
  /** Get the current position to create the drag plane through */
  getPosition: () => Coords3D;
  /** Called with new position when dragged */
  onDrag: (position: Coords3D) => void;
  /** Called when drag starts (optional) */
  onDragStart?: () => void;
  /** Called when drag ends (optional) */
  onDragEnd?: () => void;
}

export interface UseDragReturn {
  /** Attach to mesh's onpointerdown */
  onPointerDown: (event: { stopPropagation: () => void }) => void;
  /** Attach to svelte:window onpointermove */
  onPointerMove: (event: PointerEvent) => void;
  /** Attach to svelte:window onpointerup */
  onPointerUp: () => void;
  /** Reactive getter for drag state */
  readonly isDragging: boolean;
}

export function useDrag(options: UseDragOptions): UseDragReturn {
  const { camera, renderer } = useThrelte();

  // Drag state
  let isDragging = $state(false);

  // Reusable THREE objects (avoid allocations during drag)
  const dragPlane = new THREE.Plane();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const intersection = new THREE.Vector3();

  function onPointerDown(event: { stopPropagation: () => void }) {
    isDragging = true;
    disableOrbit();

    // Create drag plane facing camera, passing through current position
    const cameraDir = new THREE.Vector3();
    camera.current.getWorldDirection(cameraDir);
    const pos = options.getPosition();
    dragPlane.setFromNormalAndCoplanarPoint(cameraDir, new THREE.Vector3(...pos));

    event.stopPropagation();
    options.onDragStart?.();
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging) return;

    // Convert screen coords to normalized device coords
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to drag plane
    raycaster.setFromCamera(pointer, camera.current);
    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
      options.onDrag([intersection.x, intersection.y, intersection.z]);
    }
  }

  function onPointerUp() {
    if (isDragging) {
      isDragging = false;
      enableOrbit();
      options.onDragEnd?.();
    }
  }

  return {
    onPointerDown
    , onPointerMove
    , onPointerUp
    , get isDragging() {
      return isDragging;
    }
  };
}
