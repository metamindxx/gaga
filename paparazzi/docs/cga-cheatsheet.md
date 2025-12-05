# CGA Cheatsheet (Conformal Geometric Algebra)

A compact set of formulas and code recipes for conformal geometric algebra (CGA) as used in this repository. This is a reference to help quickly implement common CGA operations with the project's API.

---

## Conformal basis (3D → 5D model)
Math:
- Add two null basis vectors `n0` and `ni` (sometimes `n` and `\bar{n}`):
  - `n0` is the origin direction, `ni` is the point-at-infinity direction.

Code (project):
- Created in `src/cgaBasis.js`:
  - `cga.n0 = bs.multiVector({ e_m: 0.5, e_p: -0.5 });`
  - `cga.ni = bs.multiVector({ e_m: 1, e_p: 1 });`
  - `cga.I5 = bs.multiVector({ e_123pm: 1 }); // pseudoscalar (I5)`

Note: The exact conventions (signs/scalar factors) depend on the implementation; use `cga.n0` and `cga.ni` objects from the project.

---

## Points
Math (point at x = (x,y,z)):
- P(x) = n0 + x + (1/2)(x·x) ni
  - where x is the Euclidean vector.
  - Note: the scalar factor and sign depend on the chosen null basis.

Code examples:
- Manual construction (used in `src/main.js`):
  - `const x3d = cgaBs.multiVector({ e_1: x, e_2: y, e_3: z });`
  - `const infScale = (x*x + y*y + z*z) / 2;`
  - `const P = cga.n0.add(x3d).add(cga.ni.smul(infScale));`
- Helper in project (`cga.pt` / `cga.pointXYZ` may exist):
  - `const P = cga.pt(x, y, z);` // in `playground` helpers

### Extract Euclidean coordinates from a CGA point:
- Math (normalized IPNS/OPNS): divide by `-P·ni`:
  - x = P_e1 / (-P·ni)
  - y = P_e2 / (-P·ni)
  - z = P_e3 / (-P·ni)

Code snippet (project):
- `pointXYZ` helper (Playground): `const {x,y,z} = cga.pointXYZ(P)` or manual as above by using `P.basisSVal("e_1")` etc.

---

## Inner product for points (distance)
Math:
- For two points P and Q: `P·Q = -0.5 * ||x - y||^2` (with our sign convention)
  - Use to compute squared distances and checks.

Code:
- `let d2 = -2 * p1.scalarProduct(p2);`  // or adjust sign depending on conventions.

---

## Geometric operations (basic)
- `gp` → geometric product: `A.gp(B)`
- `op` → outer/wedge product: `A.op(B)` (A ∧ B)
- `join` → join (vee product) implemented via duality; use for lines/planes in some APIs
- `dual()` / `unDual()` → convert between OPNS/IPNS
- `smul(k)` → scalar multiplication: `A.smul(k)`
- `exp(1)` → exponential of a bivector/vector to create rotors/translators
- `reverse()` → reverse of rotor
- `normalize()` / `smul(1/...)` → normalize multivectors
- `selectGrade(g)` → keep only the grade `g` components (e.g., `selectGrade(2)` to get a bivector)
- `scalarProduct()` → scalar product
- `.basisSVal("e_1")` or `.bVal()` → get component value

---

## Lines, Planes, Circles, Spheres (OPNS and IPNS forms)
- Line (OPNS): `L = P1 ∧ P2 ∧ ni` (grade 3)  // includes point at infinity
  - Code (project): `const line = p1.join(p2);` or `const L = p1.op(p2.op(cga.ni));`

- Circle (OPNS): `C = P1 ∧ P2 ∧ P3` (grade 3)
  - Code: `const c = p1.op(p2.op(p3));`

- Plane (OPNS): `Plane = P1 ∧ P2 ∧ P3 ∧ ni` (grade 4)
  - Code: `const plane = p1.op(p2.op(p3.op(cga.ni)));` or `line.join(p)` etc.

- Sphere (OPNS): `S = P1 ∧ P2 ∧ P3 ∧ P4` (grade 4)
  - Code: `const s = p1.op(p2.op(p3.op(p4)));`

Dual forms (IPNS):
- IPNS (dual) forms often easier to extract centers/normals:
  - `dual` or `unDual` used to switch representation.
  - Convert circle to dual with `circ_dual = (Lc) * Iplane` as shown in code.

---

## Centers and normals
- Circle center (conformal formula Eq. 4.51):
  - Math: `P0 = Lc * ni * Lc` (reflect infinity in circle)
  - Code (project):
    - `const cRaw = Lc.gp(cga.ni).gp(Lc);`
    - `const norm = -1 / cRaw.dot(cga.ni).basisSVal("e_");`
    - `const cCentre = cRaw.smul(norm);` // normalized so -P0·ni = 1

- Sphere center (dual method):
  - Code (project):
    - `var sphD = cga.I5.gp(sphereOP);` // dual sphere
    - `var sphDn = Math.abs(sphD.scalarProduct(cga.ni));` // normalise if needed
    - `var centre = sphD.gp(cga.ni.gp(sphD));`

