/**
 * Spinor SU(2) Slide - Shared State
 *
 * This module owns the reactive state for the Spinor SU(2) demo.
 * All rotation representations are bidirectionally synchronized:
 * - Euler angles (yaw, pitch, roll)
 * - Quaternion / SU(2) (w, x, y, z)
 * - Double complex (a+bi, c+di)
 * - Axis-angle (axis vector, angle)
 * - PGA Rotor
 */

import { pga } from '../../algebra/pga';
import type { Multivector as MV } from '../../algebra/types';

// ============================================================================
// Types
// ============================================================================

/** Euler angles in radians (ZYX convention: yaw → pitch → roll) */
export interface EulerAngles {
  yaw: number; // rotation around Z
  pitch: number; // rotation around Y
  roll: number; // rotation around X
}

/** Unit quaternion (w + xi + yj + zk) */
export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

/** Double complex representation (SU(2) as C²) */
export interface DoubleComplex {
  a: number; // real part of first complex
  b: number; // imag part of first complex (a + bi)
  c: number; // real part of second complex
  d: number; // imag part of second complex (c + di)
}

/** Axis-angle representation */
export interface AxisAngle {
  axis: [number, number, number]; // unit vector
  angle: number; // radians
}

/** PGA Rotor components (scalar + bivector) */
export interface RotorComponents {
  s: number; // scalar part
  e12: number; // e12 bivector (Z rotation)
  e31: number; // e31 bivector (Y rotation) - stored as -e13
  e23: number; // e23 bivector (X rotation)
}

// ============================================================================
// Internal normalized state (quaternion is the canonical form)
// ============================================================================

let _quat = $state<Quaternion>({ w: 1, x: 0, y: 0, z: 0 });

// Guard against re-entrant updates (prevents infinite loops from slider callbacks)
let _updating = false;

// ============================================================================
// Frame-based throttling (batch rapid updates to once per frame)
// ============================================================================

let _pendingQuat: Quaternion | null = null;
let frameId: number | null = null;

/** Schedule a quaternion update for the next animation frame */
function scheduleQuatUpdate(newQuat: Quaternion): void {
  _pendingQuat = newQuat;
  if (frameId === null) {
    frameId = requestAnimationFrame(() => {
      frameId = null;
      if (_pendingQuat !== null) {
        _quat = _pendingQuat;
        _pendingQuat = null;
      }
    });
  }
}

// ============================================================================
// Conversion functions
// ============================================================================

/** Normalize a quaternion to unit length */
function normalizeQuat(q: Quaternion): Quaternion {
  const mag = Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
  if (mag < 1e-10) return { w: 1, x: 0, y: 0, z: 0 };
  return { w: q.w / mag, x: q.x / mag, y: q.y / mag, z: q.z / mag };
}

/** Euler (ZYX) → Quaternion */
function eulerToQuat(e: EulerAngles): Quaternion {
  const cy = Math.cos(e.yaw / 2);
  const sy = Math.sin(e.yaw / 2);
  const cp = Math.cos(e.pitch / 2);
  const sp = Math.sin(e.pitch / 2);
  const cr = Math.cos(e.roll / 2);
  const sr = Math.sin(e.roll / 2);

  return normalizeQuat({
    w: cr * cp * cy + sr * sp * sy
    , x: sr * cp * cy - cr * sp * sy
    , y: cr * sp * cy + sr * cp * sy
    , z: cr * cp * sy - sr * sp * cy
  });
}

/** Quaternion → Euler (ZYX) */
function quatToEuler(q: Quaternion): EulerAngles {
  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
  const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  // Pitch (y-axis rotation)
  const sinp = 2 * (q.w * q.y - q.z * q.x);
  const pitch =
    Math.abs(sinp) >= 1
      ? (Math.sign(sinp) * Math.PI) / 2 // gimbal lock
      : Math.asin(sinp);

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
  const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return { yaw, pitch, roll };
}

/** Quaternion → Double Complex (SU(2) as α, β where |α|² + |β|² = 1) */
function quatToDoubleComplex(q: Quaternion): DoubleComplex {
  // Standard mapping: α = w + iz, β = y + ix
  return {
    a: q.w // Re(α)
    , b: q.z // Im(α)
    , c: q.y // Re(β)
    , d: q.x // Im(β)
  };
}

