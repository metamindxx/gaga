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

var f = E.add(BI).strLog('f: ')


/**************************
**	animate
**************************/
var animationCounter = 0
var start = Date.now()
var exponent

var range = 1, step = .1, t = 0, f_xt
var zCoord = MV(-range + 'e_30')
var zCoordStep = MV(step + 'e_30')
for (var i=-range; i<range; i+=step) {
	exponent = i*woc - w*t
	f_xt = f.gp(I.exp(exponent))
	zCoord = zCoord.add(zCoordStep)
	//f_xt.add(zCoord).strLog('f_xt: ')
	f_xt.render({as: "xyzFrom4Bivec", color: 0xff00ff})
}

function animate() {
	requestAnimationFrame( animate )
	animationCounter = (Date.now() - start)/100
	if (animationCounter < 100) {
	}
	cemoCam.renderer.render( scene, camera )
}
animate()