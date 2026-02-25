/**
 * jsonSceneLoader.ts - Load and interpret a v4 scene JSON file
 *
 * Builds a renderable scene graph from flat meshes/nodes/parts maps.
 * Nodes form a transform hierarchy via `parent` references.
 * Parts bind a mesh to a node (with optional offset).
 */

import * as THREE from 'three';

// ============================================================================
// Types matching scene_schema_v4.json
// ============================================================================

export interface JsonScene {
  asset: { version: string; generator?: string };
  meshes?: Record<string, MeshDef>;
  materials?: Record<string, MaterialDef>;
  nodes: Record<string, NodeDef>;
  parts?: Record<string, PartDef>;
  animations?: Record<string, AnimationDef>;
  scenes?: Record<string, { nodes: string[] }>;
  scene?: string;
}

export interface MeshDef {
  primitives: PrimitiveDef[];
}

export interface PrimitiveDef {
  type: 'box' | 'cylinder' | 'sphere' | 'custom';
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    radius?: number;
  };
  /** Axis the primitive extends along: 'x', 'y', or 'z'. Default: 'y'. */
  axis?: 'x' | 'y' | 'z';
  material?: string;
  vertices?: number[];
  normals?: number[];
  triangleIndices?: number[];
}

export interface MaterialDef {
  color?: number[];
  metallic?: number;
  roughness?: number;
}

export interface NodeDef {
  parent?: string;
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  extras?: Record<string, unknown>;
}

export interface PartDef {
  mesh: string;
  node: string;
  offset?: {
    translation?: [number, number, number];
    rotation?: [number, number, number, number];
  };
  extras?: Record<string, unknown>;
}

export interface AnimationDef {
  duration?: number;
  loop?: boolean;
  channels: ChannelDef[];
}

export interface KeyframeDef {
  duration?: number;
  value: number[];
}

export interface ChannelDef {
  node: string;
  path: 'translation' | 'rotation' | 'scale';
  keyframes: KeyframeDef[];
  interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
}

/**
 * Compute absolute times for keyframes from their durations.
 * First keyframe always starts at t=0.
 */
function keyframeAbsoluteTimes(kfs: KeyframeDef[]): { time: number; value: number[] }[] {
  let t = 0;
  return kfs.map((kf) => {
    t += kf.duration ?? 0;
    return { time: t, value: kf.value };
  });
}

/** Total duration of a channel (sum of keyframe durations). */
export function channelDuration(kfs: KeyframeDef[]): number {
  let total = 0;
  for (const kf of kfs) total += kf.duration ?? 0;
  return total;
}

/** Total duration of an animation (explicit or max across channels). */
export function animationDuration(anim: AnimationDef): number {
  if (anim.duration) return anim.duration;
  let max = 0;
  for (const ch of anim.channels) {
    const d = channelDuration(ch.keyframes);
    if (d > max) max = d;
  }
  return max;
}

// ============================================================================
// Resolved types for rendering
// ============================================================================

export interface ResolvedNode {
  id: string;
  def: NodeDef;
  parentId: string | null;
  children: string[];
  /** World transform (accumulated from root) */
  worldMatrix: THREE.Matrix4;
  /** Local transform */
  localMatrix: THREE.Matrix4;
}

export interface ResolvedPart {
  id: string;
  def: PartDef;
  nodeId: string;
  meshId: string;
  /** Final world matrix: node world * offset */
  worldMatrix: THREE.Matrix4;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export interface ResolvedScene {
  nodes: Map<string, ResolvedNode>;
  parts: ResolvedPart[];
  rootNodeIds: string[];
}

// ============================================================================
// Geometry builders
// ============================================================================

function buildGeometry(prim: PrimitiveDef): THREE.BufferGeometry {
  const d = prim.dimensions ?? {};

  switch (prim.type) {
    case 'box': {
      // Convention: length=Z, width=X, height=Y
      const w = d.width ?? d.length ?? 1;
      const h = d.height ?? 1;
      const l = d.length ?? 1;
      return new THREE.BoxGeometry(w, h, l);
    }
    case 'cylinder': {
      const r = d.radius ?? (d.diameter ? d.diameter / 2 : 0.5);
      const len = d.length ?? d.width ?? d.height ?? 1;
      const geo = new THREE.CylinderGeometry(r, r, len, 16);
      // CylinderGeometry extends along Y by default.
      // Rotate geometry into the requested axis if needed.
      const axis = prim.axis;
      if (axis === 'x') {
        geo.rotateZ(Math.PI / 2);
      } else if (axis === 'z') {
        geo.rotateX(Math.PI / 2);
      }
      return geo;
    }
    case 'sphere': {
      const r = d.radius ?? (d.diameter ? d.diameter / 2 : 0.5);
      return new THREE.SphereGeometry(r, 16, 12);
    }
    case 'custom': {
      const geo = new THREE.BufferGeometry();
      if (prim.vertices) {
        geo.setAttribute('position', new THREE.Float32BufferAttribute(prim.vertices, 3));
      }
      if (prim.normals) {
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(prim.normals, 3));
      }
      if (prim.triangleIndices) {
        geo.setIndex(prim.triangleIndices);
      }
      if (!prim.normals && prim.vertices) {
        geo.computeVertexNormals();
      }
      return geo;
    }
  }
}

