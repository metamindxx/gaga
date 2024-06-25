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

var w = 2, c = 4
var woc = w/c

var B = MV('2e_10').strLog('B : ')
var BI = B.gp(I).strLog('BI: ')
var E = MV('2e_20').strLog('E: ')

var fGlobal = E.add(BI).strLog('f: ')


/**************************
**	animate
**************************/
var animationCounter = 0
var start = Date.now()


var range = 2
,	step = .2
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



var newPoint = function(pos) {
	var p = {opt: {color: 0xff00ff}}
	
	p.calcF = function () {
		var zVal = this.pos.bVal('e_30')
		var exponent = zVal*woc - w*t
		this.f = fGlobal.gp( expI4Study(exponent) )
	}

	p.render = function() {
		var pos = this.pos // position
		var posXYZ = {x: pos.bVal('e_10'), y: pos.bVal('e_20'), z: pos.bVal('e_30') }
		var f = this.f
		var E_XYZ = {x: f.bVal('e_10'), y: f.bVal('e_20'), z: f.bVal('e_30') }
		if (!this.eVec) {
			this.eVec = cemo.addVectorToScene([[posXYZ.x, posXYZ.y, posXYZ.z],[posXYZ.x + E_XYZ.x, posXYZ.y + E_XYZ.y, posXYZ.z + E_XYZ.z]], new THREE.MeshBasicMaterial( { color: this.opt.color }), scene, this)
		} else {
//			this.eVec.position.x = posXYZ.x
//			this.eVec.position.y = posXYZ.y
//			this.eVec.position.z = posXYZ.z
			this.eVec.ceSetEndFromRoot([posXYZ.x + E_XYZ.x, posXYZ.y + E_XYZ.y, posXYZ.z + E_XYZ.z])
		}
		return this
	}

	p.pos = MV(pos[2].toFixed(2) + 'e_30')
	p.calcF()

	return p
}



for (var i=-range; i<range; i+=step) {
	point = newPoint([0,0,i]).render()
	points.push(point)
}
/*
	exponent = i*woc - w*t
	f_xt = f.gp(I.exp(exponent))
	zCoord = zCoord.add(zCoordStep).strLog('zCoord: ')
	f_xt = f_xt.add(zCoord).strLog('f_xt: ')
	f_xt.render({as: "xyzFrom4Bivec", color: 0xff00ff})
}
*/
function animate() {
	requestAnimationFrame( animate )
	var runTime = (Date.now() - start)/1000
	animationCounter = runTime
	if (runTime < 10) {
		t=animationCounter
		for (var i=0; i<points.length; ++i) {
			point = points[i]
			point.calcF()
			if(i==0) {
				point.f.strLog('f @ ' + runTime + ': ')
			}
			point.render()
		}		
	}
	cemoCam.renderer.render( scene, camera )
}
animate()