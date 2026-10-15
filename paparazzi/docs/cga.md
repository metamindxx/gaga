# Conformal Geometric Algebra in Paparazzi

Relevant files:

- [src/algebra/cga.ts](../src/algebra/cga.ts)
- [src/algebra/cgaHelpers.ts](../src/algebra/cgaHelpers.ts)
- [src/algebra/cga.test.ts](../src/algebra/cga.test.ts)
- [src/scenes/cga/cgaMirrors.ts](../src/scenes/cga/cgaMirrors.ts)
- [src/scenes/cga/MirrorDemo.svelte](../src/scenes/cga/MirrorDemo.svelte)
- [src/scenes/cga/mirrorState.svelte.ts](../src/scenes/cga/mirrorState.svelte.ts)
- [src/geometry/RenderMv.svelte](../src/geometry/RenderMv.svelte)
- [src/scenes/index.ts](../src/scenes/index.ts)

## Quick start snippet

~~~ts
import { cga, no, ni, e1, e2, e3, one } from '$algebra/cga';

// make a point
const P = cga.up([1, 2, 3]);

// back to xyz
const xyz = cga.down(P); // [1,2,3] or null

// classify for render / debug
const prim = cga.classify(P); // { type: 'point', ... } or null
~~~

Note: this import path uses the app alias setup. In plain TS files, use the relative path import style from the source files.

## Introduction

Most objects live in one of two dual forms (IPNS or OPNS) where if you code
the wrong one, rendering or classify does the wrong thing.

- CGA points (from `cga.up`) are grade-1 conformal points and render directly.
- IPNS spheres and planes need to be dualized before rendering.
- OPNS circles, lines, and point pairs render directly.

- `cga.embed` only does point, direction and sphere right now. The sphere case comes back already dualized.

## Algebra model and basis

The algebra Cl(4,1) is set up in [src/algebra/cga.ts](../src/algebra/cga.ts).

The usual exports:
```ts
{
  e1, e2, e3, e123,
  no, ni, I5, one,
  cga, cgaBasisSet, multiVector,
}
```
where

$$
e_1^2 = e_2^2 = e_3^2 = e_p^2 = 1,\quad e_m^2 = -1,\\
n_0 = \frac{e_m - e_p}2,\quad n_i = e_m + e_p,\quad n_o^2 = n_i^2 = 0,\quad n_o \cdot n_i = -1, \\
I_5 = e_1 \wedge e_2 \wedge e_3 \wedge n_o \wedge n_i,\quad I_5^2 = -1
$$

and the point lift that `cga.up` does:

$$
P = n_o + x + \frac{1}{2}x^2 n_i
$$

### Point distance
Currently, there is no dedicated distance function, but the following convention is used for two conformal points $P, Q$

$$
\|x-y\|^2 = -2(P \cdot Q)
$$

~~~ts
const d2 = -2 * p1.dot(p2).basisSVal('e_');
~~~

## Basic operations

| Operation | Code | What it does |
| --- | --- | --- |
| Geometric product | `A.gp(B)` | Full GA product |
| Outer product | `A.op(B)` | Wedge/joining blade parts |
| Inner product | `A.dot(B)` | Contraction/projection style product |
| Meet | `cga.meet(A, B)` | Regressive intersection |
| Dual | `A.dual()` | OPNS/IPNS conversion helper |
| Undual | `A.unDual()` | Inverse dual conversion |
| Reverse | `A.reverse()` | Reverse basis factor order |
| Normalize | `A.normalize()` | Normalize magnitude |
| Scalar multiply | `A.smul(k)` | Scale by scalar |
| Grade select | `A.selectGrade(g)` | Keep only one grade |
| Get scalar part | `A.basisSVal('e_')` | Read scalar coefficient |
| Get component | `A.basisSVal('e_12')` | Read specific basis coefficient |
| Check grades | `A.getGrades()` | Inspect present grades |

## Helper API

From [src/algebra/cgaHelpers.ts](../src/algebra/cgaHelpers.ts):

| Call | Result | Notes |
| --- | --- | --- |
| `cga.up(coords or euclidean MV)` | grade-1 MV | Lifts a Euclidean position up to a CGA point |
| `cga.down(P)` | `[x,y,z]` or null | Null for ideal or non-finite points |
| `cga.directionOf(P)` | `[x,y,z]` or null | Direction of an ideal point |
| `cga.vec3(v)` | `[x,y,z]` | Just pulls the Euclidean components |
| `cga.classify(mv)` | primitive or null | Works out the primitive from the grade |
| `cga.embed(primitive)` | MV or null | Partial, point/direction/sphere only |
| `cga.meet(a,b)` | MV | `a.dual().op(b.dual()).unDual()` |
| `cga.sphere(center,radius)` | MV | IPNS sphere |
| `cga.translator(direction,distance)` | MV | `1 - 0.5 * d ^ ni * distance` |
| `cga.basis` | object | no, ni, I5, e1, e2, e3, one (TODO: not complete) |

