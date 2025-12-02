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

/* stuff */
var p1 = point(-2, 0, 1).render({ color: cRed }),
  p2 = point(1, -1, 0.5).render({ color: cBlue }),
  //,	p3 = point(1,1,2).render({color: cGreen})
  p3 = point(1, 1, 2).smul(2).render({ color: cGreen }),
  p4 = point(0, 2, -0).render({ color: cPink }),
  c1 = p1.op(p2.op(p3)).render(),
  // ignore unused s1 and s2 parameters for now
  // eslint-disable-next-line no-unused-vars
  s1 = c1.op(p4).render(),
  // eslint-disable-next-line no-unused-vars
  s2 = c1.op(cga.ni).render();

function buildCircleData(circleMV) {
  var Ic = circleMV.op(cga.ni);
  var IcSize = Math.pow(Math.abs(Ic.sq()), 0.5);
  if (!IcSize) {
    return null;
  }
  Ic = Ic.smul(1 / IcSize);
  var circDual = circleMV.gp(Ic);
  var cdDotNi = circDual.scalarProduct(cga.ni);
  if (!cdDotNi) {
    return null;
  }
  circDual = circDual.smul(-1 / cdDotNi);
  var centreMV = circDual.gp(circDual.gp(cga.ni).smul(0.5).sadd(1));
  var centreXYZ = cga.pointXYZ(centreMV);
  var radius = Math.pow(circDual.sq(), 0.5);
  var Icd = cga.I5.gp(Ic);
  var nx = Icd.bVal("e_1");
  var ny = Icd.bVal("e_2");
  var nz = Icd.bVal("e_3");
  var normal = new THREE.Vector3(nx, ny, nz);
  if (normal.lengthSq() === 0) {
    normal.set(0, 0, 1);
  }
  normal.normalize();
  return {
    centreMV: centreMV,
    centreVec: new THREE.Vector3(centreXYZ.x, centreXYZ.y, centreXYZ.z),
    radius: radius,
    normal: normal,
  };
}

var circleData = buildCircleData(c1);
var tangent1 = new THREE.Vector3(1, 0, 0);
var tangent2 = new THREE.Vector3(0, 1, 0);
if (circleData) {
  if (Math.abs(tangent1.dot(circleData.normal)) > 0.9) {
    tangent1.set(0, 1, 0);
  }
  tangent1
    .sub(
      circleData.normal.clone().multiplyScalar(tangent1.dot(circleData.normal)),
    )
    .normalize();
  tangent2 = new THREE.Vector3()
    .crossVectors(circleData.normal, tangent1)
    .normalize();
}

function phaseForPoint(mv) {
  if (!circleData || !circleData.radius) {
    return 0;
  }
  var xyz = cga.pointXYZ(mv);
  var rel = new THREE.Vector3(xyz.x, xyz.y, xyz.z).sub(circleData.centreVec);
  var cosTheta = rel.dot(tangent1) / circleData.radius;
  var sinTheta = rel.dot(tangent2) / circleData.radius;
  return Math.atan2(sinTheta, cosTheta);
}

var rotatingPoints = circleData
  ? [
      { mv: p1, phase: phaseForPoint(p1) },
      { mv: p2, phase: phaseForPoint(p2) },
      { mv: p3, phase: phaseForPoint(p3) },
    ]
  : [];

var rotationSpeed = Math.PI / 8;

function updateRotatingPoints(deltaSeconds) {
  if (!circleData || !circleData.radius) {
    return;
  }
  for (var i = 0; i < rotatingPoints.length; ++i) {
    var rp = rotatingPoints[i];
    rp.phase += deltaSeconds * rotationSpeed;
    var pos = circleData.centreVec
      .clone()
      .add(
        tangent1.clone().multiplyScalar(circleData.radius * Math.cos(rp.phase)),
      )
      .add(
        tangent2.clone().multiplyScalar(circleData.radius * Math.sin(rp.phase)),
      );
    var updated = point(pos.x, pos.y, pos.z);
    rp.mv.updateCopy(updated);
    rp.mv.render();
  }
}

// ================
// PGA demo objects
var pga = createPgaBasis(scene, { basisSet: pgaBs, cemo });
const PGA_OFFSET = new THREE.Vector3(0, 4, 0);
const pointA = pga
  .pt(PGA_OFFSET.x + 0.4, PGA_OFFSET.y + 1.1, PGA_OFFSET.z - 0.2)
  .render({ color: 0xf5a623, size: 0.14 });
const pointB = pga
  .pt(PGA_OFFSET.x - 0.8, PGA_OFFSET.y - 0.4, PGA_OFFSET.z + 0.9)
  .render({ color: 0x14f0ff, size: 0.14 });
const pointC = pga
  .pt(PGA_OFFSET.x + 0.6, PGA_OFFSET.y + 0.2, PGA_OFFSET.z + 1.4)
  .render({ color: 0x88ff88, size: 0.14 });

const lineAB = pointA.join(pointB);
lineAB.render({
  color: 0xff00ff,
  length: 5,
});

const planeABC = lineAB.join(pointC);
planeABC.strLog("planeABC");
planeABC.render({ color: 0x3366cc, size: 7 });

const polylinePoints = [
  pga.pt(PGA_OFFSET.x + 0, PGA_OFFSET.y + 0, PGA_OFFSET.z + 0),
  pga.pt(PGA_OFFSET.x - 1, PGA_OFFSET.y + 0, PGA_OFFSET.z + 1),
  pga.pt(PGA_OFFSET.x + 0, PGA_OFFSET.y + 1, PGA_OFFSET.z + 2),
  pga.pt(PGA_OFFSET.x + 0, PGA_OFFSET.y + 0, PGA_OFFSET.z + 3),
];
pga.renderMV(polylinePoints, { color: 0xffaa00 });

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
  updateRotatingPoints(deltaSeconds);

  cemoCam.renderer.render(scene, camera);
}
animate();
