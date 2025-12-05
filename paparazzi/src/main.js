import * as THREE from "three";
import { createCemoVanillaCamera } from "./cameras/cemoVanillaCamera.js";
// import { createCemoOrthCamera } from "./cameras/cemoOrthCamera.js";
// import { createCemoQuadCamera } from "./cameras/cemoQuadCamera.js";
import { createCgaBasis } from "./cgaBasis.js";
import { createPgaBasis } from "./pgaBasis.js";
import { createBasisSet } from "./basisSet.js";
import {
  createCemoHelpers
  , cRed
  , cBlue
  , cGreen
} from "./dot_js/cemo_01.js";

const cgaBs = createBasisSet();
const pgaBs = createBasisSet();

const cemo = createCemoHelpers();

// scene, camera
const scene = new THREE.Scene();
var cemoCam = createCemoVanillaCamera("points_div");
// var cemoCam = createCemoOrthCamera('points_div')
cemoCam.init(scene);
var camera = cemoCam.camera; // main camera
camera.position.set(2, 4, 4);
camera.lookAt(new THREE.Vector3(0, 0, 0));
//camera.rotation.z += Math.PI/2

// lights
scene.add(new THREE.AmbientLight(0x444444));
var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(10, 20, 50);
scene.add(light);

// materials
// const loader = new THREE.TextureLoader();
// var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("/textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})
var mtrlRed = new THREE.LineBasicMaterial({ color: 0xff0000 });
var mtrlGreen = new THREE.LineBasicMaterial({ color: 0x00ff00 });
var mtrlBlue = new THREE.LineBasicMaterial({ color: 0x0000ff });

// axes
cemo.addVectorToScene(
  [
    [0, 0, 0]
    , [1, 0, 0]
  ]
  , mtrlRed
  , scene
);
cemo.addVectorToScene(
  [
    [0, 0, 0]
    , [0, 1, 0]
  ]
  , mtrlGreen
  , scene
);
cemo.addVectorToScene(
  [
    [0, 0, 0]
    , [0, 0, 1]
  ]
  , mtrlBlue
  , scene
);

// ==============================================================================
// CGA (Conformal Geometric Algebra) Demo
// ==============================================================================
//
// REFERENCES:
//   [Miller]  R.A. Miller, "Geometric Algebra: An Introduction with Applications in Euclidean and Conformal Geometry"
//   [Lasenby] Lasenby et al., "A Covariant Approach to Geometry using GA"
//
// ==============================================================================

var cga = createCgaBasis(scene, { basisSet: cgaBs, cemo });

// ------------------------------------------------------------------------------
// STEP 1: Create a conformal point from Euclidean coordinates (x, y, z)
//
// [Miller 4.1.4, Eq 4.10] Standard form of a conformal point:
//   X = 1/2 (2x + x**2 * ni - n0)
// ------------------------------------------------------------------------------
var point = function (x, y, z) {
  // Euclidean part: x * e_1 + y * e_2 + z * e_3
  let euclidean = cgaBs.multiVector({ e_1: x, e_2: y, e_3: z });
  // Infinity coefficient: 1/2 * |x|**2
  let infScale = (x * x + y * y + z * z) / 2;
  // Full conformal point: n0 + euclidean + infScale * ni
  return cga.n0.add(euclidean).add(cga.ni.smul(infScale));
};

// ------------------------------------------------------------------------------
// STEP 2: Create three points and wedge them to form a circle (OPNS)
//
// [Miller 4.4.4, Eq 4.49] Circle as outer product of three points:
//   Lc = A ^ B ^ C
// where A, B, C are conformal mappings of three non-collinear Euclidean points.
//
// [Miller 4.3.2] This is an OPNS (Outer Product Null Space) representation:
//   OPNScircle = {X | X ^ A ^ B ^ C = 0}
// The circle is the set of all conformal points X satisfying this equation.
// ------------------------------------------------------------------------------
const pt1 = point(-2, 0, 1);
const pt2 = point(1, -1, 0.5);
const pt3 = point(1, 1, 2);

// Outer product (wedge) of three points = circle through all three
const circle = pt1.op(pt2).op(pt3);