The mirror scene has additional helpers from [src/scenes/cga/cgaMirrors.ts](../src/scenes/cga/cgaMirrors.ts):

| Call | Result | Notes |
| --- | --- | --- |
| `point(coords)` | MV | Alias for `cga.up` |
| `sphere(center,radius)` | MV | IPNS sphere |
| `plane(normal,distance)` | MV | IPNS plane |
| `planeThroughPoint(normal,point)` | MV | IPNS plane through a point |
| `circle(center,radius,normal)` | MV | Built as `(sphere ^ plane).dual()` |
| `invert(object,mirror)` | MV | Sandwich, normalized by the mirror squared |
| `down(cgaPoint)` | `[x,y,z]` | Wraps `cga.down`, falls back to `[0,0,0]` |
| `dual(mv)` | MV | Plain dual helper |

## How classify behaves

Grade tells you the primitive, see [src/algebra/cgaHelpers.ts](../src/algebra/cgaHelpers.ts):

- grade 1: point or direction
- grade 2: point pair
- grade 3: circle or line
- grade 4: sphere or plane

Two edge cases to keep in mind:

- Mixed-grade multivectors (rotors, motors) classify as null (for now).
- A plain Euclidean grade-1 vector with no conformal part is also null, run it through `up()` first to get a proper CGA point.

## IPNS vs OPNS when rendering

RenderMv classifies a multivector to figure out what geometry to draw, see [src/geometry/RenderMv.svelte](../src/geometry/RenderMv.svelte). Rule of thumb:

- a CGA point from `cga.up` renders directly
- an IPNS sphere or plane need to be dualized first
- an OPNS circle, line, or point pair renders directly

See the mirror demo in [src/scenes/cga/MirrorDemo.svelte](../src/scenes/cga/MirrorDemo.svelte) where the mirror sphere renders as `mirrorMv.dual()`, the mirror plane renders as `mirrorMv.dual()`, and the mirror circle renders as-is

## Meet, translation, and inversion

Meet is the usual dual-wedge-undual regressive product:

$$
(a \vee b)^* = (a^* \wedge b^*)
$$

~~~ts
const result = cga.meet(a, b); // a.dual().op(b.dual()).unDual()
~~~

The translator helper:

$$
T = 1 - \frac12(d \wedge n_i) * \mathrm{distance}
$$

and the inversion the mirrors use in [src/scenes/cga/cgaMirrors.ts](../src/scenes/cga/cgaMirrors.ts):

$$
\text{invert}(X) = \frac{M X \widetilde{M}}{M^2}
$$

with a guard for when $M^2$ gets close to zero.

## Practical recipes

Before copying snippets: normalize blades/rotors where needed, and keep an eye on conformal scale (for points, usually check that $-P\cdot n_i$ is finite and not near zero).

### Build common objects

~~~ts
// OPNS line from two points
const L = p1.op(p2).op(ni);

// OPNS circle from three points
const C = p1.op(p2).op(p3);

// OPNS plane from three points (+ infinity)
const Pi = p1.op(p2).op(p3).op(ni);

// OPNS sphere from four points
const S = p1.op(p2).op(p3).op(p4);

// IPNS sphere from center + radius
const Sipns = cga.up(center).sub(ni.smul(0.5 * radius * radius));
~~~

### Meet / intersection patterns

~~~ts
// sphere-sphere -> circle (both in IPNS)
const C = cga.meet(S0, S1);

// sphere-plane -> circle (both in IPNS)
const C2 = cga.meet(Sipns, Pipns);

// plane-circle -> point pair (usually OPNS inputs in this codebase)
const PP = cga.meet(planeOpns, circleOpns).selectGrade(2).normalize();

// pick one point from a real point pair
const ppSq = PP.gp(PP).basisSVal('e_');
if (ppSq > 0) {
  const point = one.add(PP.smul(1 / Math.sqrt(ppSq))).gp(PP.dot(ni));
}
~~~

### Motors, translators, rotors

~~~ts
// translator from Euclidean direction vec = dx e1 + dy e2 + dz e3
const vec = e1.smul(dx).add(e2.smul(dy)).add(e3.smul(dz));
const tGen = vec.op(ni).smul(0.5);
const T = tGen.exp(1);

// rotor from a bivector axis and angle
const B = e1.op(e2);          // example axis plane
const R = B.smul(theta / 2).exp(1).normalize();

// apply as sandwich
const moved = T.gp(P).gp(T.reverse());
const rotated = R.gp(P).gp(R.reverse());