function buildMaterial(matDef?: MaterialDef): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial();
  if (matDef) {
    if (matDef.color) {
      mat.color = new THREE.Color(...matDef.color);
      if (matDef.color.length >= 4) {
        mat.opacity = matDef.color[3];
        mat.transparent = matDef.color[3] < 1;
      }
    }
    if (matDef.metallic !== undefined) mat.metalness = matDef.metallic;
    if (matDef.roughness !== undefined) mat.roughness = matDef.roughness;
  } else {
    mat.color = new THREE.Color(0.6, 0.6, 0.6);
    mat.roughness = 0.7;
  }
  return mat;
}

// ============================================================================
// Matrix helpers
// ============================================================================

function nodeLocalMatrix(def: NodeDef): THREE.Matrix4 {
  const mat = new THREE.Matrix4();
  const t = def.translation ?? [0, 0, 0];
  const r = def.rotation ?? [0, 0, 0, 1];
  const s = def.scale ?? [1, 1, 1];

  mat.compose(
    new THREE.Vector3(...t)
    , new THREE.Quaternion(...r)
    , new THREE.Vector3(...s)
  );
  return mat;
}

function offsetMatrix(offset?: PartDef['offset']): THREE.Matrix4 {
  if (!offset) return new THREE.Matrix4(); // identity
  const t = offset.translation ?? [0, 0, 0];
  const r = offset.rotation ?? [0, 0, 0, 1];
  const mat = new THREE.Matrix4();
  mat.compose(
    new THREE.Vector3(...t)
    , new THREE.Quaternion(...r)
    , new THREE.Vector3(1, 1, 1)
  );
  return mat;
}

// ============================================================================
// Loader
// ============================================================================

export function resolveScene(data: JsonScene): ResolvedScene {
  const nodes = new Map<string, ResolvedNode>();

  // 1. Create ResolvedNode entries
  for (const [id, def] of Object.entries(data.nodes)) {
    nodes.set(id, {
      id
      , def
      , parentId: def.parent ?? null
      , children: []
      , localMatrix: nodeLocalMatrix(def)
      , worldMatrix: new THREE.Matrix4()
    });
  }

  // 2. Build children lists
  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)!.children.push(node.id);
    }
  }

  // 3. Find root nodes
  const rootNodeIds: string[] = [];
  // If a default scene is specified, use its root nodes
  if (data.scene && data.scenes?.[data.scene]) {
    rootNodeIds.push(...data.scenes[data.scene].nodes);
  } else {
    // Otherwise, any node without a parent (or with a missing parent) is a root
    for (const node of nodes.values()) {
      if (!node.parentId || !nodes.has(node.parentId)) {
        rootNodeIds.push(node.id);
      }
    }
  }

  // 4. Compute world matrices (depth-first from roots)
  function computeWorld(nodeId: string, parentWorld: THREE.Matrix4) {
    const node = nodes.get(nodeId);
    if (!node) return;
    node.worldMatrix.multiplyMatrices(parentWorld, node.localMatrix);
    for (const childId of node.children) {
      computeWorld(childId, node.worldMatrix);
    }
  }
  const identity = new THREE.Matrix4();
  for (const rootId of rootNodeIds) {
    computeWorld(rootId, identity);
  }

  // 5. Resolve parts
  const parts: ResolvedPart[] = [];
  if (data.parts && data.meshes) {
    for (const [id, partDef] of Object.entries(data.parts)) {
      const meshDef = data.meshes[partDef.mesh];
      const node = nodes.get(partDef.node);
      if (!meshDef || !node) continue;

      // Build geometry from first primitive (could combine later)
      const geom = buildGeometry(meshDef.primitives[0]);

      // Resolve material
      const matKey = meshDef.primitives[0].material;
      const matDef = matKey && data.materials ? data.materials[matKey] : undefined;
      const material = buildMaterial(matDef);

      // Compute final world matrix: node world * offset
      const world = new THREE.Matrix4().copy(node.worldMatrix);
      if (partDef.offset) {
        world.multiply(offsetMatrix(partDef.offset));
      }

      parts.push({
        id
        , def: partDef
        , nodeId: partDef.node
        , meshId: partDef.mesh
        , worldMatrix: world
        , geometry: geom
        , material
      });
    }
  }

  return { nodes, parts, rootNodeIds };
}

