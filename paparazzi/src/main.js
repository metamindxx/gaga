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
,} from "./dot_js/cemo_01.js";

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
  ,]
  , mtrlRed
  , scene
,);
cemo.addVectorToScene(
  [
    [0, 0, 0]
    , [0, 1, 0]
  ,]
  , mtrlGreen
  , scene
,);
cemo.addVectorToScene(
  [
    [0, 0, 0]
    , [0, 0, 1]
  ,]
  , mtrlBlue
  , scene
,);

// ================
// CGA demo objects

var cga = createCgaBasis(scene, { basisSet: cgaBs, cemo });
var point = function (x, y, z) {
  let x3d = cgaBs.multiVector({ e_1: x, e_2: y, e_3: z });
  let infScale = (x * x + y * y + z * z) / 2;
  return cga.n0.add(x3d).add(cga.ni.smul(infScale));
};

const pt1 = point(-2, 0, 1);
const pt2 = point(1, -1, 0.5);
const pt3 = point(1, 1, 2).smul(2);
const pt4 = point(0, 2, 0);
// circle OPNS (grade-3): c1 = P1 ∧ P2 ∧ P3
const c1 = pt1.op(pt2.op(pt3));
console.log("c1 grade =>", c1.grade());
// sphere OPNS (grade-4): s1 = c1 ∧ P4
const s1 = c1.op(pt4);
console.log("s1 grade =>", s1.grade());
// sphere through infinity (OPNS grade-4): s2 = c1 ∧ ni
const s2 = c1.op(cga.ni);
console.log("s2 grade =>", s2.grade());

pt1.strLog("pt1");
pt2.strLog("pt2");
pt3.strLog("pt3");
pt4.strLog("pt4");
c1.strLog("c1 (circle through pt1,pt2,pt3)");
s1.strLog("s1 (sphere through pt1,pt2,pt3,pt4)");
s2.strLog("s2 (sphere through pt1,pt2,pt3 and infinity)");

// ok, I have 4 points, a circle and 2 spheres.
// now to find the line through the circle centre perpendicular to the circle
// and use that to build a rotor to spin the circle about its centre

// Circle center from Eq. (4.51): P_0 = L_c * n_\infty * L_c, normalized so -P0·n_\infty = 1
// Grades:
//  - c1 (circle) is OPNS grade-3 (P1 ∧ P2 ∧ P3)
//  - cga.ni is grade-1 (point at infinity)
//  - P0 computed below should be a grade-1 MV (a conformal point)
const c1CentreRaw = c1.gp(cga.ni).gp(c1);
console.log("c1CentreRaw grade =>", c1CentreRaw.grade());
const c1CentreNormalization = -1 / c1CentreRaw.dot(cga.ni).basisSVal("e_");
const c1Centre = c1CentreRaw.smul(c1CentreNormalization);
c1Centre.strLog("c1Centre");
console.log("c1Centre grade =>", c1Centre.grade());

// Build an axis line through the circle center perpendicular to the circle plane:
// The canonical way in CGA is to join the centre point to another point in the
// direction of the plane normal (or point at infinity along that direction).
// We'll compute an explicit axis point from the plane's Euclidean bivector
// and join c1Centre to that point. The resulting axisLine is OPNS grade-3.

// Extract Euclidean center coordinates for building translators
const c1CentreCoords = {
  x: c1Centre.basisSVal("e_1")
  , y: c1Centre.basisSVal("e_2")
  , z: c1Centre.basisSVal("e_3")
,};

// Translator rotors that move points to/from the circle center before applying rotations
const cgaCentreVector = cgaBs.multiVector({
  e_1: c1CentreCoords.x
  , e_2: c1CentreCoords.y
  , e_3: c1CentreCoords.z
,});
// centreTranslationGenerator: bivector (euclidean vector ∧ ni) used for translation
const centreTranslationGenerator = cgaCentreVector.gp(cga.ni).smul(0.5);
console.log("centreTranslationGenerator grade =>", centreTranslationGenerator.grade());
// Translators: these are even spinors generated with exp(generator)
const cgaTranslateFromCentre = centreTranslationGenerator.exp(1);
const cgaTranslateToCentre = centreTranslationGenerator.smul(-1).exp(1);
console.log("cgaTranslateFromCentre grade =>", cgaTranslateFromCentre.grade());
console.log("cgaTranslateToCentre grade =>", cgaTranslateToCentre.grade());

// Plane containing the circle (IPNS). Use the math ops to derive the rotation bivector
// directly, then build a line through the circle centre in that direction.
// Plane containing the circle (IPNS): P1 ∧ P2 ∧ P3 ∧ n∞. This is grade-4 (OPNS).
const c1PlaneIpns = c1.op(cga.ni).dual();
console.log("c1PlaneIpns grade =>", c1PlaneIpns.grade());

