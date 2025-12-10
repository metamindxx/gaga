/**
 * Simple Drag - Enables dragging point entities.
 * Algebra-agnostic: just reports 3D position via callback.
 * Works with existing camera/controls.
 */

import * as THREE from "three";

/**
 * Enable dragging for a store + renderer combo.
 * @param {HTMLElement} domElement - The canvas/renderer element
 * @param {THREE.Camera} camera
 * @param {ReturnType<import('./renderer.js').createRenderer>} renderer
 * @param {(entityId: string, position: {x: number, y: number, z: number}) => void} onDrag - Called with entity ID and new 3D position
 * @param {Object} [options]
 * @param {Object} [options.orbitControls] - Your OrbitControls (will disable during drag)
 * @param {string} [options.dragType='point'] - Entity type that can be dragged
 */
export function enableDragging(
  domElement
  , camera
  , renderer
  , onDrag
  , options = {}
) {
  const { orbitControls = null, dragType = "point" } = options;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const intersection = new THREE.Vector3();

  let draggedId = null;

  function getPointer(event) {
    const rect = domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onPointerDown(event) {
    getPointer(event);
    raycaster.setFromCamera(pointer, camera);

    const objects = renderer.getMeshesByType(dragType);
    const hits = raycaster.intersectObjects(objects, false);

    if (hits.length > 0) {
      const hit = hits[0];
      draggedId = hit.object.userData.entityId;

      // Set drag plane perpendicular to camera
      const cameraDir = new THREE.Vector3();
      camera.getWorldDirection(cameraDir);
      dragPlane.setFromNormalAndCoplanarPoint(cameraDir, hit.point);

      if (orbitControls) orbitControls.enabled = false;
      event.preventDefault();
    }
  }

  function onPointerMove(event) {
    if (!draggedId) return;

    getPointer(event);
    raycaster.setFromCamera(pointer, camera);

    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
      // Just report the position - let consumer handle algebra conversion
      onDrag(draggedId, {
        x: intersection.x
        , y: intersection.y
        , z: intersection.z
      });
    }

    event.preventDefault();
  }

  function onPointerUp() {
    if (draggedId) {
      draggedId = null;
      if (orbitControls) orbitControls.enabled = true;
    }
  }

  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("pointerleave", onPointerUp);

  return {
    get isDragging() {
      return draggedId !== null;
    }
    , get draggedEntity() {
      return draggedId;
    }
    , dispose() {
      domElement.removeEventListener("pointerdown", onPointerDown);
      domElement.removeEventListener("pointermove", onPointerMove);
      domElement.removeEventListener("pointerup", onPointerUp);
      domElement.removeEventListener("pointerleave", onPointerUp);
    }
  };
}
