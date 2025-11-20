// scene, camera
const scene = new THREE.Scene();
var cemoCam = new CemoVanillaCamera('points_div')
// var cemoCam = new CemoOrthCamera('points_div')
cemoCam.init(scene)
var camera = cemoCam.camera // main camera
//camera.rotation.x += Math.PI/2
camera.up.set(0,0,1)
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
const geometry = new THREE.PlaneGeometry( 4, 4 );
const material = new THREE.MeshPhongMaterial({color: 0xcccccc, opacity: 0.5, transparent: true});
const plane = new THREE.Mesh( geometry, material );
plane.position.set(0,0,1)
plane.lookAt(new THREE.Vector3(0, 0, 1))
scene.add( plane );

var MCGA = mcgaBasis(scene)
var MV = bs.multiVector

const loader = new THREE.TextureLoader();
var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("/textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})

var x = MV('1e_x').render({color: 0xff0000})
var y = MV('1e_y').render({color: 0x00ff00})
//var t = MV('1e_t').render({color: 0xe7e120})
var vec = MV('1e_m + 4e_y + 2e_x').render({color: 0xb500b5})

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