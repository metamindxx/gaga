// scene, camera
const scene = new THREE.Scene();
var pi = Math.PI
,	sqrt = Math.sqrt
,	cos = Math.cos
,	sin = Math.sin
var cemoCam = new CemoVanillaCamera('points_div')
// var cemoCam = new CemoOrthCamera('points_div')
cemoCam.init(scene)
var camera = cemoCam.camera // main camera
camera.up = {x:0,y:0,z:1}
camera.position.set(3, 6, 1)
//camera.rotation.x = Math.PI/2
camera.lookAt(new THREE.Vector3(0,0,0))

// Lights
scene.add(new THREE.AmbientLight(0x444444));
var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(10, 20, 50);
scene.add(light);

// axes
var mtrlRed   = new THREE.LineBasicMaterial( { color: 0xff0000 } );
var mtrlGreen = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
var mtrlBlue  = new THREE.LineBasicMaterial( { color: 0x0000ff } );
cemo.addVectorToScene([[0, 0, 0],[1, 0, 0]], mtrlRed, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 1, 0]], mtrlGreen, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 0, 1]], mtrlBlue, scene)

// wire sphere
var rad = 2, wires = 10
const wsGeom = new THREE.SphereGeometry( rad, wires, wires );
wsGeom.rotateX (Math.PI/2)
const wireframe = new THREE.WireframeGeometry( wsGeom );
var wireMat = new THREE.LineBasicMaterial( { color: 0xFF9225 , transparent: true, opacity: 0.1, depthTest: false } );
const wireSphere = new THREE.LineSegments( wireframe , wireMat);
scene.add( wireSphere );


var pi = Math.PI

var aps = apsBasis(scene)

