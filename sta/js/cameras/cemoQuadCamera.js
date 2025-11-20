function CemoQuadCamera() {
	cemoCamera = {
		init: function(scene) {
			/* add this to the dom
				<table>
					<tr>
						<td>
							<canvas id="canvas_01"></canvas>
						</td>
						<td>
							<canvas id="canvas_02"></canvas>
							<canvas id="canvas_03"></canvas>
							<canvas id="canvas_04"></canvas>
						</td>
					</tr>
				</table>
			*/

			var domNode = document.createElement("div")
			domNode.innerHTML = '<table><tr><td><canvas id="canvas_01"></canvas></td><td><canvas id="canvas_02"></canvas><canvas id="canvas_03"></canvas><canvas id="canvas_04"></canvas></td></tr></table>'
			document.body.appendChild(domNode)

			while (!document.getElementById('canvas_01')) {
				// wait for the elements to appear
				var a = 0
			}
			this.canvas_01 = document.getElementById('canvas_01');
			this.canvas_02 = document.getElementById('canvas_02');
			this.canvas_03 = document.getElementById('canvas_03');
			this.canvas_04 = document.getElementById('canvas_04');

			this.scene = scene

			//RENDERER
			var scaleWin = .45
			var splitLeftRight = .7
			var splitMargin = 50
			var rightVertRenderers = 3
			var wiw = window.innerWidth
			var wih = window.innerHeight
			var rndr_w, rndr_h
			console.log('wiw: ' + wiw)
			console.log('wih: ' + wih)

			//renderer
			var renderer = new THREE.WebGLRenderer ({canvas: canvas_01, antialias: true});
			renderer.setClearColor(0x000000);
			rndr_w = wiw * splitLeftRight
			rndr_h = wih
			var mainRndrScreenRatio = rndr_w / rndr_h
			this.rndr_w = rndr_w
			renderer.setPixelRatio(mainRndrScreenRatio);
			renderer.setSize(rndr_w, rndr_h);
			this.renderer = renderer

			var rndr_w = wiw * (1-splitLeftRight) - splitMargin
			var rndr_h = wih / rightVertRenderers // - splitMargin
			var orthoRndrScreenRatio = rndr_w / rndr_h

			//rndr_02
			var rndr_02 = new THREE.WebGLRenderer ({canvas: canvas_02, antialias: true});
			rndr_02.setClearColor(0x000000);
			rndr_02.setPixelRatio(orthoRndrScreenRatio);
			rndr_02.setSize(rndr_w, rndr_h);
			this.rndr_02 = rndr_02

			// rndr_03
			var rndr_03 = new THREE.WebGLRenderer ({canvas: canvas_03, antialias: true});
			rndr_03.setClearColor(0x000000);
			rndr_03.setPixelRatio(orthoRndrScreenRatio);
			rndr_03.setSize(rndr_w, rndr_h);
			this.rndr_03 = rndr_03

			// rndr_04
			var rndr_04 = new THREE.WebGLRenderer ({canvas: canvas_04, antialias: true});
			rndr_04.setClearColor(0x000000);
			rndr_04.setPixelRatio(orthoRndrScreenRatio);
			rndr_04.setSize(rndr_w, rndr_h);
			this.rndr_04 = rndr_04

			this.camera = new THREE.PerspectiveCamera(60, mainRndrScreenRatio, 1, 1000 );
			this.camera.position.set(0, 10, 10);

			var wSpan = 6
			var camOrth_01 = new THREE.OrthographicCamera(-wSpan, wSpan, wSpan / orthoRndrScreenRatio, -wSpan / orthoRndrScreenRatio, 0.1, 10000);
			camOrth_01.position.set(0, 0, 20 );
			camOrth_01.lookAt( new THREE.Vector3(0,0,0) )
			this.camOrth_01 = camOrth_01

			var camOrth_02 = new THREE.OrthographicCamera(-wSpan, wSpan, wSpan / orthoRndrScreenRatio, -wSpan / orthoRndrScreenRatio, 0.1, 10000);
			camOrth_02.position.set(0, 20, 0 );
			camOrth_02.lookAt( new THREE.Vector3(0,0,0) )
			this.camOrth_02 = camOrth_02

			var camOrth_03 = new THREE.OrthographicCamera(-wSpan, wSpan, wSpan / orthoRndrScreenRatio, -wSpan / orthoRndrScreenRatio, 0.1, 10000);
			camOrth_03.position.set(20, 0, 0 );
			camOrth_03.lookAt( new THREE.Vector3(0,0,0) )
			this.camOrth_03 = camOrth_03


			//Controls
			this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement); //controls update in the render loop, rotate and pan camera with mouse, mouse control doesn't leak into menus.

		}

	,	render: function() {
			this.controls.update();
			this.renderer.render(this.scene, this.camera);
			this.rndr_02.render(this.scene, this.camOrth_01);
			this.rndr_03.render(this.scene, this.camOrth_02);
			this.rndr_04.render(this.scene, this.camOrth_03);

		}
	}

	return cemoCamera
}