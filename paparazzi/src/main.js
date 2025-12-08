import * as THREE from "three";
import { createCemoVanillaCamera } from "./cameras/cemoVanillaCamera.js";
import { createCemoHelpers } from "./dot_js/cemo_01.js";

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

import { slide20Forward3dExample } from "./example/slide20SerialRobotForward3d.js";
import { slide22ForwardCGAExample } from "./example/slide22ForwardCGA.js";

const slide20 = slide20Forward3dExample(scene, cemo);
const slide22 = slide22ForwardCGAExample(scene, cemo);

function runAnimationLoop() {
  requestAnimationFrame(runAnimationLoop);
  slide20.animateRobot(performance.now());
  slide22.animateRobot(performance.now());
  cemoCam.renderer.render(scene, camera);
}
runAnimationLoop();