// ------------------------------------------------------------------------------
// STEP 3: Extract the circle's center
//
// [Miller 4.4.4, Eq 4.51] Center of a circle:
//   P0 = Lc * ni * Lc
// The operation Lc M Lc reflects any object M in the circle Lc.
// The center is the image of the point at infinity under reflection in the circle.
//
// [Miller 4.1.4, Eq 4.12] Normalize to standard form:
//   P_hat = P / (-P.dot(ni))
// so that -P_hat.dot(ni) = 1, then Euclidean coords can be read directly from e_1, e_2, e_3.
// ------------------------------------------------------------------------------
// Compute unnormalized center via sandwich product
const centreRaw = circle.gp(cga.ni).gp(circle);
// Normalize: scale so that -P0.dot(ni) = 1
const normFactor = -1 / centreRaw.scalarProduct(cga.ni);
const centre = centreRaw.smul(normFactor);

// Extract Euclidean (x,y,z) coordinates from the normalized conformal point
const centreXYZ = {
  x: centre.basisSVal("e_1")
  , y: centre.basisSVal("e_2")
  , z: centre.basisSVal("e_3")
};

// ------------------------------------------------------------------------------
// STEP 4: Compute the plane normal via wedge product and duality
//
// [Miller 2.3, Def 2.3.4] Outer product of two vectors:
//   u ^ v = oriented area (bivector) in the plane spanned by u and v
//
// [Miller 4.3.1, Def 4.3.1, Eq 4.39] Duality:
//   A* = A I^-1
// where I is the unit pseudoscalar. In R3 with I = e_1 e_2 e_3:
//   (e_2 e_3)* = e_1,  (e_3 e_1)* = e_2,  (e_1 e_2)* = e_3
//
// So the dual of a plane bivector is its normal vector.
// ------------------------------------------------------------------------------

// Extract Euclidean (grade-1) parts from the conformal points
const euclidean1 = pt1.selectGrade(1);
const euclidean2 = pt2.selectGrade(1);
const euclidean3 = pt3.selectGrade(1);

// Vectors in the plane (displacement vectors between points)
const vec12 = euclidean2.sub(euclidean1);  // p2 - p1
const vec13 = euclidean3.sub(euclidean1);  // p3 - p1

// Wedge product gives the plane bivector (in Euclidean 3D)
const planeBivector = vec12.op(vec13);
planeBivector.strLog("planeBivector (vec12 ^ vec13)");

// [Miller 4.3.1, Eq 4.39] Hodge dual in R3:
//   (e_2 e_3)* = e_1,  (e_3 e_1)* = e_2,  (e_1 e_2)* = e_3
// So bivector components map to normal vector components.
//
// TODO: use planeBivector.dual() instead of manual extraction.
const normal = {
  x: planeBivector.basisSVal("e_23")
  , y: -planeBivector.basisSVal("e_13")  // e_31 = -e_13
  , z: planeBivector.basisSVal("e_12")
};

// Normalize to unit length (required? for rotor to be a pure rotation)
const nMag = Math.hypot(normal.x, normal.y, normal.z);
normal.x /= nMag;
normal.y /= nMag;
normal.z /= nMag;

console.log("Plane normal (from GA wedge product):", normal.x, normal.y, normal.z);

// ------------------------------------------------------------------------------
// STEP 5: Build the Euclidean rotation bivector
//
// [Miller 3.7, Theorem 3.7.1, Eq 3.26] Rotation formula:
//   Let RI(2)θ(u) denote the rotation of a vector u by the angle θ around an axis perpendicular to the plane I(2)
//   R_{I(2),theta}(u) = exp(-I(2) * theta / 2) u exp(I(2) * theta / 2)
//
// [Miller 3.4, Def 3.4.2] Exponential of a bivector:
//   exp(I(2) * theta) = cos(theta) + I(2) * sin(theta)
//
// The bivector B = nx * e_23 + ny * e_31 + nz * e_12 generates rotation IN the plane
// perpendicular to axis (nx, ny, nz) - which is exactly our circle's plane.
// ------------------------------------------------------------------------------
const rotBivector = cgaBs.multiVector({
  e_23: normal.x
  , e_13: -normal.y  // Note: e_31 = -e_13, so we negate
  , e_12: normal.z
});
console.log("rotBivector blades:");
console.log("  e_12:", rotBivector.basisSVal("e_12"));
console.log("  e_13:", rotBivector.basisSVal("e_13"));
console.log("  e_23:", rotBivector.basisSVal("e_23"));
console.log("  e_31:", rotBivector.basisSVal("e_31"));
rotBivector.strLog("rotBivector");

