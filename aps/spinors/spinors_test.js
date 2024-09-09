// scene, camera
const scene = new THREE.Scene();
var cemoCam = new CemoVanillaCamera('points_div')
// var cemoCam = new CemoOrthCamera('points_div')
cemoCam.init(scene)
var camera = cemoCam.camera // main camera
camera.position.set(2, 4, 4)
//camera.rotation.z += Math.PI/2

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
			return cn(this.re + c.re, this.im + this.im)
		}
	,	mul: function(c) {
			return cn(this.re*c.re - this.im*c.im
				 ,  this.re*c.im + this.im*c.re)
		}
	,	strLog: function() {
			console.log(this.str())
			return this
		}
	,	str: function () {
			var re = this.re.toFixed(2)
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
				} else if (im == 1) { re + ' + ' + 'i'
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

var spinor = function() {
	var s = {
		zP: null  //  | +z >
	,	zM: null  //  | -z >
	,	render: function () {

			this.eVec = cemo.addVectorToScene([[posXYZ.x, posXYZ.y, posXYZ.z],[posXYZ.x + E_XYZ.x, posXYZ.y + E_XYZ.y, posXYZ.z + E_XYZ.z]], new THREE.MeshBasicMaterial( { color: this.opt.color }), scene, this)
		}
	}
	return s
}

var upState_zP = cn(1,1).strLog()
var upState_zM = cn(0,2).strLog()
var x = upState_zM.mul(upState_zP).strLog().mul(upState_zM).strLog().mul(upState_zM).strLog()
var sUp = spinor()
sUp.zP = upState_zP
sUp.zM = upState_zM
var y = cnRT(1, 7*pi/4).strLog()




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