<script lang="ts">
  /**
   * JsonScene.svelte - Renders a scene from a v4 JSON file
   */

  import { T, useTask } from '@threlte/core';
  import { untrack } from 'svelte';
  import * as THREE from 'three';
  import {
    resolveScene
    , applyAnimation
    , animationDuration
    , type JsonScene
    , type ResolvedScene
    , type ResolvedPart
  } from './jsonSceneLoader';
  import { config, stopAnimation, resetRequests } from './jsonSceneState.svelte';

  // Props
  interface Props {
    sceneData?: JsonScene | null;
    activeAnimations?: Record<string, boolean>;
    speed?: number;
    scale?: number;
  }
  let {
    sceneData = null
    , activeAnimations = {}
    , speed = 1.0
    , scale = 1.0
  }: Props = $props();

  // State
  let loaded = $state(false);
  let data = $state<JsonScene | null>(null);
  let scene = $state<ResolvedScene | null>(null);
  let parts = $state<ResolvedPart[]>([]);
  /** Per-animation elapsed time */
  let animTimes: Record<string, number> = {};

  // Decomposed transforms for each part (position + quaternion + scale)
  let transforms = $state<
    { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 }[]
  >([]);

  function decomposeTransforms() {
    if (!scene) return;
    transforms = scene.parts.map((p) => {
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scl = new THREE.Vector3();
      p.worldMatrix.decompose(pos, quat, scl);
      // Apply scene scale
      pos.multiplyScalar(scale);
      scl.multiplyScalar(scale);
      return { position: pos, quaternion: quat, scale: scl };
    });
  }

  function loadData(d: JsonScene) {
    data = d;
    scene = resolveScene(d);
    parts = scene.parts;
    animTimes = {};
    config.animationNames = d.animations ? Object.keys(d.animations) : [];
    decomposeTransforms();
    loaded = true;
  }

  // React to sceneData prop changes (file upload)
  // untrack prevents loadData's $state writes from re-triggering this effect
  $effect(() => {
    const sd = sceneData;
    if (sd) untrack(() => loadData(sd));
  });

  // Animation loop — runs all active animations simultaneously
  useTask((delta) => {
    if (!loaded || !data || !scene) return;

    let anyApplied = false;
    for (const [name, active] of Object.entries(activeAnimations)) {
      if (!active) continue;

      const anim = data.animations?.[name];
      if (!anim) continue;

      // Reset elapsed time if requested (e.g. re-click on a finished one-shot)
      if (resetRequests.has(name)) {
        animTimes[name] = 0;
        resetRequests.delete(name);
      }

      // Initialise elapsed time for this animation if needed
      if (animTimes[name] === undefined) animTimes[name] = 0;
      animTimes[name] += delta * speed;

      const duration = animationDuration(anim);
      if (duration <= 0) continue;

      const loops = anim.loop !== false; // default true

      if (loops) {
        animTimes[name] = animTimes[name] % duration;
      } else if (animTimes[name] >= duration) {
        // Clamp to end, apply final frame, then stop
        animTimes[name] = duration;
        applyAnimation(scene, data, name, duration);
        stopAnimation(name);
        anyApplied = true;
        continue;
      }

      applyAnimation(scene, data, name, animTimes[name]);
      anyApplied = true;
    }

    if (anyApplied) decomposeTransforms();
  });

  // Random colors for parts without materials
  function partColor(index: number): THREE.Color {
    const hue = (index * 0.618033988749895) % 1;
    return new THREE.Color().setHSL(hue, 0.5, 0.5);
  }
</script>

{#if loaded}
  {#each parts as part, i}
    {@const t = transforms[i]}
    {@const mat = part.material as THREE.MeshStandardMaterial}
    {@const hasColor = mat && mat.color && !(mat.color.r === 0.6 && mat.color.g === 0.6 && mat.color.b === 0.6)}
    {#if t}
      <T.Mesh
        geometry={part.geometry}
        position={[t.position.x, t.position.y, t.position.z]}
        quaternion={[t.quaternion.x, t.quaternion.y, t.quaternion.z, t.quaternion.w]}
        scale={[t.scale.x, t.scale.y, t.scale.z]}
      >
        <T.MeshStandardMaterial
          color={hasColor ? mat.color : partColor(i)}
          roughness={hasColor ? mat.roughness : 0.6}
          metalness={hasColor ? mat.metalness : 0.1}
        />
      </T.Mesh>
    {/if}
  {/each}
{/if}
