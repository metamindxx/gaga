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

var wlg = wlgBasis(scene)
var MV = bs.multiVector
var Iinv = bs.multiVector('1e_1230') // I defined as e_0123
var I = Iinv.smul(-1)
var g0 = MV('1e_0')

const loader = new THREE.TextureLoader();
var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("/textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})

//var B = MV('2e_10 + 5e_20 + 3e_30').strLog('B : ')
var B = MV('2e_10').strLog('B : ')
var BI = B.gp(I).strLog('BI: ')
var E = MV('2e_20').strLog('E: ')

//var E = MV('7e_10 + 1e_20 + 2e_30').strLog('E: ')
var F = E.add(BI).strLog('F: ')
var E2 = F.dot(g0).strLog('F.g0: ').gp(g0).strLog('E2: ')
var BI2 = F.op(g0).strLog('F wedge g0: ').gp(g0).strLog('BI2: ')

var EdotB = E.gp(B).add( B.gp(E) ).smul(.5).strLog('E.B: ').gp(I).strLog('(E.B)I: ')
E.gp(BI).add( BI.gp(E) ).smul(.5).strLog('E.(BI): ')

/**************************
**	animate
**************************/
var animationCounter = 0
var start = Date.now()

function animate() {
	requestAnimationFrame( animate )
	animationCounter = (Date.now() - start)/100
	if (animationCounter < 100) {

	}
	cemoCam.renderer.render( scene, camera )
}
animate()