// motor composition example (translate, rotate, translate back)
const motor = Tfrom.gp(R).gp(Tto).normalize();
const result = motor.gp(P).gp(motor.reverse());
~~~

### IK setup (sphere-sphere)

~~~ts
const S0 = no.sub(ni.smul(0.5 * rho * rho)).dual();
const S1 = target.sub(ni.smul(0.5 * l * l)).dual();
const C = cga.meet(S0, S1); // intersection circle
~~~

### Project line/blade onto a plane-like blade

~~~ts
const projected = L.dot(planeLike).dot(planeLike).normalize();
~~~

### Angle from two normalized blades

~~~ts
const cosTheta = A.dot(B).basisSVal('e_') ?? 0;
const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
~~~

## Existing Scenes
### Scene 200, CGA Mirrors
- [src/scenes/cga/MirrorDemo.svelte](../src/scenes/cga/MirrorDemo.svelte)
- [src/scenes/cga/MirrorConfig.svelte](../src/scenes/cga/MirrorConfig.svelte)
- [src/scenes/cga/mirrorState.svelte.ts](../src/scenes/cga/mirrorState.svelte.ts)
- [src/scenes/cga/cgaMirrors.ts](../src/scenes/cga/cgaMirrors.ts)

Mirror state does sphere, circle and plane mirrors, with point, sphere and circle objects.

These robot scenes below are also CGA-heavy, but they are registered under the `robot` group (not `cga`) in `src/scenes/index.ts`.

### Scene 20, Serial Robot Forward Kinematics

- [src/scenes/robot/Slide20Refactored.svelte](../src/scenes/robot/Slide20Refactored.svelte)

Shows how to compose rotors for sequential joint transforms.

### Scene 22, Serial Robot with Motors

- [src/scenes/robot/Slide22Refactored.svelte](../src/scenes/robot/Slide22Refactored.svelte)

Shows conformal rigid motions for the links, not just pure rotations.

### Scene 24, Serial Robot Inverse Kinematics

- [src/scenes/robot/Slide24Refactored.svelte](../src/scenes/robot/Slide24Refactored.svelte)

Uses sphere-sphere intersection in CGA to solve 2-link inverse kinematics. Has draggable target point.

### Scene 28, 2-DOF Agile Eye Forward Kinematics

- [src/scenes/robot/Slide28Refactored.svelte](../src/scenes/robot/Slide28Refactored.svelte)

Parallel arm mechanism with two rotational DOF. Uses plane-sphere intersections to position the end point. More complex constraint solving than serial arms.

### Scene 30, 3-DOF Agile Eye Inverse Kinematics

- [src/scenes/robot/Slide30Refactored.svelte](../src/scenes/robot/Slide30Refactored.svelte)

Builds constraint circles from plane-sphere meets, then intersects them to find elbow points.

### Scene 35, Delta Robot Forward Kinematics

- [src/scenes/robot/Slide35Refactored.svelte](../src/scenes/robot/Slide35Refactored.svelte)

Solves forward kinematics by intersecting three spheres in CGA.

### Scene 38, Delta Robot Inverse Kinematics

- [src/scenes/robot/Slide38Refactored.svelte](../src/scenes/robot/Slide38Refactored.svelte)

Drag the end point to compute motor angles from per-leg circle/sphere constraints.

## Testing commands/examples

Relevant scripts from [package.json](../package.json):

~~~bash
npm run test      # vitest watch mode (useful for writing tests)
npm run testAll   # run full test suite once
npm run testCga   # run only CGA tests
~~~

Tiny excerpt from [src/algebra/cga.test.ts](../src/algebra/cga.test.ts):

~~~ts
const coords = [1.5, -2.3, 0.7] as const;
const pt = cga.up(coords);
const back = cga.down(pt);
// expect back close to coords
~~~

[src/algebra/cga.test.ts](../src/algebra/cga.test.ts) covers:

- basis metric and null-vector checks
- up/down roundtrips
- exp-based rotor checks
- meet grades for plane-plane and plane-sphere

A few tests are skipped because we haven't sorted the behavior out:

- matching the dual sign convention against ganja's
- the sign of a real circle's square
- a circle-circle intersection from the slide30 debugging notes

## When something looks wrong

1. Check which form you're in (IPNS or OPNS) before rendering.
2. Log what `classify` gives back for the multivector in question.
3. Check at the grades with `getGrades`.
4. Print the multivector with `toStr` to see the basis components.
5. Normalize if repeated products have drifted.

~~~ts
console.log(X.toStr());
console.log(cga.classify(X));
console.log(X.getGrades());
console.log(X.toStr());
console.log(X.basisSVal('e_12'));
~~~
