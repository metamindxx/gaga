/**
 * Spidor Module - Spider locomotion with IK legs
 *
 * Directory structure:
 *   components/  - Core visual components (Foot, Leg, Feet, Full)
 *   demos/       - Demo wrappers for slide presentations
 *   config/      - Control panel UI components
 *   state/       - Reactive state management
 */

// Components
export { default as Foot } from './components/Foot.svelte';
export { default as Leg } from './components/Leg.svelte';
export { default as Feet } from './components/Feet.svelte';
export { default as Full } from './components/Full.svelte';

// Demos
export { default as FootDemo } from './demos/FootDemo.svelte';
export { default as LegDemo } from './demos/LegDemo.svelte';
export { default as FeetDemo } from './demos/FeetDemo.svelte';

// Config panels
export { default as FootConfig } from './config/FootConfig.svelte';
export { default as LegConfig } from './config/LegConfig.svelte';
export { default as FeetConfig } from './config/FeetConfig.svelte';
export { default as FullConfig } from './config/FullConfig.svelte';

// State - explicit exports to avoid naming conflicts
export { config as footConfig, getSceneProps as getFootProps } from './state/footState.svelte';
export { config as legConfig, getSceneProps as getLegProps } from './state/legState.svelte';
export { config as fullConfig, getSceneProps as getFullProps } from './state/fullState.svelte';
export { stepConfig, getStepProps } from './state/stepConfig.svelte';
