# Interpretation Layer (MV → Primitive)

This project uses an explicit **interpretation layer** to turn *multivectors* into *plain geometric data* that the renderer and UI can consume.

At a high level:

1. **Algebra layer** produces/updates multivectors (`MV`).
2. **Interpretation layer** classifies an `MV` and extracts concrete geometry (`GeoPrimitive`).
3. **Rendering/UI layer** renders primitives and exposes hover/drag/edit behavior.

The key API is:

```ts
const prim = mv.classify(); // returns either a GeoPrimitive or null if unrecognized
```

Where `prim` is a discriminated union defined in [src/primitives/types.ts](../src/primitives/types.ts).

---

## Where this lives

- MV method wiring: [src/basisSet.js](../src/basisSet.js)
  - Adds `mv.classify()` which calls `mv.bs.helpers.classify(mv)`.
- Algebra-specific interpretation helpers:
  - PGA: [src/algebra/pgaHelpers.ts](../src/algebra/pgaHelpers.ts)
  - CGA: [src/algebra/cgaHelpers.ts](../src/algebra/cgaHelpers.ts)
- Consumer (renderer + UI semantics): [src/geometry/RenderMv.svelte](../src/geometry/RenderMv.svelte)

Each algebra module attaches helpers onto its basis set so every MV created by that basis can self-classify:

- PGA attaches in [src/algebra/pga.ts](../src/algebra/pga.ts) (`bs.helpers = pga`)
- CGA attaches in [src/algebra/cga.ts](../src/algebra/cga.ts) (`bs.helpers = cga`)

This lets the renderer code target GeoPrimitives without caring about which algebra produced them.

---

## The output type: `GeoPrimitive`

The interpretation layer returns a **plain JSON object** with a `type` discriminator.

The union is defined in [src/primitives/types.ts](../src/primitives/types.ts). The most common cases:

- `point`: `{ type: 'point', coords: [x,y,z], weight? }`
- `direction`: `{ type: 'direction', vector: [dx,dy,dz], weight? }`
- `line`: `{ type: 'line', point: [px,py,pz], direction: [dx,dy,dz] }`
- `plane`: `{ type: 'plane', point: [px,py,pz], normal: [nx,ny,nz], distance? }`

CGA additionally supports:

- `pointPair`: `{ type:'pointPair', point1, point2, isReal, isTangent? }`
- `circle`: `{ type:'circle', center, radius, normal }`
- `sphere`: `{ type:'sphere', center, radius }`

If an `MV` cannot be interpreted, `classify()` returns `null`.

---

## How classification works

Both PGA and CGA implementations share the same top-level strategy:

1. Ask the MV which grades it contains via `mv.getGrades()`.
2. If the MV is **single-grade**, dispatch to a grade-specific classifier.
3. If the MV is **mixed-grade** (e.g. motors/rotors), return `null` (for now).

In geometric algebra, many entities are **scale-invariant**: multiplying a blade by a nonzero scalar represents the same geometry. The interpretation layer generally normalizes key vectors (like directions and normals) so downstream code doesn’t have to care about arbitrary MV scale.

A small numerical threshold `EPSILON = 1e-6` is used throughout to decide "near zero".

---

## PGA interpretation (R(3,0,1))
In PGA, the grade convention is:
- grade 1 → **plane**
- grade 2 → **line** (Plücker coordinates)
- grade 3 → **point** (homogeneous) or **direction** (ideal point)

### 1) Plane (grade 1)

Implementation: `classifyGrade1()` in [src/algebra/pgaHelpers.ts](../src/algebra/pgaHelpers.ts)


`planeParams()` extracts:
  - `normal`: normalized unit vector $\hat{n}$
  - `distance`: scalar $d$ so the Euclidean plane equation is $\hat{n}\cdot x = d$

The returned primitive:

```ts
{
  type: 'plane',
  normal: [nx, ny, nz], // unit length
  distance: d,
  point: normal * d     // closest point on plane to origin
}
```

### 2) Line (grade 2)

Implementation: `classifyGrade2()` in [src/algebra/pgaHelpers.ts](../src/algebra/pgaHelpers.ts)

A PGA line is a bivector whose 6 key coefficients behave like **Plücker coordinates**:

- `d = (dx,dy,dz)` from the *Euclidean bivector* parts (`e23`, `e13`, `e12` with sign conventions)
- `m = (mx,my,mz)` from the *ideal bivector* parts (`e01`, `e02`, `e03`)

The classifier:

- computes $\|d\|$ and rejects near-zero direction
- normalizes direction `d` to unit length
- normalizes moment `m` by the *same* scale to preserve the represented line
- produces a canonical point on the line:
  - with $\|d\|=1$, the point closest to origin is $p_0 = d \times m$

The returned primitive:

```ts
{
  type: 'line',
  direction: [dx,dy,dz], // unit length
  point: [px,py,pz]      // closest-to-origin point
}
```

Notes:

- The line is still infinite but the renderer will choose a segment to draw.
- The renderer disables frustum culling for lines to avoid clipping issues.

### 3) Point or Direction (grade 3)

Implementation: `classifyGrade3()` in [src/algebra/pgaHelpers.ts](../src/algebra/pgaHelpers.ts)