/** Double Complex → Quaternion */
function doubleComplexToQuat(dc: DoubleComplex): Quaternion {
  // Inverse of above: w = a, z = b, y = c, x = d
  return normalizeQuat({
    w: dc.a
    , x: dc.d
    , y: dc.c
    , z: dc.b
  });
}

// Preserved axis - remembers the last meaningful axis when angle approaches 0 or 360
let preservedAxis: [number, number, number] = [1, 0, 0];

/** Quaternion → Axis-Angle */
function quatToAxisAngle(q: Quaternion): AxisAngle {
  const angle = 2 * Math.acos(Math.max(-1, Math.min(1, q.w)));
  const s = Math.sqrt(1 - q.w * q.w);

  if (s < 1e-10) {
    // No rotation or full 360° rotation
    // w ≈ 1 means angle ≈ 0, w ≈ -1 means angle ≈ 360°
    const displayAngle = q.w < 0 ? 2 * Math.PI : 0;
    return { axis: preservedAxis, angle: displayAngle };
  }

  // Valid axis - update preserved axis
  const axis: [number, number, number] = [q.x / s, q.y / s, q.z / s];
  preservedAxis = axis;

  return { axis, angle };
}

/** Axis-Angle → Quaternion */
function axisAngleToQuat(aa: AxisAngle): Quaternion {
  const halfAngle = aa.angle / 2;
  const s = Math.sin(halfAngle);
  const c = Math.cos(halfAngle);

  // Normalize axis
  const mag = Math.sqrt(aa.axis[0] ** 2 + aa.axis[1] ** 2 + aa.axis[2] ** 2);
  if (mag < 1e-10) return { w: 1, x: 0, y: 0, z: 0 };

  const ax = aa.axis[0] / mag;
  const ay = aa.axis[1] / mag;
  const az = aa.axis[2] / mag;

  return { w: c, x: ax * s, y: ay * s, z: az * s };
}

/** Quaternion → Rotor Components */
function quatToRotorComponents(q: Quaternion): RotorComponents {
  // Mapping: scalar=w, e23=x, e31=y, e12=z
  return {
    s: q.w
    , e12: q.z
    , e31: q.y
    , e23: q.x
  };
}

/** Rotor Components → Quaternion */
function rotorComponentsToQuat(r: RotorComponents): Quaternion {
  return normalizeQuat({
    w: r.s
    , x: r.e23
    , y: r.e31
    , z: r.e12
  });
}

/** Quaternion → PGA Rotor */
function quatToRotor(q: Quaternion): MV {
  // R = w + x*e23 + y*e31 + z*e12
  return pga.rotor([q.x, q.y, q.z], 2 * Math.acos(Math.max(-1, Math.min(1, q.w))));
}

/** PGA Rotor → Quaternion (extract from even-grade MV) */
function rotorToQuat(r: MV): Quaternion {
  const w = r.basisSVal('e_') || 0;
  const x = r.basisSVal('e_23') || 0;
  const y = -(r.basisSVal('e_13') || 0); // e31 = -e13
  const z = r.basisSVal('e_12') || 0;
  return normalizeQuat({ w, x, y, z });
}

// ============================================================================
// Reactive derived state (computed from _quat)
// ============================================================================

// Use $derived for proper Svelte 5 reactivity tracking
const _euler = $derived(quatToEuler(_quat));
const _doubleComplex = $derived(quatToDoubleComplex(_quat));
const _axisAngle = $derived(quatToAxisAngle(_quat));
const _rotor = $derived(quatToRotor(_quat));
const _rotorComponents = $derived(quatToRotorComponents(_quat));

// Derive spinor points from quaternion via doubleComplex mapping
// pt1 represents α = a + bi, stored as point([a, 0, b])
// pt2 represents β = c + di, stored as point([c, 0, d])
const _pt1 = $derived(pga.point([_doubleComplex.a, 0, _doubleComplex.b]));
const _pt2 = $derived(pga.point([_doubleComplex.c, 0, _doubleComplex.d]));

