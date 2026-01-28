# Stores

Global reactive state management using Svelte 5 runes. These stores provide shared state and coordination between components across the application.

## Files

### `sceneRegistry.svelte.ts`
Central registry for scene self-registration and visibility management. Scenes register themselves on load (via their index.ts), and the ControlPanel reads from this registry to render visibility toggles. Uses `SvelteMap` for reactive collections.

**Key exports:**
- `registerGroup()` / `registerScene()` - Registration APIs
- `getGroups()` / `getScenes()` / `getVisibleScenes()` - Query APIs
- `isVisible()` / `toggleVisible()` / `showOnly()` - Visibility control
- `registry` - Reactive object for use in components

### `dragManager.svelte.ts`
Singleton for efficient 3D drag interactions. Maintains a single set of window event listeners and dispatches to the active drag session. Supports constraint planes (camera-facing, explicit normal, or from a GA multivector).

**Key exports:**
- `startDrag(session)` - Begin a drag with camera, renderer, callbacks
- `cancelDrag()` - Abort current drag
- `getIsDragging()` - Check if drag is active

### `hoverInfo.svelte.ts`
Manages hover/selection info display. Supports both temporary hover (mouse over) and pinned state (click to lock). Used with `HoverInfoBox.svelte` to show object details.

**Key exports:**
- `setHoverInfo(getter)` / `clearHoverInfo()` - Hover state
- `pinHoverInfo(id, getter)` / `unpinHoverInfo()` - Pin state
- `hover` - Reactive object with `info`, `isPinned`, `pinnedId`

### `orbitControl.svelte.ts`
Simple toggle to disable orbit camera controls during drag operations. Components read `orbitEnabled.current` to decide whether to process orbit gestures.

**Key exports:**
- `enableOrbit()` / `disableOrbit()` - Control functions
- `orbitEnabled.current` - Reactive boolean

## Components

### `HoverInfoBox.svelte`
UI component that displays the current hover/pinned info. Reads from the `hoverInfo` store.

### `ThreltePause.svelte`
Threlte helper component that pauses/resumes the render loop based on a `paused` prop.

## Conventions

- Files use `.svelte.ts` extension to enable Svelte 5 runes (`$state`, `$derived`, etc.)
- Stores export both imperative functions and reactive objects
- Reactive objects use getters to maintain reactivity: `get prop() { return $state_var; }`
