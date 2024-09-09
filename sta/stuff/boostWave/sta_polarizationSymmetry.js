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
var oort = Math.pow(2, -1/2)

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
var newPoint = function(pos, color, fField) {
	if (color == null) {color = 0xff00ff}
	var p = {
		isA: 'point'
	,	opt: {color: color}}

	if (fField != null) {
		this.field = fField
	}

	p.render = function() {
		var pos = this.pos // position
		var posXYZ = {x: pos.bVal('e_10'), y: pos.bVal('e_20'), z: pos.bVal('e_30') }
		//this.f.strLog('render f: ')
		//console.log('is: ' + this.isA)
		var field = this.field()

		// E field
		var E_XYZ = {x: field.bVal('e_10'), y: field.bVal('e_20'), z: field.bVal('e_30') }
		if (!this.eVec) {
			this.eVec = cemo.addVectorToScene([[posXYZ.x, posXYZ.y, posXYZ.z],[posXYZ.x + E_XYZ.x, posXYZ.y + E_XYZ.y, posXYZ.z + E_XYZ.z]], new THREE.MeshBasicMaterial( { color: this.opt.color }), scene, this)
		} else {
			this.eVec.ceSetEndFromRoot([posXYZ.x + E_XYZ.x, posXYZ.y + E_XYZ.y, posXYZ.z + E_XYZ.z])
		}

		// B field
		var B_XYZ = {x: -field.bVal('e_23'), y: field.bVal('e_13'), z: -field.bVal('e_12') }
		var bSize = .2 *  Math.pow(B_XYZ.x*B_XYZ.x + B_XYZ.y*B_XYZ.y + B_XYZ.z*B_XYZ.z, .5)
		if (!this.bBivec) {
			// addBivectorToScene: function (position, direction, scene, options, clickParent) {
			this.bBivec = cemo.addBivectorToScene([posXYZ.x, posXYZ.y, posXYZ.z],[B_XYZ.x, B_XYZ.y, B_XYZ.z], bSize, scene, { color: this.opt.color }, this)
		} else {
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
	
	p.calcF = function () {
		var zVal = this.pos.bVal('e_30')
		var phase = Math.PI/2
		var theta = zVal*woc - w*t
		var tPp = theta + phase
		var tMp = theta - phase
		this.fR_plus = fGlobal.gp( expI4Study(-tPp) )
		this.fL_plus = fGlobal.gp( expI4Study( tPp) )
		this.fV_plus = this.fR_plus.smul(+oort).add( this.fL_plus.smul(+oort) )
		this.fH_plus = this.fR_plus.smul(+oort).add( this.fL_plus.smul(-oort) )

		this.fR_minus = fGlobal.gp( expI4Study(-tMp) )
		this.fL_minus = fGlobal.gp( expI4Study( tMp) )
		this.fV_minus = this.fR_minus.smul(+oort).add( this.fL_minus.smul(+oort) )
		this.fH_minus = this.fR_minus.smul(+oort).add( this.fL_minus.smul(-oort) )

		return this
	}
	p.calcF()

	return p
}
// End POINT def

// create some points
var range = 2.01
,	step = .1
,	t = 0
,	point
,	points = []
var d, dStart = -1, dDelta = 2/3
//point = newPoint([0,0,1]) // .render()
//points.push(point)
for (var i=-range; i<=range; i+=step) {
	d = dStart
	point = newPoint([d,1,i], cRed) // .render()
	point.field = function() { return this.fR_plus }
	points.push(point)

	d += dDelta
	point = newPoint([d,1,i], cGreen) // .render()
	point.field = function() { return this.fL_plus }
	points.push(point)

	d += dDelta
	point = newPoint([d,1,i], cPink) // .render()
	point.field = function() { return this.fV_plus }
	points.push(point)

	d += dDelta
	point = newPoint([d,1,i], cYellow) // .render()
	point.field = function() { return this.fH_plus }
	points.push(point)


	d = dStart
	point = newPoint([d,-1,i], cBlue) // .render()
	point.field = function() { return this.fR_minus }
	points.push(point)

	d += dDelta
	point = newPoint([d,-1,i], cCyan) // .render()
	point.field = function() { return this.fL_minus }
	points.push(point)

	d += dDelta
	point = newPoint([d,-1,i], cPink) // .render()
	point.field = function() { return this.fV_minus }
	points.push(point)

	d += dDelta
	point = newPoint([d,-1,i], cYellow) // .render()
	point.field = function() { return this.fH_minus }
	points.push(point)

	/*
	point = newPoint([d,-d,i]) // .render()
	points.push(point)
	point = newPoint([-d,d,i]) // .render()
	points.push(point)
	point = newPoint([-d,-d,i]) // .render()
	points.push(point)
	*/
}

var bracket = function(A, B) {
	return A.gp(B).add( B.gp(A).smul(-1) ).smul(.5)
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
			point.calcF()
			if (i%2 == 0) {
				point.f = point.fV
			} else {
				point.f = point.fH
			}
			/*
			*/

			point.render()
			//point.f.strLog('field at point: ')
		}		
	}
	cemoCam.renderer.render( scene, camera )
}
animate()