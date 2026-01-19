<script lang="ts">
  /**
   * JimmyAnimation.svelte - PGA Motor Skinning with $derived computation chain
   * useTask only updates frame indices and lerp factors
   */

  import { T, useTask } from '@threlte/core';
  import { pga, e0, e1, e2, e3, e12, e23, e13, one, e01, e02, e03 } from '../algebra/pga';
  import type { Multivector as MV } from '../algebra/types.js';
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  // Props
  interface Props {
    animWeights?: number[];
    speed?: number;
    debugNoSkinning?: boolean;
    debugIdentity?: boolean;
  }
  let {
    animWeights = $bindable([1, 0, 0, 0, 0, 0]),
    speed = 1.0,
    debugNoSkinning = false,
    debugIdentity = false
  }: Props = $props();

  // Types
  interface Bone {
    name: string;
    parent: number;  // index into bones array, -1 for root
    position: number[];
    rotation: number[];
    anim: MV[];      // rotors per frame
    orig: MV;
    bindPose: MV;
  }

  // Animation ranges: [start, len, offset] for Walk, Jump, Run, Stride, Idle, Zombie
  const AR: [number, number, number][] = [[0,33,0],[57,65,0],[34,22,0],[124,38,20],[164,54,0],[219,64,0]];

  // Mesh data (loaded once)
  let loaded = $state(false);
  let geo: THREE.BufferGeometry | null = $state(null);
  let posAttr = $state<THREE.BufferAttribute | null>(null);
  let B: Bone[] = [];      // bones
  let P: MV[] = [];        // points as MVs
  let W: number[][] = [];  // weights per vertex
  let BI: number[][] = []; // bone indices per vertex
  let rawVerts: number[] = [];

  // Animation frame state - ONLY these are updated in useTask
  let animIdx = $state([0, 0, 0, 0, 0, 0]);  // frame indices for all 6 animations
  let animT = $state([0, 0, 0, 0, 0, 0]);    // lerp factors for all 6 animations
  let time = 0;

  // Cached motor functions
  const m13 = e13.motor(), m23 = e23.motor(), m12 = e12.motor();
  const m01 = e01.motor(), m02 = e02.motor(), m03 = e03.motor();
  const hpb = ([h,p,b]: number[]) => m13(h*.5).gp(m23(-p*.5)).gp(m12(-b*.5));
  const xyz = (v: number[]) => m01(-v[0]*.5).gp(m02(-v[1]*.5)).gp(m03(-v[2]*.5));

  // Normalized weights - derived from props
  const normW = $derived.by(() => {
    const sum = animWeights.reduce((a,b) => a+b, 0) || 1;
    return animWeights.map(w => w/sum);
  });

  // Animation rotors at frame boundaries - recomputes when animIdx changes
  const animRotorsCurr = $derived(loaded ? AR.map((_, a) => B.map(b => b.anim[animIdx[a]])) : []);
  const animRotorsNext = $derived.by(() => {
    if (!loaded) return [];
    return AR.map(([s, l], a) => {
      const nextIdx = ((animIdx[a] + 1 - s) % l) + s;
      return B.map(b => b.anim[nextIdx]);
    });
  });

  // Blended bone rotors - recomputes when animT or weights change
  const blendedRotors = $derived.by(() => {
    if (!loaded) return [];
    return B.map((_, bi) => {
      let m: MV | null = null;
      for (let a = 0; a < 6; a++) {
        if (normW[a] > 0.001) {
          const w = normW[a], t = animT[a];
          const blend = animRotorsCurr[a][bi].smul((1 - t) * w).add(animRotorsNext[a][bi].smul(t * w));
          m = m ? m.add(blend) : blend;
        }
      }
      return m || B[bi].orig;
    });
  });

  // Bone transforms (totR * bindPose) - recomputes when blendedRotors change
  const boneTransforms = $derived.by(() => {
    if (!loaded || debugIdentity) return B.map(() => one);
    
    // Compute totR for each bone (recursive through parent chain)
    const totRs: MV[] = [];
    for (let i = 0; i < B.length; i++) {
      const b = B[i];
      totRs[i] = b.parent >= 0 ? totRs[b.parent].gp(blendedRotors[i]) : blendedRotors[i];
    }
    return B.map((b, i) => totRs[i].gp(b.bindPose));
  });

  // Skinned vertex positions - recomputes when boneTransforms change
  const skinnedPositions = $derived.by(() => {
    if (!loaded) return null;
    if (debugNoSkinning) return rawVerts;
    
    const pos = new Float32Array(P.length * 3);
    for (let i = 0; i < P.length; i++) {
      const w = W[i], bi = BI[i];
      // Blend bone transforms
      let m = boneTransforms[bi[0]].smul(w[0]);
      for (let j = 1; j < 4; j++) m = m.add(boneTransforms[bi[j]].smul(w[j]));
      // Apply to point
      const p = m.normalize().sandwich(P[i]);
      const pw = p.basisSVal('e_123');
      if (Math.abs(pw) > 1e-6) {
        pos[i*3] = -p.basisSVal('e_023') / pw;
        pos[i*3+1] = p.basisSVal('e_013') / pw;
        pos[i*3+2] = -p.basisSVal('e_012') / pw;
      }
    }
    return pos;
  });

  onMount(async () => {
    const d = await (await fetch('/slides/jimmy_anim.json')).json();
    rawVerts = d.vertices;
    
    // Build bones with parent indices and pre-computed rotors
    const boneByName = new Map<string, number>();
    d.bones.forEach((b: any, i: number) => boneByName.set(b.name, i));
    
    B = d.bones.map((b: any, i: number) => {
      const orig = xyz(b.position).gp(hpb(b.rotation));
      return {
        name: b.name,
        parent: boneByName.get(b.parent) ?? -1,
        position: b.position,
        rotation: b.rotation,
        anim: b.anim.map((r: number[], j: number) => 
          orig.gp(xyz(b.animT?.[j] || [0,0,0])).gp(hpb(r))
        ),
        orig,
        bindPose: one  // placeholder, computed below
      };
    });
    
    // Compute bind poses (need totR which needs parent chain)
    const totR = (i: number): MV => B[i].parent >= 0 ? totR(B[i].parent).gp(B[i].orig) : B[i].orig;
    B.forEach((b, i) => b.bindPose = totR(i).reverse());
    
    // Setup vertices
    const n = d.vertices.length / 3;
    for (let i = 0; i < n; i++) {
      const v = d.vertices.slice(i*3, i*3+3);
      P.push(e0.add(e1.smul(v[0])).add(e2.smul(v[1])).add(e3.smul(v[2])).dual());
      W.push(d.weights.slice(i*4, i*4+4));
      BI.push([...d.boneIndices.slice(i*4, i*4+4)]);
    }
    
    // Setup geometry
    const pos = new Float32Array(n * 3);
    posAttr = new THREE.BufferAttribute(pos, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', posAttr);
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(d.normals), 3));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(d.triangleIndices), 1));
    geo = g;
    loaded = true;
  });

  // $effect: copy derived positions to buffer when they change
  $effect(() => {
    if (!posAttr || !skinnedPositions) return;
    const pos = posAttr.array as Float32Array;
    if (skinnedPositions instanceof Float32Array) {
      pos.set(skinnedPositions);
    } else {
      for (let i = 0; i < skinnedPositions.length; i++) pos[i] = skinnedPositions[i];
    }
    posAttr.needsUpdate = true;
  });

  // useTask ONLY updates frame indices and lerp factors
  useTask((delta) => {
    if (!loaded) return;
    
    time += delta * speed;
    const wf = (time * 20) % AR[0][1];  // walk frame (reference)
    
    for (let a = 0; a < 6; a++) {
      const [s, l, o] = AR[a];
      const af = (((wf / AR[0][1] * l) + o) % l) + s;
      animIdx[a] = Math.floor(af);
      animT[a] = af - animIdx[a];
    }
    animIdx = animIdx;
    animT = animT;
  });
</script>

{#if loaded && geo}
  <T.Group rotation.y={Math.PI} position.y={-0.95}>
    <T.Mesh geometry={geo}>
      <T.MeshStandardMaterial color={0xffa200} roughness={0.6} metalness={0.2} side={THREE.DoubleSide} />
    </T.Mesh>
  </T.Group>
{/if}