// Euclidean bivector that generates rotation in the circle's plane:
//  - unDual() turns the IPNS plane to OPNS dual form
//  - selectGrade(2) restricts to the Euclidean bivector (grade-2)
//  - normalize() makes it a unit generator for clean rotor exponents
const c1RotationPlane = c1PlaneIpns.unDual().selectGrade(2).normalize();
console.log("c1RotationPlane grade =>", c1RotationPlane.grade());
c1RotationPlane.strLog("c1RotationPlane (bivector generator - grade 2)");

// Build the axis line by creating a second point offset along the plane's normal
// The bivector components (e_23,e_31,e_12) correspond to the Euclidean normal.
const axisOffset = {
  x: c1RotationPlane.basisSVal("e_23")
  , y: c1RotationPlane.basisSVal("e_31")
  , z: c1RotationPlane.basisSVal("e_12")
,};
// Build a second point offset by the Euclidean normal to make the axis line:
// axisPoint: a conformal point offset from the centre using the plane normal
const axisPoint = point(
  c1CentreCoords.x + axisOffset.x
  , c1CentreCoords.y + axisOffset.y
  , c1CentreCoords.z + axisOffset.z
,);
const axisLine = c1Centre.join(axisPoint);
console.log("axisPoint grade =>", axisPoint.grade());
axisLine.strLog("axisLine (through circle centre perpendicular to circle)");
console.log("axisLine grade =>", axisLine.grade());
// NOTE: `axisLine` is the canonical line (grade-3). We keep the older name out
// of the repo to avoid unused-variable warnings.

let cgaRotorPhase = 0;
const CGA_ROTATION_SPEED = Math.PI / 400;
setTimeout(() => {
  updateCgaRotor(1 / 60); // warm up
}, 2000);
let step = 0;
function updateCgaRotor(deltaSeconds = 0) {
  // allow either accumulated delta-time or wall-clock control of the animation phase
  if (deltaSeconds) {
    cgaRotorPhase += deltaSeconds * CGA_ROTATION_SPEED;
  } else {
    const totalElapsedSeconds = (Date.now() - start) / 1000;
    cgaRotorPhase = totalElapsedSeconds * CGA_ROTATION_SPEED;
  }

  // Rotor around the circle's plane, translated so the center stays fixed
  const rotor = c1RotationPlane.smul(cgaRotorPhase).exp(1);
  const combinedRotor = cgaTranslateFromCentre
    .gp(rotor.gp(cgaTranslateToCentre))
    .normalize();
  const combinedRotorReverse = combinedRotor.reverse();

  const rotatePoint = function (pt, color) {
    return combinedRotor
      .gp(pt)
      .gp(combinedRotorReverse)
      .render({ color, size: 0.12 });
  };

  const rotatedPt1 = rotatePoint(pt1, cRed);
  rotatePoint(pt2, cGreen);
  rotatePoint(pt3, cBlue);

  if (step++ < 4) {
    // Grades verification for debugging:
    //  - rotor: should be an even multivector (rotor) - possibly mixed grade (0/2)
    //  - combinedRotor: the translator-rotor-translator product should be normalized rotors
    console.log("centreTranslationGenerator grade =>", centreTranslationGenerator.grade());
    console.log("cgaTranslateFromCentre grade =>", cgaTranslateFromCentre.grade());
    console.log("cgaTranslateToCentre grade =>", cgaTranslateToCentre.grade());
    console.log("rotor (generator exp) grade =>", rotor.grade());
    console.log("combinedRotor grade =>", combinedRotor.grade());
    combinedRotor.strLog("combinedRotor");
    rotatedPt1.strLog("rotated pt1");
  }
  // cgaRotorPhase += deltaSeconds * CGA_ROTATION_SPEED;
  // const rotor = cgaRotationMotor.evaluate(
  //   cgaRotorPhase * 0.5,
  //   cgaReusableRotor,
  // );

  // build rotor from generator
  // const rotor = c1.smul(cgaRotorPhase).exp(1);
  // rotor.strLog("rotor");
  // const combinedRotor = cgaTranslateFromCentre
  //   .gp(rotor.gp(cgaTranslateToCentre))
  //   .normalize();
  // for (let i = 0; i < cgaRotatingPoints.length; ++i) {
  //   // apply rotor to each point
  //   // let pt = cgaRotatingPoints[i];
  //   // let updatedPt = rotor.gp(pt).gp(rotor.reverse());
  //   // cgaRotatingPoints[i] = updatedPt;

  //   // apply rotor about circle centre
  //   cgaReferencePoints[i].move(rotor, cgaRotatingPoints[i]);
  //   cgaRotatingPoints[i].render();
  // }

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
,];
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

/**************************
 **	animate
 **************************/
var start = Date.now();
var lastFrameTime = start;

function animate() {
  requestAnimationFrame(animate);
  var now = Date.now();
  var deltaSeconds = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  updateCgaRotor(deltaSeconds);

  cemoCam.renderer.render(scene, camera);
}
animate();
