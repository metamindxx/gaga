# Geometry

Threlte/Three.js components for rendering geometric primitives. These components form the visual layer between geometric algebra and the 3D renderer.

## Architecture

The geometry system has two layers:

1. **Primitives** (`primitives.ts`) - Pure TypeScript types representing geometric objects (Point3D, Circle3D, Sphere3D, etc.). These are the OUTPUT of multivector classification and contain only Euclidean coordinates—no algebra references.

2. **Svelte Components** - Threlte components that render primitives as Three.js meshes/lines.

## Key Component: `RenderMv.svelte`

The bridge between algebra and rendering. Given a multivector with a `classify()` method, it:
- Calls `mv.classify()` to get a `GeoPrimitive`
- Dispatches to the appropriate geometry component (Point, Circle, Sphere, etc.)
- Handles drag interactions (updating the MV via binding)
- Manages hover/selection info display

```svelte
<!-- Render a single MV -->
<RenderMv mv={somePoint} color={0xff0000} />

<!-- Draggable point with two-way binding -->
<RenderMv bind:mv={point} draggable />

<!-- Polyline from array of point MVs -->
<RenderMv mv={[p1, p2, p3]} closed />
```

## Primitive Components

Low-level components that take Euclidean coordinates directly (no MVs):

| Component | Props | Description |
|-----------|-------|-------------|
| `Point.svelte` | `position`, `radius`, `color` | Sphere at a position |
| `Circle.svelte` | `center`, `radius`, `normal` | 3D circle (torus) |
| `Sphere.svelte` | `center`, `radius` | Wireframe or solid sphere |
| `Plane.svelte` | `normal`, `distance`, `size` | Finite plane quad |
| `Line.svelte` | `point`, `direction`, `extent` | Infinite line (clipped) |
| `Direction.svelte` | `vector` | Arrow from origin |
| `Segment.svelte` | `start`, `end` | Line between two points |

## Collection Components

Higher-level components for multiple objects:

| Component | Description |
|-----------|-------------|
| `Polyline.svelte` | Connected line segments |
| `PointCloud.svelte` | Multiple points |
| `Trail.svelte` | Animated path history |
| `PointPair.svelte` | Two points with connecting segment |
| `LineSegments.svelte` | Multiple disconnected segments |
| `RotorFlag.svelte` | Visualization of a rotor as oriented flag |

## Type Definitions (`primitives.ts`)

```typescript
type Coords3D = [number, number, number];

interface Point3D { type: 'point'; coords: Coords3D; }
interface Circle3D { type: 'circle'; center: Coords3D; radius: number; normal: Coords3D; }
interface Sphere3D { type: 'sphere'; center: Coords3D; radius: number; }
interface Plane3D { type: 'plane'; point: Coords3D; normal: Coords3D; }
interface Line3D { type: 'line'; point: Coords3D; direction: Coords3D; }
// ... etc.

type GeoPrimitive = Point3D | Circle3D | Sphere3D | Plane3D | Line3D | ...;
```

Type guards are provided: `isPoint()`, `isCircle()`, `isSphere()`, etc.

## Design Principles

- **Algebra-agnostic**: Primitive components never see multivectors
- **Coords3D everywhere**: All positions are `[x, y, z]` tuples
- **Classification at boundary**: `RenderMv` is the only place MVs are interpreted
- **Composable**: Use primitives directly or via `RenderMv` as needed
