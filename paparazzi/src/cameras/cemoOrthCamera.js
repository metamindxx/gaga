import * as THREE from "three";
import { OrbitControls } from "../controls/OrbitControls.js";

function resolveContainer(target, ownerDocument, fallback) {
  if (target && target.nodeType === 1) {
    return target;
  }

  if (typeof target === "string" && ownerDocument) {
    return ownerDocument.getElementById(target);
  }

  return fallback || null;
}

export function createCemoOrthCamera(divId, options = {}) {
  const ownerDocument =
    (options.container && options.container.ownerDocument) ||
    options.document ||
    (typeof document !== "undefined" ? document : undefined);

  const defaultView =
    options.window ||
    (ownerDocument && ownerDocument.defaultView) ||
    (typeof window !== "undefined" ? window : undefined);

  const container =
    options.container ||
    resolveContainer(
      divId,
      ownerDocument,
      ownerDocument ? ownerDocument.body : null,
    );

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

          return { width: 800, height: 600 };
        };

  const pixelRatio =
    typeof options.pixelRatio === "number"
      ? options.pixelRatio
      : defaultView && defaultView.devicePixelRatio
        ? defaultView.devicePixelRatio
        : 1;

  const eventTarget = options.eventTarget || defaultView || globalThis;

  const cemoCamera = {
    init: function (scene) {
      this.scene = scene;

      const size = getSize();
      const width = Math.max(
        1,
        size && typeof size.width === "number" ? size.width : 1,
      );
      const height = Math.max(
        1,
        size && typeof size.height === "number" ? size.height : 1,
      );

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setClearColor(0xffffff);
      this.renderer.setPixelRatio(pixelRatio);
      this.renderer.setSize(width, height);
      this.rndr_w = width;

      if (container && container.appendChild) {
        container.appendChild(this.renderer.domElement);
      }

      const wSpan = 6;
      const vOffset = 0.25;
      const hOffset = 1;
      const hSpan = wSpan * (height / width || 1);

      this.camera = new THREE.OrthographicCamera(
        hOffset + wSpan / -2,
        hOffset + wSpan / 2,
        vOffset + hSpan / 2,
        vOffset + hSpan / -2,
        0.1,
        100,
      );

      //Controls
      this.controls = new OrbitControls(this.camera, this.renderer.domElement, {
        document: ownerDocument,
        eventTarget,
      });
    },

    setPosition: function (x, y, z) {
      this.camera.position.set(x, y, z);
      this.controls.update();
    },

    render: function () {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    },
  };

  return cemoCamera;
}