/**
 * Recompute all world matrices and part positions.
 * Call this after updating any node's localMatrix (e.g., from animation).
 */
export function updateWorldMatrices(scene: ResolvedScene, _data: JsonScene) {
  const identity = new THREE.Matrix4();

  function computeWorld(nodeId: string, parentWorld: THREE.Matrix4) {
    const node = scene.nodes.get(nodeId);
    if (!node) return;
    node.worldMatrix.multiplyMatrices(parentWorld, node.localMatrix);
    for (const childId of node.children) {
      computeWorld(childId, node.worldMatrix);
    }
  }

  for (const rootId of scene.rootNodeIds) {
    computeWorld(rootId, identity);
  }

  // Update part world matrices
  for (const part of scene.parts) {
    const node = scene.nodes.get(part.nodeId);
    if (!node) continue;
    part.worldMatrix.copy(node.worldMatrix);
    if (part.def.offset) {
      part.worldMatrix.multiply(offsetMatrix(part.def.offset));
    }
  }
}

/**
 * Apply a single animation frame. Interpolates keyframes and updates node local matrices.
 * Returns true if any channel was applied.
 */
export function applyAnimation(
  scene: ResolvedScene
  , data: JsonScene
  , animName: string
  , time: number
): boolean {
  const anim = data.animations?.[animName];
  if (!anim) return false;

  let applied = false;
  for (const ch of anim.channels) {
    const node = scene.nodes.get(ch.node);
    if (!node || ch.keyframes.length === 0) continue;

    // Build absolute-time keyframes from per-keyframe durations
    const kf = keyframeAbsoluteTimes(ch.keyframes);
    let value: number[];

    if (time <= kf[0].time) {
      value = kf[0].value;
    } else if (time >= kf[kf.length - 1].time) {
      value = kf[kf.length - 1].value;
    } else {
      // Find bracketing keyframes
      let i = 0;
      while (i < kf.length - 1 && kf[i + 1].time <= time) i++;
      const t0 = kf[i].time, t1 = kf[i + 1].time;
      const f = (time - t0) / (t1 - t0);

      if (ch.interpolation === 'STEP') {
        value = kf[i].value;
      } else {
        // LINEAR (default)
        const v0 = kf[i].value;
        const v1 = kf[i + 1].value;
        if (ch.path === 'rotation') {
          // Quaternion slerp
          const q0 = new THREE.Quaternion(...v0);
          const q1 = new THREE.Quaternion(...v1);
          q0.slerp(q1, f);
          value = [q0.x, q0.y, q0.z, q0.w];
        } else {
          // Linear lerp for translation/scale
          value = v0.map((a, j) => a + (v1[j] - a) * f);
        }
      }
    }

    // Apply to node definition, then rebuild local matrix
    const def = node.def;
    if (ch.path === 'translation') {
      def.translation = value as [number, number, number];
    } else if (ch.path === 'rotation') {
      def.rotation = value as [number, number, number, number];
    } else if (ch.path === 'scale') {
      def.scale = value as [number, number, number];
    }
    node.localMatrix = nodeLocalMatrix(def);
    applied = true;
  }

  if (applied) {
    updateWorldMatrices(scene, data);
  }
  return applied;
}
