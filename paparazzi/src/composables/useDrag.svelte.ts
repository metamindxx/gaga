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
import { Coords3D } from '../primitives/types';
import { Multivector as MV } from '../algebra/types.js';
import { enableOrbit, disableOrbit } from '../stores/orbitControl';

export interface UseDragOptions {
  /** Get the current position to create the drag plane through */
  getPosition: () => Coords3D;
  /** Called with new position when dragged */
  onDrag: (position: Coords3D) => void;
  /** Called when drag starts (optional) */
  onDragStart?: () => void;
  /** Called when drag ends (optional) */
  onDragEnd?: () => void;
  /** Optional constraint plane [normal, pointOnPlane] - if provided, drag is locked to this plane */
  constraintPlane?: [Coords3D, Coords3D] | MV | null;
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

    // Check for constraint plane, otherwise use camera-facing plane
    const constraint = options.constraintPlane;
    if (!constraint) {
      // Default: create drag plane facing camera, passing through current position
      const cameraDir = new THREE.Vector3();
      camera.current.getWorldDirection(cameraDir);
      const pos = options.getPosition();
      dragPlane.setFromNormalAndCoplanarPoint(cameraDir, new THREE.Vector3(...pos));
    } else if (Array.isArray(constraint)) {
      // Array format: [normal, pointOnPlane]
      const [normal, pointOnPlane] = constraint;
      dragPlane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(...normal).normalize(),
        new THREE.Vector3(...pointOnPlane)
      );
    } else if (typeof constraint === 'object' && constraint.classify) {
      // MV format: extract normal and point from plane classification
      const classification = constraint.classify?.();
      if (classification?.type === 'plane') {
        dragPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(...classification.normal).normalize(),
          new THREE.Vector3(...classification.point)
        );
      } else {
        console.warn('useDrag: constraintPlane MV is not a plane, falling back to camera plane');
        const cameraDir = new THREE.Vector3();
        camera.current.getWorldDirection(cameraDir);
        const pos = options.getPosition();
        dragPlane.setFromNormalAndCoplanarPoint(cameraDir, new THREE.Vector3(...pos));
      }
    }

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
    onPointerDown,
    onPointerMove,
    onPointerUp,
    get isDragging() {
      return isDragging;
    },
  };
}
