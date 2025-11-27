function CemoVanillaCamera(divId) {
  cemoCamera = {
    init: function (scene) {
      this.scene = scene;

      //RENDERER
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setClearColor(0xffffff);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.rndr_w = window.innerWidth;

      if (divId) {
        document.getElementById(divId).appendChild(this.renderer.domElement); //add to the HTML
      } else {
        document.body.appendChild(this.renderer.domElement); //add to the HTML
      }

      this.camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        100,
      );
      this.camera.position.set(0, 10, 10);

      //Controls
      this.controls = new THREE.OrbitControls(
        this.camera,
        this.renderer.domElement,
      ); //controls update in the render loop, rotate and pan camera with mouse, mouse control doesn't leak into menus.
    },

    setPosition: function (x, y, z) {
      this.camera.position.set(x, y, z);
      this.controls.update();
    },

    render: function () {
      this.controls.update();
      this.renderer.render(scene, this.camera);
    },
  };

  return cemoCamera;
}
