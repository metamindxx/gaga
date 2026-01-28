/**
 * Hover/Selection Info Store (Svelte 5 Runes)
 * Supports hover (temporary) and pin (click to lock).
 */

// Types
export interface EditableField {
  key: string;
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export interface ActionButton {
  label: string;
  onClick: () => void;
}

export interface HoverInfo {
  label?: string;
  type: string;
  mvString?: string;
  properties?: Record<string, string | number>;
  editableFields?: EditableField[];
  actions?: ActionButton[];
}

export type HoverInfoGetter = () => HoverInfo;

// State
let pinnedGetter: HoverInfoGetter | null = null;
let pinnedId: symbol | null = null;
let currentInfo = $state<HoverInfo | null>(null);
let isPinnedState = $state(false);
let pinnedIdState = $state<symbol | null>(null);

// API
export function setHoverInfo(getter: HoverInfoGetter) {
  if (!isPinnedState)
    try {
      currentInfo = getter();
    } catch {
      currentInfo = null;
    }
}

export function clearHoverInfo() {
  if (!isPinnedState) currentInfo = null;
}

export function pinHoverInfo(id: symbol, getter: HoverInfoGetter) {
  if (pinnedId === id) {
    unpinHoverInfo();
  } else {
    pinnedGetter = getter;
    pinnedId = id;
    isPinnedState = true;
    pinnedIdState = id;
    try {
      currentInfo = getter();
    } catch {
      currentInfo = null;
    }
  }
}

export function unpinHoverInfo() {
  pinnedGetter = pinnedId = null;
  isPinnedState = false;
  pinnedIdState = null;
  currentInfo = null;
}

export function isPinnedId(id: symbol) {
  return pinnedId === id;
}

export function updatePinnedInfo() {
  if (pinnedGetter && isPinnedState)
    try {
      currentInfo = pinnedGetter();
    } catch {}
}
export const triggerHoverUpdate = updatePinnedInfo;

// Getters
export function getPinnedId() {
  return pinnedIdState;
}
export function getIsPinned() {
  return isPinnedState;
}
export function getHoverInfo() {
  return currentInfo;
}

// Reactive export
export const hover = {
  get info() {
    return currentInfo;
  }
  , get isPinned() {
    return isPinnedState;
  }
  , get pinnedId() {
    return pinnedIdState;
  }
};
