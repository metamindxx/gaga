// scene, camera
const scene = new THREE.Scene();
var cemoCam = new CemoVanillaCamera('points_div')
// var cemoCam = new CemoOrthCamera('points_div')
cemoCam.init(scene)
var camera = cemoCam.camera // main camera
//camera.rotation.x += Math.PI/2
//camera.up.set(0,0,1)
camera.position.set(3, 2, 4)

// Lights
scene.add(new THREE.AmbientLight(0x444444));
var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(10, 20, 50);
//light.position.set(0, 100, 0);
scene.add(light);

// axes
var mtrlRed   = new THREE.LineBasicMaterial( { color: 0xff0000 } );
var mtrlGreen = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
var mtrlBlue  = new THREE.LineBasicMaterial( { color: 0x0000ff } );
cemo.addVectorToScene([[0, 0, 0],[1, 0, 0]], mtrlRed, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 1, 0]], mtrlGreen, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 0, 1]], mtrlBlue, scene)

var sta = staBasis(scene)
var MV = bs.multiVector
var Iinv = bs.multiVector('1e_1230') // I defined as e_0123
var I = Iinv.smul(-1)
var g0 = MV('1e_0')

const loader = new THREE.TextureLoader();
var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("/textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})

var w = 2, c = 1
var woc = w/c

var B = MV('.5e_10').strLog('B : ')
var BI = B.gp(I).strLog('BI: ')
var E = MV('.5e_20').strLog('E: ')

var fGlobal = E.add(BI).strLog('f: ')


/**************************
**	animate
**************************/
var animationCounter = 0
var start = Date.now()


var range = 2.01
,	step = .1
,	t = 0
,	point
,	points = []

var expI4Study = function (alpha) {
	var bits = []
	bits.push(Math.cos(alpha) + 'e_')
	var sa = Math.sin(alpha)
	if (Math.sign(sa) > 0) {
		bits.push(' + ')
	}
	return MV(bits.join(' ') + sa + 'e_1230')
}

// POINT def
var newPoint = function(pos) {
	var p = {
			isA: 'point'
		,	opt: {color: 0xff00ff}}
	
	p.calcF = function () {
		var zVal = this.pos.bVal('e_30')
		var exponent1 = zVal*woc - w*t
		var f1 = fGlobal.gp( expI4Study(exponent1) )
		var exponent2 = -exponent1
		var f2 = fGlobal.gp( expI4Study(exponent2) ).smul(.7)

		//var exponent =  - w*t
//		this.f = fGlobal.gp( expI4Study(exponent) )
		this.f = f1.add(f2)
		return this
	}

	p.render = function() {
		var pos = this.pos // position
		var posXYZ = {x: pos.bVal('e_10'), y: pos.bVal('e_20'), z: pos.bVal('e_30') }
		//this.f.strLog('render f: ')
		//console.log('is: ' + this.isA)
		var field = this.f

		// E field
		var E_XYZ = {x: field.bVal('e_10'), y: field.bVal('e_20'), z: field.bVal('e_30') }
		if (!this.eVec) {
			this.eVec = cemo.addVectorToScene([[posXYZ.x, posXYZ.y, posXYZ.z],[posXYZ.x + E_XYZ.x, posXYZ.y + E_XYZ.y, posXYZ.z + E_XYZ.z]], new THREE.MeshBasicMaterial( { color: this.opt.color }), scene, this)
		} else {
//			this.eVec.position.x = posXYZ.x
//			this.eVec.position.y = posXYZ.y
//			this.eVec.position.z = posXYZ.z
			this.eVec.ceSetEndFromRoot([posXYZ.x + E_XYZ.x, posXYZ.y + E_XYZ.y, posXYZ.z + E_XYZ.z])
		}

		// B field
		var B_XYZ = {x: -field.bVal('e_23'), y: field.bVal('e_13'), z: -field.bVal('e_12') }
		var bSize = .2 *  Math.pow(B_XYZ.x*B_XYZ.x + B_XYZ.y*B_XYZ.y + B_XYZ.z*B_XYZ.z, .5)
		if (!this.bBivec) {
			// addBivectorToScene: function (position, direction, scene, options, clickParent) {
			this.bBivec = cemo.addBivectorToScene([posXYZ.x, posXYZ.y, posXYZ.z],[B_XYZ.x, B_XYZ.y, B_XYZ.z], bSize, scene, { color: this.opt.color }, this)
		} else {
//			this.eVec.position.x = posXYZ.x
//			this.eVec.position.y = posXYZ.y
//			this.eVec.position.z = posXYZ.z
			this.bBivec.ceSetDirection([B_XYZ.x, B_XYZ.y, B_XYZ.z], bSize)
		}

		return this
	}

	// create the position mv from array. eg MV("1e_1 + 2e_2") from pos=[1,2,0]
	var bits = []
	for (var i=0; i<3; ++i) {
		if (pos[i]) {
			if (pos[i] > 0) {
				bits.push(' + ' + pos[i].toFixed(4) + 'e_' + (i+1) + '0')
			} else {
				bits.push(pos[i].toFixed(4) + 'e_' + (i+1) + '0')
			}
		}
	}
	p.pos = MV(bits.join(' '))
	
	p.calcF()

	return p
}
// End POINT def

// create some points
for (var i=-range; i<=range; i+=step) {
	point = newPoint([-0.5,-0.5,i]) // .render()
	points.push(point)
}

// render / animate
//var rendered = false
function animate() {
	requestAnimationFrame( animate )
	var runTime = (Date.now() - start)/1000
	animationCounter = runTime
	if (runTime < 100) {
//	if (!rendered) {
//		rendered = true
		t=animationCounter
		for (var i=0; i<points.length; ++i) {
			point = points[i]
			point.calcF().render()
			//point.f.strLog('field at point: ')
		}		
	}
	cemoCam.renderer.render( scene, camera )
}
animate()