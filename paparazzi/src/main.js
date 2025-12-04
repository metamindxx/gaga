import * as THREE from "three";
import { createCemoVanillaCamera } from "./cameras/cemoVanillaCamera.js";
// import { createCemoOrthCamera } from "./cameras/cemoOrthCamera.js";
// import { createCemoQuadCamera } from "./cameras/cemoQuadCamera.js";
import { createCgaBasis } from "./cgaBasis.js";
import { createPgaBasis } from "./pgaBasis.js";
import { createBasisSet } from "./basisSet.js";
import {
  createCemoHelpers,
  cRed,
  cBlue,
  cGreen,
  cPink,
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
    [0, 0, 0],
    [1, 0, 0],
  ],
  mtrlRed,
  scene,
);
cemo.addVectorToScene(
  [
    [0, 0, 0],
    [0, 1, 0],
  ],
  mtrlGreen,
  scene,
);
cemo.addVectorToScene(
  [
    [0, 0, 0],
    [0, 0, 1],
  ],
  mtrlBlue,
  scene,
);

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
const c1 = pt1.op(pt2.op(pt3));
const s1 = c1.op(pt4);
const s2 = c1.op(cga.ni);

// ok, I have 4 points, a circle and 2 spheres.
// now to find the line through the circle centre perpendicular to the circle
// and use that to build a rotor to spin the circle about its centre

// build circle centre
const c1Centre = c1.dual()
  .gp(cga.ni)
  .smul(0.5)
  .sadd(1)
  .dual();
c1Centre.strLog("c1Centre");

// build circle centre normal
const c1Normal = c1.dual().gp(cga.ni).dual();
c1Normal.strLog("c1Normal");

let cgaRotorPhase = 0;
const CGA_ROTATION_SPEED = Math.PI/4000;
// let start = Date.now();
let step = 0;
function updateCgaRotor(_deltaSeconds) {
  let totalElapsedSeconds = (Date.now() - start) / 1000;
  cgaRotorPhase = totalElapsedSeconds * CGA_ROTATION_SPEED;
  // build rotor for rotation about circle centre normal (without translation)
  const rotor = c1Normal.smul(cgaRotorPhase).exp(1);
  // apply rotor about circle centre
  rotor.gp(pt1).gp(rotor.reverse()).render({ color: cRed, size: 0.12 });
  rotor.gp(pt2).gp(rotor.reverse()).render({ color: cGreen, size: 0.12 });
  rotor.gp(pt3).gp(rotor.reverse()).render({ color: cBlue, size: 0.12 });
  // print first few iterations
  if (step++ < 4) {
    rotor.strLog("rotor");
    pt1.strLog("rotated pt1");
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

const polylinePoints = [
  pga.pt(PGA_OFFSET.x + 0, PGA_OFFSET.y + 0, PGA_OFFSET.z + 0),
  pga.pt(PGA_OFFSET.x - 1, PGA_OFFSET.y + 0, PGA_OFFSET.z + 1),
  pga.pt(PGA_OFFSET.x + 0, PGA_OFFSET.y + 1, PGA_OFFSET.z + 2),
  pga.pt(PGA_OFFSET.x + 0, PGA_OFFSET.y + 0, PGA_OFFSET.z + 3),
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
