/**
 * Spinor SU(2) Slide - Shared State
 *
 * This module owns the reactive state for the Spinor SU(2) demo.
 * Both the scene component and config panel import from here.
 */

import { pga } from '../../algebra/pga';
import type { Multivector as MV } from '../../algebra/types';

// ============================================================================
// Config (module-level, shared between scene and config panel)
// ============================================================================

export const config = $state({
  pt1: pga.point([1, 0, 0]) as MV
  , pt2: pga.point([0, 0, 0]) as MV
});

// ============================================================================
// Helpers
// ============================================================================

export function formatSpinorPoint(pt: MV): string {
  const coords = pga.pointCoords(pt);
  if (!coords) return '?';
  const [re, , im] = coords;
  const sign = im >= 0 ? '+' : '-';
  return `${re.toFixed(3)} ${sign} ${Math.abs(im).toFixed(3)}i`;
}

// ============================================================================
// Setters (for use from callbacks that need function refs)
// ============================================================================

export function setPt1(value: MV): void {
  config.pt1 = value;
}

export function setPt2(value: MV): void {
  config.pt2 = value;
}
