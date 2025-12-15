/**
 * Hover/Selection Info Store
 *
 * Stores information about the currently hovered/selected multivector
 * for display in an infobox. Supports both hover (temporary) and pin (click to lock).
 *
 * Behavior:
 * - Hover shows info temporarily
 * - Click pins the element (stays visible even when not hovering)
 * - Click same element or click away to unpin
 * - When pinned, info updates reactively as MV changes
 */

import { writable, derived, get } from 'svelte/store';

/** Editable field definition */
export interface EditableField {
  /** Field key/name */
  key: string;
  /** Current value */
  value: number;
  /** Callback to update the value */
  onChange: (newValue: number) => void;
  /** Optional min value */
  min?: number;
  /** Optional max value */
  max?: number;
  /** Optional step */
  step?: number;
  /** Optional label (defaults to key) */
  label?: string;
}

/** Action button definition */
export interface ActionButton {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
}

export interface HoverInfo {
  /** Label/name of the element */
  label?: string;
  /** Type of geometric primitive */
  type: string;
  /** Multivector string representation */
  mvString?: string;
  /** Additional properties (center, radius, normal, etc.) */
  properties?: Record<string, string | number>;
  /** Editable fields (only shown when pinned) */
  editableFields?: EditableField[];
  /** Action buttons (only shown when pinned) */
  actions?: ActionButton[];
}

/** Function that generates current hover info from an MV */
export type HoverInfoGetter = () => HoverInfo;

/** Internal state: the getter function for the pinned element */
const pinnedGetter = writable<HoverInfoGetter | null>(null);

/** Internal state: the getter function for the hovered element */
const hoveredGetter = writable<HoverInfoGetter | null>(null);

/** Unique ID for the pinned element (to detect same element clicks) */
const pinnedId = writable<symbol | null>(null);

/** Trigger reactivity by incrementing on each frame/update */
const updateTrigger = writable(0);

/** Set hover info (temporary, while hovering) */
export function setHoverInfo(getter: HoverInfoGetter) {
  hoveredGetter.set(getter);
}

/** Clear hover info (when leaving element) */
export function clearHoverInfo() {
  hoveredGetter.set(null);
}

/** Pin a new element (call on click) */
export function pinHoverInfo(id: symbol, getter: HoverInfoGetter) {
  const currentId = get(pinnedId);
  if (currentId === id) {
    // Clicking same element - unpin
    pinnedGetter.set(null);
    pinnedId.set(null);
  } else {
    // Pin new element
    pinnedGetter.set(getter);
    pinnedId.set(id);
  }
}

/** Unpin (call on click-away) */
export function unpinHoverInfo() {
  pinnedGetter.set(null);
  pinnedId.set(null);
}

/** Check if a specific element is pinned */
export function isPinnedId(id: symbol): boolean {
  return get(pinnedId) === id;
}

/** Trigger an update (call when MV changes) */
export function triggerHoverUpdate() {
  updateTrigger.update((n) => n + 1);
}

/** Get the pinned ID store for reactive checks */
export { pinnedId };

/** Whether anything is currently pinned */
export const isPinned = derived(pinnedId, ($id) => $id !== null);

/** Derived store that shows pinned info (priority) or hovered info */
export const hoverInfo = derived(
  [pinnedGetter, hoveredGetter, updateTrigger]
  , ([$pinned, $hovered]) => {
    // Pinned takes priority over hovered
    const getter = $pinned ?? $hovered;
    if (!getter) return null;
    try {
      return getter();
    } catch {
      return null;
    }
  }
);
