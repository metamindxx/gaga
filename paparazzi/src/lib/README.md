# lib Directory

This is the `$lib` directory - a SvelteKit convention for shared code. The `$lib` alias is configured in `vite.config.js` to point here, allowing imports like:

```ts
import { Button } from '$lib/components/ui/button';
import { cn } from '$lib/utils';
```

## components/ui - shadcn-svelte

The `$lib/components/ui` folder contains UI components from [shadcn-svelte](https://www.shadcn-svelte.com/), a port of [shadcn/ui](https://ui.shadcn.com/) for Svelte.

**How components are added:**

```bash
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add slider
```

This generates the component files directly in `src/lib/components/ui/`.