// Test: what does exp give us?
const testRotor = rotBivector.smul(0.5).exp(1);
console.log("testRotor grade:", testRotor.grade());
testRotor.strLog("testRotor = exp(B * 0.5)");

// ------------------------------------------------------------------------------
// STEP 6: Build translator to rotate about circle center (not origin)
//
// [Miller 4.2.1, Eq 4.14] Translation rotors:
//   Ta = exp(na/2) = 1 + na/2   (because (na)**2 = 0, null bivector)
//   T_tilde = exp(-na/2) = 1 - na/2
//
// These translators are used to construct the Motor for rotation about the center.
// ------------------------------------------------------------------------------
const cx = centreXYZ.x, cy = centreXYZ.y, cz = centreXYZ.z;
console.log("Circle center:", cx, cy, cz);

// Build translator directly (not via exp)
// T = 1 - 0.5 * centreVec * ni
const centreVec = cgaBs.multiVector({ e_1: cx, e_2: cy, e_3: cz });
const halfCentreNi = centreVec.op(cga.ni).smul(0.5);

// T translates FROM origin TO centre
// T = 1 - 0.5 * c * ni
const T = cgaBs.multiVector({ e_: 1 }).sub(halfCentreNi);
T.strLog("T (translator to centre)");

// T_inv translates FROM centre TO origin  
// T_inv = 1 + 0.5 * c * ni
const T_inv = cgaBs.multiVector({ e_: 1 }).add(halfCentreNi);
T_inv.strLog("T_inv (translator to origin)");

// Verify: T * T_inv should equal 1
const T_check = T.gp(T_inv);
T_check.strLog("T * T_inv (should be ~1)");

// ------------------------------------------------------------------------------
// STEP 7: Render static elements
// ------------------------------------------------------------------------------
// Draw the circle
cga.renderMV(circle, { color: 0x3366cc });

// Draw the center as a red dot
centre.render({ color: 0xff0000, size: 0.08 });

// Draw axis line through centre
const axisLen = 2;
/** @type {[number[], number[]]} */
const axisEndpoints = [
  [cx - normal.x * axisLen, cy - normal.y * axisLen, cz - normal.z * axisLen]
  , [cx + normal.x * axisLen, cy + normal.y * axisLen, cz + normal.z * axisLen]
];
cemo.addVectorToScene(axisEndpoints, new THREE.LineBasicMaterial({ color: 0xffaa00 }), scene);

// ------------------------------------------------------------------------------
// STEP 8: Animation — Rotate points around the circle's center
//
// [Miller 4.2.2] Rotation:
//   To rotate about an arbitrary point C, we construct a Motor M:
//   M = T * R * T_inv
//   where T translates origin to C, and R is the rotation rotor at the origin.
//
//   X' = M * X * M_rev
// ------------------------------------------------------------------------------
let angle = 0;
const SPEED = Math.PI / 400;

function animate() {
  angle += SPEED;

  // [Miller 3.7] Build rotor: R = exp(B * theta) where B is the rotation bivector
  const R = rotBivector.smul(angle).exp(1);

  // [Miller 4.2.1] Construct Motor M = T * R * T_inv
  // T translates origin -> center
  // T_inv translates center -> origin
  // So M moves space so center is at origin, rotates, then moves back.
  //
  // Reverting to T * R * T_inv.
  // Derivation:
  // To rotate around C:
  // 1. Translate by -C (move C to origin). Operator: T_inv.
  // 2. Rotate at origin. Operator: R.
  // 3. Translate by +C (move origin to C). Operator: T.
  // Sequence on vector X: X' = T (R (T_inv X T_inv~) R~) T~
  // Motor M = T * R * T_inv.
  //
  // T = 1 - 0.5 c ni (Translation by +c)
  // T_inv = 1 + 0.5 c ni (Translation by -c)
  const M = T.gp(R).gp(T_inv);
  const M_rev = M.reverse();

  // DEBUG: Verify center is invariant.
  // If M rotates around C, then M * C * M~ should equal C.
  // If M rotates around -C, then C will move significantly.
  // const centreRotated = M.gp(centre).gp(M_rev);
  // centreRotated.render({ color: 0xffff00, size: 0.05 }); // Yellow dot should overlap red dot

  // Apply motor to points
  const pt1_rot = M.gp(pt1).gp(M_rev);
  const pt2_rot = M.gp(pt2).gp(M_rev);
  const pt3_rot = M.gp(pt3).gp(M_rev);

  pt1_rot.render({ color: cRed, size: 0.12 });
  pt2_rot.render({ color: cGreen, size: 0.12 });
  pt3_rot.render({ color: cBlue, size: 0.12 });
}

