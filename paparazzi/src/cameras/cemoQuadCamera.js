import * as THREE from "three";
import { OrbitControls } from "../controls/OrbitControls.js";

export function createCemoQuadCamera(options = {}) {
  const ownerDocument =
    options.document ||
    (typeof document !== "undefined" ? document : undefined);

  if (!ownerDocument) {
    throw new Error("createCemoQuadCamera requires a document reference");
  }

  const defaultView =
    options.window ||
    (ownerDocument && ownerDocument.defaultView) ||
    (typeof window !== "undefined" ? window : undefined);

  const attachmentTarget =
    options.container || ownerDocument.body || ownerDocument.documentElement;

  const getSize =
    typeof options.getSize === "function"
      ? options.getSize
      : () => {
          if (
            options.size &&
            typeof options.size.width === "number" &&
            typeof options.size.height === "number"
          ) {
            return options.size;
          }

          if (defaultView) {
            return {
              width: defaultView.innerWidth,
              height: defaultView.innerHeight,
            };
          }

          return { width: 1200, height: 800 };
        };

  const eventTarget = options.eventTarget || defaultView || globalThis;

  const cemoCamera = {
    init: function (scene) {
      this.scene = scene;

      const size = getSize();
      const wiw = Math.max(
        1,
        size && typeof size.width === "number" ? size.width : 1,
      );
      const wih = Math.max(
        1,
        size && typeof size.height === "number" ? size.height : 1,
      );

      const layoutHost = ownerDocument.createElement("div");
      layoutHost.innerHTML =
        '<table><tr><td><canvas id="canvas_01"></canvas></td><td><canvas id="canvas_02"></canvas><canvas id="canvas_03"></canvas><canvas id="canvas_04"></canvas></td></tr></table>';

      if (attachmentTarget && attachmentTarget.appendChild) {
        attachmentTarget.appendChild(layoutHost);
      }

      this.canvas_01 = ownerDocument.getElementById("canvas_01");
      this.canvas_02 = ownerDocument.getElementById("canvas_02");
      this.canvas_03 = ownerDocument.getElementById("canvas_03");
      this.canvas_04 = ownerDocument.getElementById("canvas_04");

      const validateCanvas = (canvas, id) => {
        if (!canvas) {
          throw new Error(`createCemoQuadCamera could not find ${id}`);
        }
        return canvas;
      };

      const canvasMain = validateCanvas(this.canvas_01, "canvas_01");
      const canvas02 = validateCanvas(this.canvas_02, "canvas_02");
      const canvas03 = validateCanvas(this.canvas_03, "canvas_03");
      const canvas04 = validateCanvas(this.canvas_04, "canvas_04");

      const splitLeftRight = 0.7;
      const splitMargin = 50;
      const rightVertRenderers = 3;

      let rndr_w = wiw * splitLeftRight;
      let rndr_h = wih;
      const mainRndrScreenRatio = rndr_w / rndr_h;
      this.rndr_w = rndr_w;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasMain,
        antialias: true,
      });
      renderer.setClearColor(0x000000);
      renderer.setPixelRatio(mainRndrScreenRatio);
      renderer.setSize(rndr_w, rndr_h);
      this.renderer = renderer;

      rndr_w = wiw * (1 - splitLeftRight) - splitMargin;
      rndr_h = wih / rightVertRenderers;
      const orthoRndrScreenRatio = rndr_w / rndr_h;

      const rndr_02 = new THREE.WebGLRenderer({
        canvas: canvas02,
        antialias: true,
      });
      rndr_02.setClearColor(0x000000);
      rndr_02.setPixelRatio(orthoRndrScreenRatio);
      rndr_02.setSize(rndr_w, rndr_h);
      this.rndr_02 = rndr_02;

      const rndr_03 = new THREE.WebGLRenderer({
        canvas: canvas03,
        antialias: true,
      });
      rndr_03.setClearColor(0x000000);
      rndr_03.setPixelRatio(orthoRndrScreenRatio);
      rndr_03.setSize(rndr_w, rndr_h);
      this.rndr_03 = rndr_03;

      const rndr_04 = new THREE.WebGLRenderer({
        canvas: canvas04,
        antialias: true,
      });
      rndr_04.setClearColor(0x000000);
      rndr_04.setPixelRatio(orthoRndrScreenRatio);
      rndr_04.setSize(rndr_w, rndr_h);
      this.rndr_04 = rndr_04;

      this.camera = new THREE.PerspectiveCamera(
        60,
        mainRndrScreenRatio,
        1,
        1000,
      );
      this.camera.position.set(0, 10, 10);

      const wSpan = 6;
      const camOrth_01 = new THREE.OrthographicCamera(
        -wSpan,
        wSpan,
        wSpan / orthoRndrScreenRatio,
        -wSpan / orthoRndrScreenRatio,
        0.1,
        10000,
      );
      camOrth_01.position.set(0, 0, 20);
      camOrth_01.lookAt(new THREE.Vector3(0, 0, 0));
      this.camOrth_01 = camOrth_01;

      const camOrth_02 = new THREE.OrthographicCamera(
        -wSpan,
        wSpan,
        wSpan / orthoRndrScreenRatio,
        -wSpan / orthoRndrScreenRatio,
        0.1,
        10000,
      );
      camOrth_02.position.set(0, 20, 0);
      camOrth_02.lookAt(new THREE.Vector3(0, 0, 0));
      this.camOrth_02 = camOrth_02;

      const camOrth_03 = new THREE.OrthographicCamera(
        -wSpan,
        wSpan,
        wSpan / orthoRndrScreenRatio,
        -wSpan / orthoRndrScreenRatio,
        0.1,
        10000,
      );
      camOrth_03.position.set(20, 0, 0);
      camOrth_03.lookAt(new THREE.Vector3(0, 0, 0));
      this.camOrth_03 = camOrth_03;

      this.controls = new OrbitControls(this.camera, this.renderer.domElement, {
        document: ownerDocument,
        eventTarget,
      });
    },

    render: function () {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.rndr_02.render(this.scene, this.camOrth_01);
      this.rndr_03.render(this.scene, this.camOrth_02);
      this.rndr_04.render(this.scene, this.camOrth_03);
    },
  };

  return cemoCamera;
}
