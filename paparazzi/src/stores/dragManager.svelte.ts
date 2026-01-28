/**
 * Drag Manager - Singleton for efficient 3D drag interactions
 * Single set of window event listeners, dispatches to active drag session.
 */

import * as THREE from 'three';
import type { Coords3D } from '../geometry/primitives';
import type { Multivector as MV } from '../algebra/types.js';
import { enableOrbit, disableOrbit } from './orbitControl.svelte';

// Types
export interface DragSession {
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  getPosition: () => Coords3D;
  onDrag: (position: Coords3D) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  constraintPlane?: [Coords3D, Coords3D] | MV | null;
}

// State
let listenersAttached = false;
let activeSession: DragSession | null = null;
const dragPlane = new THREE.Plane();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const intersection = new THREE.Vector3();

// Event Handlers
function handlePointerMove(event: PointerEvent) {
  if (!activeSession) return;
  const { camera, renderer, onDrag } = activeSession;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
    onDrag([intersection.x, intersection.y, intersection.z]);
  }
}

function handlePointerUp() {
  if (!activeSession) return;
  const { onDragEnd } = activeSession;
  activeSession = null;
  enableOrbit();
  onDragEnd?.();
}

function ensureListeners() {
  if (listenersAttached) return;
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  listenersAttached = true;
}

function setupDragPlane(session: DragSession) {
  const { camera, getPosition, constraintPlane } = session;

  if (!constraintPlane) {
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    dragPlane.setFromNormalAndCoplanarPoint(cameraDir, new THREE.Vector3(...getPosition()));
  } else if (Array.isArray(constraintPlane)) {
    const [normal, pointOnPlane] = constraintPlane;
    dragPlane.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(...normal).normalize()
      , new THREE.Vector3(...pointOnPlane)
    );
  } else if (typeof constraintPlane === 'object' && constraintPlane.classify) {
    const classification = constraintPlane.classify?.();
    if (classification?.type === 'plane') {
      dragPlane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(...classification.normal).normalize()
        , new THREE.Vector3(...classification.point)
      );
    } else {
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      dragPlane.setFromNormalAndCoplanarPoint(cameraDir, new THREE.Vector3(...getPosition()));
    }
  }
}

// Public API
export function startDrag(session: DragSession) {
  ensureListeners();
  if (activeSession) {
    activeSession.onDragEnd?.();
    enableOrbit();
  }
  activeSession = session;
  disableOrbit();
  setupDragPlane(session);
  session.onDragStart?.();
}

export function cancelDrag() {
  if (activeSession) {
    activeSession = null;
    enableOrbit();
  }
}

export function getIsDragging() {
  return activeSession !== null;
}

export const dragManager = {
  startDrag
  , cancelDrag
  , get isDragging() {
    return getIsDragging();
  }
};
