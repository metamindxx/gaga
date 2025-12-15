# CGA Cheatsheet (Conformal Geometric Algebra)

A compact set of formulas and code recipes for conformal geometric algebra (CGA) as used in this repository. This is a reference to help quickly implement common CGA operations with the project's API.

---

## Quick Start

```typescript
import { cga, no, ni, e1, e2, e3, one } from '../algebra/cga';

// Create a point
const pt = cga.up([1, 2, 3]);

// Extract coordinates
const coords = cga.down(pt);  // [1, 2, 3]

// Classify (for rendering)
const primitive = pt.classify();  // { type: 'point', coords: [1, 2, 3] }
```

---

## Conformal Basis (3D → 5D model)

The conformal model embeds 3D Euclidean space into 5D:

| Element | Description | Code |
|---------|-------------|------|
| `e1, e2, e3` | Euclidean basis | `import { e1, e2, e3 }` |
| `no` | Origin point | `n₀ = ½(e₋ - e₊)` |
| `ni` | Point at infinity | `n∞ = e₋ + e₊` |
| `I5` | 5D pseudoscalar | `e₁e₂e₃e₊e₋` |
| `one` | Scalar unit | `import { one }` |

---

## Points

### Creating Points

```typescript
// Using helper (preferred)
const pt = cga.up([x, y, z]);

// Manual construction
const euclidean = e1.smul(x).add(e2.smul(y)).add(e3.smul(z));
const rSq = x*x + y*y + z*z;
const pt = no.add(euclidean).add(ni.smul(0.5 * rSq));
```

### Extracting Coordinates

```typescript
// Using helper (preferred)
const coords = cga.down(pt);  // [x, y, z] or null if not a point

// Manual extraction
const w = -pt.scalarProduct(ni);  // normalization factor
const x = pt.basisSVal('e_1') / w;
const y = pt.basisSVal('e_2') / w;
const z = pt.basisSVal('e_3') / w;
```

### Point Distance

```typescript
// Squared distance between two CGA points
const d2 = -2 * p1.dot(p2).basisSVal('e_');
```

---

## Basic Operations

| Operation | Code | Description |
|-----------|------|-------------|
| Geometric product | `A.gp(B)` | Full GA product |
| Outer product | `A.op(B)` | Wedge (∧) |
| Inner product | `A.dot(B)` | Contraction |
| Meet | `cga.meet(A, B)` | Intersection (regressive) |
| Dual | `A.dual()` | Hodge dual |
| Undual | `A.unDual()` | Inverse dual |
| Reverse | `A.reverse()` | Reverse order |
| Normalize | `A.normalize()` | Unit magnitude |
| Scale | `A.smul(k)` | Scalar multiply |
| Grade select | `A.selectGrade(g)` | Extract grade g |
| Scalar value | `A.basisSVal('e_')` | Get scalar part |
| Component | `A.basisSVal('e_12')` | Get component |

---

## Geometric Objects

### Circle (3 points)

```typescript
const circle = p1.op(p2).op(p3);  // OPNS form

// Extract center
const cRaw = circle.gp(ni).gp(circle);
const norm = -1 / cRaw.dot(ni).basisSVal('e_');
const center = cRaw.smul(norm);

// Extract radius
const circleDual = circle.dual();
const radius = Math.sqrt(Math.abs(circleDual.gp(circleDual).basisSVal('e_')));
```

### Line (2 points + infinity)

```typescript
const line = p1.op(p2).op(ni);  // OPNS form
```

### Sphere (4 points)

```typescript
const sphere = p1.op(p2).op(p3).op(p4);  // OPNS form

// Or from center and radius (IPNS)
const sphereIPNS = cga.up(center).sub(ni.smul(0.5 * radius * radius));
```

### Plane (3 points + infinity)

```typescript
const plane = p1.op(p2).op(p3).op(ni);  // OPNS form
```

---

## Intersections (Meet)

```typescript
// Two spheres → circle
const C = cga.meet(S1.dual(), S2.dual());

// Sphere and plane → circle
const C = cga.meet(sphereDual, planeDual);

// Circle and plane → point pair
const PP = cga.meet(plane, circle);

// Extract point from point pair
const ppSq = PP.gp(PP).basisSVal('e_');
if (ppSq > 0) {
  const pt = one.add(PP.smul(1/Math.sqrt(ppSq))).gp(PP.dot(ni));
}
```

---

## Motors (Rotors & Translators)

### Translation

```typescript
// Translate by vector [dx, dy, dz]
const vec = e1.smul(dx).add(e2.smul(dy)).add(e3.smul(dz));
const tGen = vec.gp(ni).smul(0.5);
const translator = tGen.exp(1);

// Apply: sandwich product
const translated = translator.gp(point).gp(translator.reverse());
```

### Rotation

```typescript
// Rotate around axis through origin by angle theta
const axis = e1.op(e2);  // bivector (xy-plane rotation)
const rotor = axis.smul(theta / 2).exp(1);
const rotated = rotor.gp(point).gp(rotor.reverse());
```

### Rotation Around a Point

```typescript
// Translate to origin, rotate, translate back
const toOrigin = getTranslator(center, [0,0,0]);
const fromOrigin = toOrigin.reverse();
const rotor = bivector.smul(theta / 2).exp(1);
const motor = fromOrigin.gp(rotor).gp(toOrigin);
const result = motor.gp(point).gp(motor.reverse());
```

---

## Classification (for Rendering)

Multivectors can classify themselves via `mv.classify()`:

```typescript
const prim = myMv.classify();

switch (prim?.type) {
  case 'point':
    // prim.coords: [x, y, z]
    break;
  case 'pointPair':
    // prim.point1, prim.point2, prim.isReal
    break;
  case 'circle':
    // prim.center, prim.radius, prim.normal
    break;
  case 'line':
    // prim.point, prim.direction
    break;
  case 'sphere':
    // prim.center, prim.radius, prim.isImaginary
    break;
  case 'plane':
    // prim.point, prim.normal
    break;
}
```

---

## Common Patterns

### IK: Sphere-Sphere Intersection

```typescript
// Two spheres centered at points with given radii
const S0 = no.sub(ni.smul(0.5 * rho ** 2)).dual();
const S1 = target.sub(ni.smul(0.5 * l ** 2)).dual();
const C = cga.meet(S0, S1);  // Intersection circle
```

### Project onto Plane

```typescript
// Plane IPNS from circle
const planeIPNS = circle.op(ni).dual();
// Project line onto plane
const projected = line.dot(planeIPNS).dot(planeIPNS).normalize();
```

### Extract Angle Between Lines

```typescript
const cosAngle = L1.dot(L2).basisSVal('e_');
const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
```

---

## Testing

Tests live in `src/algebra/cga.test.ts`:

```bash
npm run test:run  # Run all tests
npm run test      # Watch mode
```

Example test:

```typescript
it('round-trips point coordinates', () => {
  const coords = [1.5, -2.3, 0.7];
  const pt = cga.up(coords);
  const back = cga.down(pt);
  expect(back![0]).toBeCloseTo(coords[0]);
});
```

---

## See Also

- [store-based-rendering.md](store-based-rendering.md) - Architecture overview
- `src/algebra/cga.ts` - CGA setup and exports
- `src/algebra/cgaHelpers.ts` - Helper implementations
- `src/scenes/Slide*.svelte` - Example usage
