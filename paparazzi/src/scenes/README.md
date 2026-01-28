# scenes Directory

This directory contains all the 3D demo scenes for the Geometric Algebra visualization app. Each scene is a self-contained Svelte component rendered inside a shared Threlte (Three.js) canvas.

## Architecture

Scenes use a **self-registration pattern** - they register themselves with the central scene registry rather than being hardcoded into the app. This keeps the main app scene-agnostic.

### Key Files

- `AllScenes.svelte` - The main canvas container that renders all visible scenes
- `ControlPanel.svelte` - Left sidebar with scene toggles and config panels
- `index.ts` - Scene registration (imports all scenes and registers them with the registry)

### Scene Registration

Scenes are registered in `index.ts`:

```ts
import { registerGroup, registerScene } from '../stores/sceneRegistry.svelte';

registerGroup({ id: 'pga', name: 'PGA Demos', icon: '📐', order: 3 });

registerScene({
  id: 99,
  name: 'PGA Demo',
  groupId: 'pga',
  component: PgaDemo,
  getSceneProps: getSceneProps,    // Optional: reactive props
  ConfigPanel: PgaConfig,          // Optional: control panel component
  defaultVisible: false
});
```

## Conventions

### State Files (`.svelte.ts`)
Scene state uses Svelte 5 runes in `.svelte.ts` files:

```ts
// skinningState.svelte.ts
export const config = $state({
  useDQS: true,
  animate: true,
  rotationAngle: 0
});

export function getSceneProps() {
  return { ...config };
}
```

### Config Panels
Config components import scene state and bind to it:

```svelte
<script lang="ts">
  import { Slider } from '$lib/components/ui/slider';
  import { config } from './skinningState.svelte';
</script>

<Slider value={config.rotationAngle} ... />
```

### Scene Components
Scene components receive props from `getSceneProps()` and render Threlte components:

```svelte
<script lang="ts">
  let { rotationAngle, useDQS } = $props();
</script>

<T.Mesh rotation.y={rotationAngle}>
  ...
</T.Mesh>
```