export const euler = {
  get value(): EulerAngles {
    return _euler;
  }
  , set value(e: EulerAngles) {
    scheduleQuatUpdate(eulerToQuat(e));
  }
};

export const quaternion = {
  get value(): Quaternion {
    return _quat;
  }
  , set value(q: Quaternion) {
    scheduleQuatUpdate(normalizeQuat(q));
  }
};

export const doubleComplex = {
  get value(): DoubleComplex {
    return _doubleComplex;
  }
  , set value(dc: DoubleComplex) {
    scheduleQuatUpdate(doubleComplexToQuat(dc));
  }
};

export const axisAngle = {
  get value(): AxisAngle {
    return _axisAngle;
  }
  , set value(aa: AxisAngle) {
    scheduleQuatUpdate(axisAngleToQuat(aa));
  }
};

export const rotor = {
  get value(): MV {
    return _rotor;
  }
  , set value(r: MV) {
    scheduleQuatUpdate(rotorToQuat(r));
  }
};

export const rotorComponents = {
  get value(): RotorComponents {
    return _rotorComponents;
  }
  , set value(r: RotorComponents) {
    scheduleQuatUpdate(rotorComponentsToQuat(r));
  }
};

// ============================================================================
// Config (module-level, shared between scene and config panel)
// Points are derived from quaternion state
// ============================================================================

export const config = {
  get pt1(): MV {
    return _pt1;
  }
  , get pt2(): MV {
    return _pt2;
  }
};

// ============================================================================
// Guarded setter helper
// ============================================================================

const EPSILON = 1e-9;
const approxEq = (a: number, b: number) => Math.abs(a - b) < EPSILON;

/** Interface for reactive value stores */
interface Store<T> {
  get value(): T;
  set value(v: T);
}

/** Create a field setter with re-entrancy guard */
function setField<T extends object, K extends keyof T>(
  store: Store<T>
  , key: K
): (val: T[K]) => void {
  return (val) => {
    if (_updating) return;
    const cur = store.value;
    if (approxEq(cur[key] as number, val as number)) return;
    _updating = true;
    store.value = { ...cur, [key]: val };
    _updating = false;
  };
}

// Simple field setters
export const setYaw = setField(euler, 'yaw');
export const setPitch = setField(euler, 'pitch');
export const setRoll = setField(euler, 'roll');

export const setQuaternionW = setField(quaternion, 'w');
export const setQuaternionX = setField(quaternion, 'x');
export const setQuaternionY = setField(quaternion, 'y');
export const setQuaternionZ = setField(quaternion, 'z');

export const setDoubleComplexA = setField(doubleComplex, 'a');
export const setDoubleComplexB = setField(doubleComplex, 'b');
export const setDoubleComplexC = setField(doubleComplex, 'c');
export const setDoubleComplexD = setField(doubleComplex, 'd');

export const setRotorS = setField(rotorComponents, 's');
export const setRotorE12 = setField(rotorComponents, 'e12');
export const setRotorE31 = setField(rotorComponents, 'e31');
export const setRotorE23 = setField(rotorComponents, 'e23');

export const setAngle = setField(axisAngle, 'angle');

// Axis setters need special handling to preserve axis when angle is 0
function axisField(idx: 0 | 1 | 2): (val: number) => void {
  return (val) => {
    if (_updating) return;
    const aa = axisAngle.value;
    if (approxEq(aa.axis[idx], val)) return;
    _updating = true;
    const axis: [number, number, number] = [...aa.axis];
    axis[idx] = val;
    preservedAxis = axis;
    axisAngle.value = { ...aa, axis };
    _updating = false;
  };
}

export const setAxisX = axisField(0);
export const setAxisY = axisField(1);
export const setAxisZ = axisField(2);

export function setAxis(axis: [number, number, number]): void {
  if (_updating) return;
  const aa = axisAngle.value;
  if (aa.axis.every((v, i) => approxEq(v, axis[i]))) return;
  _updating = true;
  preservedAxis = axis;
  axisAngle.value = { ...aa, axis };
  _updating = false;
}