// ================
// PGA demo objects
var pga = createPgaBasis(scene, { basisSet: pgaBs, cemo });
const PGA_OFFSET = new THREE.Vector3(0, 4, 0);
const pointA = pga
  .pt(PGA_OFFSET.x + 0.4, PGA_OFFSET.y + 1.1, PGA_OFFSET.z - 0.2)
  // .render({ color: 0xf5a623, size: 0.14 });
const pointB = pga
  .pt(PGA_OFFSET.x - 0.8, PGA_OFFSET.y - 0.4, PGA_OFFSET.z + 0.9)
  // .render({ color: 0x14f0ff, size: 0.14 });
const pointC = pga
  .pt(PGA_OFFSET.x + 0.6, PGA_OFFSET.y + 0.2, PGA_OFFSET.z + 1.4)
  // .render({ color: 0x88ff88, size: 0.14 });

const lineAB = pointA.join(pointB);
// lineAB.render({
//   color: 0xff00ff,
//   length: 5,
// });

const planeABC = lineAB.join(pointC);
planeABC.strLog("planeABC");
// planeABC.render({ color: 0x3366cc, size: 7 });

/* eslint-disable-next-line no-unused-vars -- sample polyline kept for quick rendering experiments */
const polylinePoints = [
  pga.pt(PGA_OFFSET.x + 0, PGA_OFFSET.y + 0, PGA_OFFSET.z + 0)
  , pga.pt(PGA_OFFSET.x - 1, PGA_OFFSET.y + 0, PGA_OFFSET.z + 1)
  , pga.pt(PGA_OFFSET.x + 0, PGA_OFFSET.y + 1, PGA_OFFSET.z + 2)
  , pga.pt(PGA_OFFSET.x + 0, PGA_OFFSET.y + 0, PGA_OFFSET.z + 3)
];
// pga.renderMV(polylinePoints, { color: 0xffaa00 });

// ================
// HTML overlays
var bannerDiv = document.getElementById("banner_div");
if (bannerDiv) {
  bannerDiv.style.fontFamily = "Courier New, Courier";
  bannerDiv.style.position = "absolute";
  bannerDiv.style.zIndex = "3";
}
//bannerDiv.innerHTML = 'banner! Yey!' // bs.renderHtml()

var infoDiv = document.getElementById("info_div");
if (infoDiv) {
  infoDiv.style.fontFamily = "Courier New, Courier";
  infoDiv.style.position = "absolute";
  infoDiv.style.zIndex = "3";
}
//infoDiv.innerHTML = bs.renderHtml({order: 'creation', vectors: true})
//infoDiv.innerHTML = bs.renderHtml()
//infoDiv.innerHTML = 'info:'

//var bladeOrder = ['e','e1','e2','e3','e4','e5','e12','e13','e14','e15','e23','e24','e25','e34','e35','e45','e123','e124','e125','e134','e135','e145','e234','e235','e245','e345','e1234','e1235','e1245','e1345','e2345','e12345']
/*
bladeOrder = ['e_',
				 'e_0',   'e_1',   'e_2',   'e_3',
				          'e_10',  'e_20',  'e_30',
				          'e_23',  'e_13',  'e_12',
				 'e_123', 'e_130', 'e_230', 'e_120',
			 'e_1230']
infoDiv.innerHTML = cgaBs.cayleyHtml({order: bladeOrder})
*/
//infoDiv.innerHTML = cgaBs.cayleyHtml()

// ==============================================================================
// PGA Dynamics Demo (from PGAdyn.pdf)
// ==============================================================================

// 1. Define the object (Cube at origin)
const cubePointsBody = [];
const cubeSize = 1.0;
for (let x of [-0.5, 0.5]) {
  for (let y of [-0.5, 0.5]) {
    for (let z of [-0.5, 0.5]) {
      cubePointsBody.push(pga.pt(x * cubeSize, y * cubeSize, z * cubeSize));
    }
  }
}
const cubeEdges = [
  [0, 1], [1, 3], [3, 2], [2, 0] // Bottom
  , [4, 5], [5, 7], [7, 6], [6, 4] // Top
  , [0, 4], [1, 5], [2, 6], [3, 7] // Sides
];

