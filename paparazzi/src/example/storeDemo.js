/**
 * 3-Layer Store-based Demo
 *
 * Architecture:
 * 1. Math Layer: basisSet.js (pure GA, no rendering)
 * 2. State Layer: store.js (algebra-agnostic entity store)
 * 3. Render Layer: renderer.js + cgaHandlers.js (Three.js)
 */

import * as THREE from "three";
import { createBasisSet } from "../basisSet.js";
import { createStore } from "../store.js";
import { createRenderer } from "../renderer.js";
import { createCGAHandlers } from "../cgaHandlers.js";
import { enableDragging } from "../drag.js";
import { OrbitControls } from "../controls/OrbitControls.js";

// === Math Layer: Pure CGA ===
function setupCGA() {
  const bs = createBasisSet();
  bs.addBasis("1", +1);
  bs.addBasis("2", +1);
  bs.addBasis("3", +1);
  bs.addBasis("p", +1);
  bs.addBasis("m", -1);
  bs.createCayley();

  return {
    bs
    , n0: bs.multiVector({ e_m: 0.5, e_p: -0.5 })
    , ni: bs.multiVector({ e_m: 1, e_p: 1 })
    , I5: bs.multiVector({ e_123pm: 1 })
  };
}

export function runDemo(containerId = "app") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return;
  }

  // === Three.js Setup ===
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75
    , container.clientWidth / container.clientHeight
    , 0.1
    , 1000
  );
  camera.position.set(3, 3, 3);
  camera.lookAt(0, 0, 0);

  const threeRenderer = new THREE.WebGLRenderer({ antialias: true });
  threeRenderer.setSize(container.clientWidth, container.clientHeight);
  threeRenderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(threeRenderer.domElement);

  scene.add(new THREE.AmbientLight(0x444444));
  const light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(10, 20, 50);
  scene.add(light);
  scene.add(new THREE.AxesHelper(1));

  const controls = new OrbitControls(camera, threeRenderer.domElement);
  controls.enableDamping = true;

  // === Math Layer ===
  const cga = setupCGA();
  const { handlers, up } = createCGAHandlers(cga);

  // === State Layer (algebra-agnostic) ===
  const store = createStore();

  // === Render Layer ===
  const renderer = createRenderer(scene, store, handlers);

  // === Enable Dragging ===
  enableDragging(
    threeRenderer.domElement
    , camera
    , renderer
    // Drag reports 3D position, we convert to CGA here
    , (entityId, pos) => store.update(entityId, { mv: up(pos.x, pos.y, pos.z) })
    , { orbitControls: controls }
  );

  // === Hover Readout ===
  const readout = document.createElement("div");
  readout.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    font-family: monospace;
    white-space: pre;
  `;
  container.appendChild(readout);

  function onHover(event) {
    const rect = threeRenderer.domElement.getBoundingClientRect();

    // Convert DOM client coordinates (top-left origin, y down) to WebGL Normalized Device Coordinates (NDC):
    //  - NDC x,y range is [-1, +1] with origin at canvas center.
    //  - For x: map [0..width] → [-1..1] via ((cx-left)/width)*2 - 1
    //  - For y: DOM y grows downward, while NDC y grows upward, so flip sign and map to [-1..1]:
    //      -((cy-top)/height)*2 + 1  (top → +1, center → 0, bottom → -1)
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const entityMeshes = scene.children.filter((c) => c.userData.entityId);
    const hits = raycaster.intersectObjects(entityMeshes, false);

    if (hits.length === 0) {
      readout.style.display = "none";
      threeRenderer.domElement.style.cursor = "default";
      return;
    }

    const hit = hits[0];
    const entityId = hit.object.userData.entityId;
    const entity = store.get(entityId);

    // Display info
    if (entity) {
      let text = `ID: ${entityId}\nType: ${entity.type}`;

      if (entity.mv) {
        text += `\nMV: ${entity.mv.toStr()}`;
      }

      if (entity.refs) {
        text += `\nRefs: ${entity.refs.join(", ")}`;
      }

      readout.textContent = text;
      readout.style.display = "block";
      threeRenderer.domElement.style.cursor = "pointer";
    }
  }

  threeRenderer.domElement.addEventListener("pointermove", onHover);

  // === Click Info Handler ===
  const raycaster = new THREE.Raycaster();
  // Set threshold for line picking (in world units) - makes lines easier to click
  raycaster.params.Line = { threshold: 0.1 };
  const pointer = new THREE.Vector2();

  function onClick(event) {
    const rect = threeRenderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    // Only raycast against our entity meshes
    const entityMeshes = scene.children.filter((c) => c.userData.entityId);
    const hits = raycaster.intersectObjects(entityMeshes, false);

    if (hits.length === 0) {
      // Clicked on empty space - no log
      return;
    }

    // Find the closest hit
    const hit = hits[0];
    const entityId = hit.object.userData.entityId;
    const entity = store.get(entityId);

    if (entity) {
      console.group(`Entity: ${entityId}`);
      console.log("Type:", entity.type);
      console.log("Distance:", hit.distance.toFixed(3));
      if (entity.mv) {
        console.log("MV:", entity.mv.toString());
      }
      if (entity.refs) {
        console.log("Refs:", entity.refs);
        entity.refs.forEach((refId) => {
          const ref = store.get(refId);
          if (ref?.mv) console.log(`  ${refId}:`, ref.mv.toString());
        });
      }
      console.log("Full entity:", entity);
      console.groupEnd();
    }
  }

  threeRenderer.domElement.addEventListener("click", onClick);

  // === Create Entities ===
  store.add({
    id: "p1"
    , type: "point"
    , mv: up(1, 0, 0)
    , color: 0xff0000
    , size: 0.12
  });
  store.add({
    id: "p2"
    , type: "point"
    , mv: up(0, 1, 0)
    , color: 0x00ff00
    , size: 0.12
  });
  store.add({
    id: "p3"
    , type: "point"
    , mv: up(0, 0, 1)
    , color: 0x0000ff
    , size: 0.12
  });

  store.add({ type: "segment", refs: ["p1", "p2"], color: 0xffff00 });
  store.add({ type: "segment", refs: ["p2", "p3"], color: 0x00ffff });
  store.add({ type: "segment", refs: ["p3", "p1"], color: 0xff00ff });

  store.add({ type: "circle", refs: ["p1", "p2", "p3"], color: 0xffffff });

  // Animated point
  store.add({
    id: "anim"
    , type: "point"
    , mv: up(2, 0, 0)
    , color: 0xffaa00
    , size: 0.08
  });
  store.add({ type: "segment", refs: ["p1", "anim"], color: 0xffaa00 });

  // === Animation Loop ===
  const startTime = performance.now();

  function animate() {
    requestAnimationFrame(animate);

    const t = (performance.now() - startTime) / 1000;
    store.update("anim", {
      // TODO: use a rotor instead
      mv: up(2 * Math.cos(t), 0.5 * Math.sin(t * 2), 2 * Math.sin(t))
    });

    // controls.update();
    threeRenderer.render(scene, camera);
  }

  animate();

  // Handle resize
  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    threeRenderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Return API for console
  return { cga, store, renderer, scene, camera, controls, up };
}

// Run the demo in browser
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("app")) {
      // Clean up any stale canvases from HMR
      document.querySelectorAll("#app canvas").forEach((c) => c.remove());
      // Chuck the demo into window for easy console access (naughty)
      window.demo = runDemo("app");
      console.log(
        'Demo ready. Try: demo.store.update("p1", { mv: demo.up(2, 0, 0) })'
      );
    }
  });
}