A PGA point is homogeneous: it has a weight component `w` (in this implementation `e123`).

- If `w != 0` → finite point. Extract coordinates by dividing by `w`.
- If `w == 0` → ideal point, interpreted as a **direction**. The direction is also normalized; it represents an "at infinity" point.

Returned primitives:

```ts
{ type: 'point', coords: [x,y,z] }
{ type: 'direction', vector: [dx,dy,dz] } // unit length
```

---

## CGA interpretation (Conformal)

CGA classification is implemented in [src/algebra/cgaHelpers.ts](../src/algebra/cgaHelpers.ts) and is also grade-driven.

CGA grade convention in this code:

- grade 1 → point or direction (ideal point)
- grade 2 → point pair (including tangent and imaginary cases)
- grade 3 → circle or line
- grade 4 → sphere or plane

### 1) Point or Direction (grade 1)

Implementation: `classifyGrade1()` in [src/algebra/cgaHelpers.ts](../src/algebra/cgaHelpers.ts)

Key tests:

- Compute $X \cdot n_i$.
  - If $|X \cdot n_i| \approx 0$ → ideal entity (direction)
  - Else → finite point
- Additionally, reject a **pure Euclidean vector** (only `e1,e2,e3` components):
  - It has no conformal components, so it is not a valid CGA point/direction.
  - The code warns once: "Use `up()` to embed Euclidean vectors."

Returned primitives:

```ts
{ type: 'direction', vector: unitDir }
{ type: 'point', coords: [x,y,z], weight?: number }
```

### 2) Point Pair (grade 2)

Implementation: `classifyGrade2()` in [src/algebra/cgaHelpers.ts](../src/algebra/cgaHelpers.ts)

The classifier uses the scalar of $PP^2$ to decide the case:

- $PP^2 > 0$ → **real** point pair (two distinct real points)
- $PP^2 \approx 0$ → **tangent** point pair (double point)
- $PP^2 < 0$ → **imaginary** point pair (no real intersection)

Returned primitive:

```ts
{
  type: 'pointPair',
  point1: [x1,y1,z1],
  point2: [x2,y2,z2],
  isReal: boolean,
  isTangent?: true
}
```

For imaginary point pairs, the implementation returns the extracted "center" as both `point1`/`point2` as a visualization fallback.

### 3) Circle or Line (grade 3)

Implementation: `classifyGrade3()` in [src/algebra/cgaHelpers.ts](../src/algebra/cgaHelpers.ts)

Decision:

- Compute $I_c = C \wedge n_i$ and test $\|I_c\|^2$.
  - If $\|I_c\|^2 \approx 0$ → **line** (flat entity containing infinity)
  - Else → **circle**

Returned circle primitive:

```ts
{ type: 'circle', center: [x,y,z], radius: r, normal: unitNormal }
```

Returned line primitive:

```ts
{ type: 'line', point: [px,py,pz], direction: unitDir }
```

Important limitation (current code):

- CGA `extractLine()` currently returns `point: [0,0,0]` with a `TODO` for proper point extraction.
  - The `direction` is meaningful, but the chosen point is a placeholder.

### 4) Sphere or Plane (grade 4)

Implementation: `classifyGrade4()` in [src/algebra/cgaHelpers.ts](../src/algebra/cgaHelpers.ts)

Decision:

- Compute dual $S^* = I_5 \; S$ and check $|S^* \cdot n_i|$.
  - Near zero → **plane** (flat, contains infinity)
  - Else → **sphere**

Returned primitives:

```ts
{ type: 'sphere', center: [x,y,z], radius: r }
{ type: 'plane', point: [x,y,z], normal: unitNormal, distance?: d }
```

- For planes, the code normalizes and extracts a `distance` and a canonical `point` on the plane.
- For spheres, the code rejects extremely large radii as "probably a plane" (`radius > 1000` returns null).

---

## How the renderer uses primitives (the "contract")

The renderer does not do GA math; it assumes the primitive is already "ready."

In [src/geometry/RenderMv.svelte](../src/geometry/RenderMv.svelte):

- For a single MV: `primitive = mv.classify()`.
- For an array of MVs: it classifies each and uses only `point` primitives to form polylines.
- Hover UI displays primitive-specific fields (point coords, circle center/radius, etc.).

Key contract expectations:

- `direction`, `normal` should be **unit vectors**.
- `point` is any convenient representative of the entity (canonical where possible).
- `null` means "not renderable as a known primitive."

---

## Why this layer exists (practical reasons)

- Keeps Svelte/Three code decoupled from algebra internals. This makes it easier to both build new algebras (since you only need to implement `classify()`, not `render()` for it) and to switch out rendering engines later (say if we want to add a 2d only SVG renderer or something of the sort later).
- Makes interactive tools (hover, pin, drag) operate on stable, predictable data.
- Allows different algebras (PGA vs CGA) to share the same simplified rendering API (`GeoPrimitive`).

---

## What `classify()` does NOT do (yet)

- Mixed-grade entities (motors/rotors/sandwich operators) are not classified.
- Many embeddings are one-way only (CGA `embed()` is partial).