const loader = new THREE.TextureLoader();
var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("/textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})

// complex number (a + bi)
var cn = function (re, im, id) {
	if (!id) {id = ''}
	var acn = {
		re: re
	,	im: im
	,	id: id
	,	add: function(c) {
			return cn(this.re + c.re, this.im + c.im)
		}
	,	smul: function(m) {
			return cn(m*this.re, m*this.im)
		}
	,	mul: function(c) {
			return cn(this.re*c.re - this.im*c.im
				 ,  this.re*c.im + this.im*c.re)
		}
	,	conjugateMul: function(c) {
			return cn(this.re*c.re + this.im*c.im
				 ,  -this.re*c.im + this.im*c.re)
		}
	,	strLog: function() {
			console.log(this.str())
			return this
		}
	,	str: function () {
			var re = this.re.toFixed(2)
			if (re == 1) { (re = 1)
			} else if (re == -1) re = -1
			var im = this.im.toFixed(2)
			if (re == 0) {
				if (im == 0) { return '0'
				} else if (im == 1) { return 'i'
				} else if (im == -1) { return '-i'
				} else { return '' + im + 'i'
				}
			} else {
				if (im == 0) {
					return re
				} else if (im == 1) {
					return re + ' + ' + 'i'
				} else if (im == -1) {
					return re + ' - ' + 'i'
				} else {
					var sign = ' +'
					if (im < 0) {
						sign = ' -'
					}
				return re + sign + Math.abs(im) + 'i'
				}
			}
		}
	}
	return acn
}
var cnRT = function (r, theta) {
	return cn(r*Math.cos(theta), r*Math.sin(theta))
}

// Andrew M. Steane -- An introduction to spinors
var spinor = function(r, theta, phi, alpha) {
	var s = {
		a: null
,		b: null
//		zP: null  //  | +z >
//	,	zM: null  //  | -z >
	,	render: function() {
			var a = this.a
			,	b = this.b
			var rx = a.conjugateMul(b).add( b.conjugateMul(a) ).re
			,	ry = - (a.conjugateMul(b).add( b.conjugateMul(a).smul(-1) )).im
			,	rz = a.conjugateMul(a).re - b.conjugateMul(b).re

			console.log('rx: ' + rx)
			console.log('ry: ' + ry)
			console.log('rz: ' + rz)

			this.eVec = cemo.addVectorToScene([[0,0,0],[2*rx, 2*ry, 2*rz]], new THREE.MeshBasicMaterial( { color: 0x0000ff }), scene, this)
			return this
		}
	,	rotate: function (su2) {
			this.strLog('before: ')
			su2.strLog('su2: ')

			// turn the spin numbers into a 2x2 matrix
			var spin2x2 = c2x2( this.a, this.b, cn(0,0), cn(0,0) )
			var transformed2x2 = su2.mul(spin2x2)
			transformed2x2.strLog('transformed: ')

			// put the transformed spin numbers back in a & b
			this.a = transformed2x2.d[0][0]
			this.b = transformed2x2.d[1][0]
			this.strLog('after: ')
			return this
		}
	,	strLog: function (label) {
		if (!label) label = ''
		console.log(label + 'a: ' + this.a.str() + ', b: ' + this.b.str())
	}
	}
	var sqrtR = sqrt(r)
	aAmplitude = sqrtR * cos(theta/2)
	bAmplitude = sqrtR * sin(theta/2)
	aExponent = (-alpha -phi) / 2
	bExponent = (-alpha +phi) / 2
	s.a = cn ( aAmplitude * cos(aExponent), aAmplitude * sin(aExponent))
	s.b = cn ( bAmplitude * cos(bExponent), bAmplitude * sin(bExponent))

	return s
}

// complex 2x2 matrix
var c2x2 = function (a,b,c,d) {
	var m = {}
	m.d = [[a,b],[c,d]] // data
	m.add = function (cm2) {
		var d1 = this.d
		var d2 = cm2.d
		return c2x2( d1[0][0].add(d2[0][0]), d1[0][1].add(d2[0][1]),
		             d1[1][0].add(d2[1][0]), d1[1][1].add(d2[1][1]) )
	}

	// cm for complex matrix
	m.smul = function (m) {
		var d = this.d
		return c2x2(d[0][0].smul(m), d[0][1].smul(m), d[1][0].smul(m), d[1][1].smul(m))
	}
	m.mul = function (cm2) {
		var d1 = this.d
		d2 = cm2.d
		// cm1[0,0] * cm2[0,0] + cm1[0,1] * cm2[1,0]               cm1[0,0] * cm2[0,1] + cm1[0,1] * cm2[1,1]
		// cm1[1,0] * cm2[0,0] + cm1[1,1] * cm2[1,0]               cm1[1,0] * cm2[0,1] + cm1[1,1] * cm2[1,1]
		var a = d1[0][0].mul(d2[0][0]).add( d1[0][1].mul(d2[1][0]) )
		var b = d1[0][0].mul(d2[0][1]).add( d1[0][1].mul(d2[1][1]) )
		var c = d1[1][0].mul(d2[0][0]).add( d1[1][1].mul(d2[1][0]) )
		var d = d1[1][0].mul(d2[0][1]).add( d1[1][1].mul(d2[1][1]) )
		return c2x2(a,b,c,d)
	}
	m.strLog = function(label) {
		if (!label) {label =''}
		var d = this.d
		console.log (label + '[' + d[0][0].str() + ', ' + d[0][1].str() + '] [' + d[1][0].str()  + ', ' + d[1][1].str() + ']')
		return this
	}
	m.det = function() {
		var d = this.d
		return d[0][0].mul(d[1][1]).add( d[0][1].mul(d[1][0]).smul(-1) )
	}

	return m
}

var SU2 = function(x, y, z) {
	// the pauli matricies
	var t1 = c2x2( cn(0,0), cn(1,0) ,
	               cn(1,0), cn(0,0) )

	var t2 = c2x2( cn(0,0), cn(0,-1) ,
	               cn(0,1), cn(0, 0) )

	var t3 = c2x2( cn(1,0), cn( 0,0) ,
	               cn(0,0), cn(-1,0) )

//	t1.mul(t2).strLog('t1 * t2: ')
//	t3.strLog('t3: ')

//	var a = t1.smul(x).strLog('a: ')
//	var b = t2.smul(y).strLog('b: ')
//	var c = t3.smul(z).strLog('c: ')
//	var d = a.add(b).strLog('d: ')
//	var e = d.add(c).strLog('e: ')
	return t1.smul(x).add(t2.smul(y)).add(t3.smul(z))
}

var rotX = function (halfTheta) {
	return c2x2( cn( cos(halfTheta), 0 ), cn( 0, sin(halfTheta) ) ,
	             cn( 0, sin(halfTheta) ), cn(cos(halfTheta), 0) )
}
var rotX = function (halfTheta) {
	return c2x2( cn( cos(halfTheta), 0 ), cn( 0, sin(halfTheta) ) ,
	             cn( 0, sin(halfTheta) ), cn(cos(halfTheta), 0) )
}



var r1 = SU2(1,1,1)

// var spinor = function(r, theta, phi, alpha) {
var s1 = spinor(1,0,0,0).render()
//var xRotation = SU2(.5,0,0).strLog('x rotation: ')
var xRotation = rotX(pi/8).strLog('x rotation: ')
console.log('rotation determinant: ' + xRotation.det().str())
var s2 = s1.rotate(xRotation).render() //.strLog('s2: ')


//var upState_zP = cn(1,1).strLog()
//var upState_zM = cn(0,2).strLog()
//var x = upState_zM.mul(upState_zP).strLog().mul(upState_zM).strLog().mul(upState_zM).strLog()
//var sUp = spinor()
//sUp.zP = upState_zP
//sUp.zM = upState_zM
//var y = cnRT(1, 7*pi/4).strLog()

//line.material.depthTest = false;
//line.material.opacity = 0.1;
//line.material.transparent = true;
//line.color = 0x000000



bs.multiVector('2e_1 + 2e_2').render()
bs.multiVector('2e_1 + 0e_2').render()
bs.multiVector('2e_1 - 2e_2').render()



//=================================================================================================//
var bannerDiv = document.getElementById('banner_div')
bannerDiv.style.fontFamily = 'Courier New, Courier'
bannerDiv.style.position.absolute = true
bannerDiv.style.zIndex = 3
//bannerDiv.innerHTML = 'banner! Yey!' // bs.renderHtml()


var infoDiv = document.getElementById('info_div')
infoDiv.style.fontFamily = 'Courier New, Courier'
//infoDiv.style.position.absolute = true
//infoDiv.style.zIndex = 3
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
infoDiv.innerHTML = bs.cayleyHtml({order: bladeOrder})
*/
//infoDiv.innerHTML = bs.cayleyHtml()

/**************************
**	animate
**************************/
var animationCounter = 0
var start = Date.now()

function animate() {
	requestAnimationFrame( animate )
	animationCounter = (Date.now() - start)/10000

	if (animationCounter < 100) {
	}

	cemoCam.renderer.render( scene, camera )
}
animate()