// Setup visual mesh for the cube (reuse geometry for performance)
const cubeGeo = new THREE.BufferGeometry();
const cubePos = new Float32Array(cubeEdges.length * 2 * 3); // 2 points per edge, 3 coords per point
cubeGeo.setAttribute("position", new THREE.BufferAttribute(cubePos, 3));
const cubeMat = new THREE.LineBasicMaterial({ color: 0xff00ff });
const cubeMesh = new THREE.LineSegments(cubeGeo, cubeMat);
scene.add(cubeMesh);

// 2. Initial State
// M: Start with translation to PGA_OFFSET
// [PGAdyn.pdf Section 1.5] The Motor Logarithm
// A translation by vector t = (tx, ty, tz) is represented by the motor:
//   T = exp( -1/2 * (tx*e01 + ty*e02 + tz*e03) )
// Note: e01, e02, e03 are ideal bivectors representing lines at infinity.
const tVec = pgaBs.multiVector({
  e_01: PGA_OFFSET.x
  , e_02: PGA_OFFSET.y
  , e_03: PGA_OFFSET.z
});
let M = tVec.smul(-0.5).exp(1);

// B: Initial Velocity (Twist)
// Rotation around y-axis (e13) and some translation
let B = pgaBs.multiVector({
  e_13: 2.0 // Rotation speed
  , e_02: 1.0 // Translation speed
});

// 3. Physics Update
function updatePGA(dt) {
  // [PGAdyn.pdf Section 2.1.1] Kinematics of Euclidean Motion
  // The derivative of the motor M is given by:
  //   dM/dt = -1/2 * M * B
  // where B is the velocity bivector (twist) in the body frame.
  const dM = M.gp(B).smul(-0.5);

  // [PGAdyn.pdf Section 2.1.1] Conservation of Momentum
  // In the absence of external forces, the derivative of the velocity bivector B is:
  //   dB/dt = - (dual(B) x B)^(-star)
  // where 'x' is the commutator product: A x B = 1/2 (AB - BA)
  //
  // Code implements: -0.5 * unDual( dual(B)*B - B*dual(B) )
  // This matches the formula: - unDual( 0.5 * (dual(B)*B - B*dual(B)) )
  const bDual = B.dual();
  const comm = bDual.gp(B).sub(B.gp(bDual));
  const dB = comm.unDual().smul(-0.5);

  // Euler Step (Integration)
  // M(t+dt) = M(t) + dM * dt
  // B(t+dt) = B(t) + dB * dt
  M = M.add(dM.smul(dt));
  B = B.add(dB.smul(dt));

  // Normalize M (approximate) to prevent drift
  // For this demo, let's try without normalization first.

  // Render
  // [PGAdyn.pdf Section 1.5] Rigid Body Transform
  // Points in body frame (x_b) are transformed to world frame (x_w) via sandwich product:
  //   x_w = M * x_b * ~M
  const M_rev = M.reverse();
  const transformedPoints = cubePointsBody.map((pt) => M.gp(pt).gp(M_rev));

  const positions = cubeMesh.geometry.attributes.position.array;
  let idx = 0;
  cubeEdges.forEach((edge) => {
    const p1 = transformedPoints[edge[0]];
    const p2 = transformedPoints[edge[1]];

    const v1 = pga.pointXYZ(p1);
    const v2 = pga.pointXYZ(p2);

    positions[idx++] = v1.x;
    positions[idx++] = v1.y;
    positions[idx++] = v1.z;
    positions[idx++] = v2.x;
    positions[idx++] = v2.y;
    positions[idx++] = v2.z;
  });
  cubeMesh.geometry.attributes.position.needsUpdate = true;
}

/**************************
 **	animate
 **************************/
function runAnimationLoop() {
  requestAnimationFrame(runAnimationLoop);

  // Call our CGA animation function (defined above in the CGA demo section)
  animate();

  // Call our PGA dynamics function
  updatePGA(0.016);

  cemoCam.renderer.render(scene, camera);
}
runAnimationLoop();
