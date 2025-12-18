import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';

const SPIDOR_FULL_VIZ = Symbol('SPIDOR_FULL_VIZ');

export function setSpidorFullViz(show: Readable<boolean>) {
  setContext(SPIDOR_FULL_VIZ, show);
}

export function getSpidorFullViz(): Readable<boolean> | undefined {
  return getContext<Readable<boolean> | undefined>(SPIDOR_FULL_VIZ);
}