- Plane normal (from IPNS plane):
  - Given planeIPNS = P1 ∧ P2 ∧ P3 ∧ ni
  - Euclidean normal via dual/unDual or selectGrade(2)
  - Example in project: `const c1PlaneIpns = c1.op(cga.ni).dual();` (circle plane IPNS), then `const planeBivector = c1PlaneIpns.unDual().selectGrade(2).normalize()` gives a normalized Euclidean bivector for rotation generation.

- Radius:
  - Use dual circle or sphere magnitude. Example (project): `var rad = Math.pow(circ_dual.sq(), 0.5);`

---

## Rotors and Translators (Transformers)
- Translation:
  - Generator: `T_g = (v gp ni) * 0.5`  (v is Euclidean vector)
  - Translator (spinor): `T = exp(T_g)`
  - In code:
    - `const centreVec = cgaBs.multiVector({ e_1: x, e_2: y, e_3: z });`
    - `const tGen = centreVec.gp(cga.ni).smul(0.5);`
    - `const Tf = tGen.exp(1);` // translate from center
    - `const Tt = tGen.smul(-1).exp(1);` // translate to center

- Rotation:
  - Generator: plane bivector B (dual of IPNS plane or selectGrade(2) bivector)
  - Rotor: `R = exp(B * theta)`
  - Apply rotation about a point: `T_f * R * T_t` where `T_f` and `T_t` translate from/to center
  - Code (project):
    - `const rotor = B.smul(theta).exp(1);`
    - `const combined = T_from.gp(rotor.gp(T_to));` and apply with `combined.gp(pt).gp(combined.reverse())`

- Use `reverse()` for inverse application and `normalize()` for numerical stability.

---

## Useful code recipes (compact)
Create a point:
```
const P = cga.n0.add(cgaBs.multiVector({e_1:x,e_2:y,e_3:z})).add(cga.ni.smul((x*x+y*y+z*z)/2))
```

Circle through 3 points and its center:
```
const c = p1.op(p2.op(p3)); // OPNS circle
const cRaw = c.gp(cga.ni).gp(c);
const cNorm = -1 / cRaw.dot(cga.ni).basisSVal("e_");
const center = cRaw.smul(cNorm);

// plane bivector (rotation generator)
const planeIpns = c.op(cga.ni).dual();
const B = planeIpns.unDual().selectGrade(2).normalize();

// translator to/from center
const v = cgaBs.multiVector({ e_1: center.basisSVal("e_1"), e_2: center.basisSVal("e_2"), e_3: center.basisSVal("e_3") });
const tGen = v.gp(cga.ni).smul(0.5);
const T_from = tGen.exp(1);
const T_to = tGen.smul(-1).exp(1);

// rotor for angle theta
const R = B.smul(theta).exp(1);
const combined = T_from.gp(R.gp(T_to)).normalize();

// rotate a point
const rotated = combined.gp(point).gp(combined.reverse());
```

Create a line between two points (dual/OPNS handling):
```
const L = p1.join(p2); // uses dual trick internally: !( !p1 ∧ !p2 )
```

Plane from line and a point (example shows `join` chaining in repo):
```
const plane = line.join(pointC);
```

Dualizing and converting forms:
- `mv.dual()` and `mv.unDual()` are available.
- `mv.selectGrade(g)` to pull bivectors/lines, etc.

---

## Debugging / Visualization helpers in repo
- `mv.strLog("label")` logs the multi-vector for debugging
- `render()` calls exist in the CGA basis to render points/circles/planes (see `cga.renderMV` in `cgaBasis.js`)
- Use `basisSVal` / `bVal` to extract components for debugging or building plain JS bounds.

---

## Common gotchas
- Keep track of normalization: many IPNS/OPNS forms expect normalization so that, e.g., `-P·ni = 1` for points, `dual` forms may require scaling.
- `join` uses duality; when mixing raw `op` and `join`, be careful which form (IPNS/OPNS) you have before operations.
- For rotations centered on a point, translate the rotor's center to origin, rotate, then translate back (T R T^{-1}).
- Always normalize rotors and plane bivectors where required.

---

## Sources & Further Reading
- Richard A. Miller — "Geometric Algebra: An Introduction with Applications in Euclidean and Conformal Geometry" — Chapter 4 (conformal model). See formula (4.51) for circle center: P0 = Lc ni Lc.
- Lasenby, Lasenby & coworkers — Covariant approach to geometry — (useful for formal derivations).
- Project source files with working examples:
  - `src/main.js` — example usage for building points/circles/rotors
  - `src/cgaBasis.js` — core CGA functions, helper renderers
  - `src/basisSet.js` — multivector ops (gp, op, join, dual/unDual, etc.)

---

If you'd like, I can extend this cheatsheet with more detailed examples (e.g., reflection, inversion), small visual tests, or a step-by-step example showing a circle rotated around its center in the scene (with code to render axis and rotating points).