export const resetRotation = () => {
  _quat = { w: 1, x: 0, y: 0, z: 0 };
  preservedAxis = [1, 0, 0];
};
export const negateSpinor = () => {
  _quat = { w: -_quat.w, x: -_quat.x, y: -_quat.y, z: -_quat.z };
};

// Lock toggles for drag behavior (applies to both points)
const _lockState = $state({ radius: false, angle: false });
export const lockRadius = {
  get value() {
    return _lockState.radius;
  }
};
export const lockAngle = {
  get value() {
    return _lockState.angle;
  }
};
export const toggleLockRadius = () => {
  _lockState.radius = !_lockState.radius;
};
export const toggleLockAngle = () => {
  _lockState.angle = !_lockState.angle;
};

// ============================================================================
// Formatters
// ============================================================================

const f3 = (n: number) => n.toFixed(3);
const sign = (n: number) => (n >= 0 ? '+' : '-');

export function formatSpinorPoint(pt: MV): string {
  const c = pga.pointCoords(pt);
  return c ? `${f3(c[0])} ${sign(c[2])} ${f3(Math.abs(c[2]))}i` : '?';
}

export const formatQuaternion = (q: Quaternion) =>
  `${f3(q.w)} ${q.x >= 0 ? '+' : ''}${f3(q.x)}i ${q.y >= 0 ? '+' : ''}${f3(q.y)}j ${q.z >= 0 ? '+' : ''}${f3(q.z)}k`;

export const formatDoubleComplex = (dc: DoubleComplex) =>
  `(${f3(dc.a)} ${sign(dc.b)} ${f3(Math.abs(dc.b))}i, ${f3(dc.c)} ${sign(dc.d)} ${f3(Math.abs(dc.d))}i)`;

export const formatEuler = (e: EulerAngles) => {
  const d = (r: number) => ((r * 180) / Math.PI).toFixed(1);
  return `Y:${d(e.yaw)}° P:${d(e.pitch)}° R:${d(e.roll)}°`;
};

export const formatAxisAngle = (aa: AxisAngle) =>
  `[${aa.axis.map((v) => v.toFixed(2)).join(', ')}] @ ${((aa.angle * 180) / Math.PI).toFixed(1)}°`;

// ============================================================================
// Complex phase coloring (domain coloring for unit disk)
// ============================================================================

/** Convert complex number to hex color via HSL (hue=phase, sat=magnitude) */
export function complexToColor(re: number, im: number): number {
  const phase = Math.atan2(im, re);
  const h = (phase + Math.PI) / (2 * Math.PI);
  const s = Math.min(1, Math.sqrt(re * re + im * im));
  const l = 0.5;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const [r, g, b] = [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
}

export const alphaColor = {
  get value() {
    return complexToColor(_doubleComplex.a, _doubleComplex.b);
  }
};
export const betaColor = {
  get value() {
    return complexToColor(_doubleComplex.c, _doubleComplex.d);
  }
};

// ============================================================================
// Point setters (for drag interactions)
// ============================================================================

export function setPt1(value: MV): void {
  if (_updating) return;
  const c = pga.pointCoords(value);
  if (!c) return;
  const [a, , b] = c;
  // Read from pending quat if exists (for same-frame updates), else from current
  const dc = quatToDoubleComplex(_pendingQuat ?? _quat);
  if (approxEq(dc.a, a) && approxEq(dc.b, b)) return;
  _updating = true;
  scheduleQuatUpdate(doubleComplexToQuat({ ...dc, a, b }));
  _updating = false;
}

export function setPt2(value: MV): void {
  if (_updating) return;
  const c = pga.pointCoords(value);
  if (!c) return;
  const [cc, , d] = c;
  // Read from pending quat if exists (for same-frame updates), else from current
  const dc = quatToDoubleComplex(_pendingQuat ?? _quat);
  if (approxEq(dc.c, cc) && approxEq(dc.d, d)) return;
  _updating = true;
  scheduleQuatUpdate(doubleComplexToQuat({ ...dc, c: cc, d }));
  _updating = false;
}
