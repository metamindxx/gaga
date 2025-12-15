# PGA Cheatsheet (Projective Geometric Algebra)

A compact reference for Projective Geometric Algebra (PGA) as used in this repository. PGA is the "flat" cousin of CGA - simpler but limited to flat primitives (planes, lines, points).

---

## Quick Start

```typescript
import { pga, e0, e1, e2, e3 } from '../algebra/pga';

// Create a plane (grade 1)
const xyPlane = pga.plane([0, 0, 1], 0);  // z = 0

// Create a point (grade 3)
const pt = pga.point([1, 2, 3]);

// Extract coordinates
const coords = pga.pointCoords(pt);  // [1, 2, 3]

// Classify (for rendering)
const primitive = pt.classify();  // { type: 'point', coords: [1, 2, 3] }
```

---

## PGA Signature: R(3,0,1)

| Element | Square | Description |
|---------|--------|-------------|
| `e0` | 0 | Degenerate (null) basis - "direction to infinity" |
| `e1` | +1 | x-direction |
| `e2` | +1 | y-direction |
| `e3` | +1 | z-direction |

Key difference from CGA: Only **one** degenerate basis element (not two null vectors).

---

## Grade Interpretation

| Grade | Object | Representation |
|-------|--------|----------------|
| 0 | Scalar | Numbers |
| 1 | **Plane** | `nx·e1 + ny·e2 + nz·e3 - d·e0` |
| 2 | **Line** | Plücker coordinates |
| 3 | **Point** | Homogeneous coordinates |
| 4 | Pseudoscalar | Volume element |

Note: This is "upside down" from CGA - planes are low grade, points are high grade.

---

## Planes (Grade 1)

### Creating Planes

```typescript
// From normal and distance
const plane = pga.plane([nx, ny, nz], distance);

// Examples
const xyPlane = pga.plane([0, 0, 1], 0);    // z = 0
const yPlane5 = pga.plane([0, 1, 0], 5);    // y = 5
const tilted = pga.plane([1, 1, 0], 2);     // x + y = 2 (not normalized)
```

### Extracting Plane Parameters

```typescript
const params = pga.planeParams(plane);
// { normal: [nx, ny, nz], distance: d }
```

---

## Points (Grade 3)

### Creating Points

```typescript
// From Euclidean coordinates
const pt = pga.point([x, y, z]);

// Manual: P = e123 + x·e032 + y·e013 + z·e021
```

### Extracting Coordinates

```typescript
const coords = pga.pointCoords(pt);  // [x, y, z] or null if ideal
```

### Ideal Points (Directions)

Points at infinity have `e123 = 0`:

```typescript
const dir = pga.directionOf(idealPt);  // [dx, dy, dz] normalized
```

---

## Lines (Grade 2)

Lines in PGA are bivectors with 6 components (Plücker coordinates):

```typescript
// Line through two points (outer product)
const line = pt1.op(pt2);

// Line as intersection of two planes (regressive product / meet)
const line = pga.meet(plane1, plane2);
```

### Line Classification

```typescript
const prim = line.classify();
// { type: 'line', point: [px, py, pz], direction: [dx, dy, dz] }
```

---

## Operations

### Join (Outer Product)

Creates element containing both inputs:

```typescript
// Two points → Line
const line = pt1.op(pt2);

// Three points → Plane
const plane = pt1.op(pt2).op(pt3);

// Point and line → Plane
const plane = pt.op(line);
```

### Meet (Regressive Product)

Intersection of elements:

```typescript
// Two planes → Line
const line = pga.meet(plane1, plane2);

// Three planes → Point
const pt = pga.meet(pga.meet(plane1, plane2), plane3);

// Plane and line → Point
const pt = pga.meet(plane, line);
```

Implementation:
```typescript
// meet(a, b) = dual(dual(a) ∧ dual(b))
function meet(a, b) {
  return a.dual().op(b.dual()).unDual();
}
```

---

## Motors (Translations & Rotations)

### Translation

```typescript
// Translator by distance along direction
const T = pga.translator([dx, dy, dz], distance);

// T = 1 - ½(dx·e01 + dy·e02 + dz·e03) × distance
```

### Rotation

```typescript
// Rotor around axis through origin
const R = pga.rotor([ax, ay, az], angle);

// R = cos(θ/2) + sin(θ/2)(ax·e23 + ay·e31 + az·e12)
```

### Applying Motors (Sandwich Product)

```typescript
const transformed = pga.apply(motor, element);
// = motor × element × reverse(motor)
```

---

## Classification (for Rendering)

```typescript
const prim = myMv.classify();

switch (prim?.type) {
  case 'point':
    // prim.coords: [x, y, z]
    break;
  case 'direction':
    // prim.vector: [dx, dy, dz]
    break;
  case 'line':
    // prim.point: [px, py, pz]
    // prim.direction: [dx, dy, dz]
    break;
  case 'plane':
    // prim.normal: [nx, ny, nz]
    // prim.distance: d
    // prim.point: [px, py, pz] (closest to origin)
    break;
}
```

---

## Example: Three Planes Meet at a Point

```typescript
// Animated planes
const xyPlane = pga.plane([0, 0, 1], offset);      // z = offset
const xzPlane = pga.plane([0, 1, 0], -offset);     // y = -offset
const yzPlane = pga.plane([1, 0, 0], offset/2);    // x = offset/2

// Intersection point
const meetLine = pga.meet(xyPlane, xzPlane);
const meetPoint = pga.meet(meetLine, yzPlane);

// Render
<RenderMv mv={xyPlane} color={0x4444ff} />
<RenderMv mv={xzPlane} color={0x44ff44} />
<RenderMv mv={yzPlane} color={0xff4444} />
<RenderMv mv={meetPoint} color={0xffffff} />
```

---

## PGA vs CGA

| Aspect | PGA R(3,0,1) | CGA R(4,1) |
|--------|--------------|------------|
| Dimensions | 4D (2⁴=16 components) | 5D (2⁵=32 components) |
| Primitives | Flat only (planes, lines, points) | Flat + Round (spheres, circles) |
| Degenerate | One e0² = 0 | Two null vectors (e+, e-) |
| Points | Grade 3 | Grade 1 (conformal) |
| Planes | Grade 1 | Grade 4 |
| Complexity | Simpler | More powerful |

**Use PGA when**: You only need planes, lines, points, and rigid motions.

**Use CGA when**: You need spheres, circles, or inversive geometry.

---

## Testing

Tests live in `src/algebra/pga.test.ts`:

```bash
npm run test:run
```

Example:
```typescript
it('meets three planes to get a point', () => {
  const xyPlane = pga.plane([0, 0, 1], 0);
  const xzPlane = pga.plane([0, 1, 0], 0);
  const yzPlane = pga.plane([1, 0, 0], 0);
  
  const line = pga.meet(xyPlane, xzPlane);
  const pt = pga.meet(line, yzPlane);
  const coords = pga.pointCoords(pt);
  
  expect(coords![0]).toBeCloseTo(0);
  expect(coords![1]).toBeCloseTo(0);
  expect(coords![2]).toBeCloseTo(0);
});
```

---

## See Also

- [store-based-rendering.md](store-based-rendering.md) - Architecture overview
- [cga-cheatsheet.md](cga-cheatsheet.md) - CGA reference
- `src/algebra/pga.ts` - PGA setup and exports
- `src/algebra/pgaHelpers.ts` - Helper implementations
- `src/scenes/PgaDemo.svelte` - Example usage
