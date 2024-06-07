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
//light.position.set(0, 100, 0);
scene.add(light);

// axes
var mtrlRed   = new THREE.LineBasicMaterial( { color: 0xff0000 } );
var mtrlGreen = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
var mtrlBlue  = new THREE.LineBasicMaterial( { color: 0x0000ff } );
cemo.addVectorToScene([[0, 0, 0],[.1, 0, 0]], mtrlRed, scene)
cemo.addVectorToScene([[0, 0, 0],[0, .1, 0]], mtrlGreen, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 0, .1]], mtrlBlue, scene)

var hpga = hpgaBasis(scene)

const loader = new THREE.TextureLoader();
var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("/textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})

//let grid = new THREE.GridHelper(4, 20, 0xffff00, 0xffff00);
//grid.position.y = -0.001;
//scene.add(grid, new THREE.AxesHelper(1));

var pss = bs.multiVector('1e_012')
var origin = bs.multiVector('1e_12')

//**************
// Sheet
let graphGeom = new THREE.PlaneBufferGeometry(4, 4, 20, 20);
graphGeom.rotateX(Math.PI * -0.5);
//let graphMat = new THREE.MeshNormalMaterial({side: THREE.DoubleSide, opacity: .1, wireframe: false});
//let graphMat = new THREE.MeshPhongMaterial({side: THREE.DoubleSide, transparent: true, opacity: .5, wireframe: false});
let graphMat = new THREE.MeshNormalMaterial({side: THREE.DoubleSide, transparent: true, opacity: .3, wireframe: false});
let graph = new THREE.Mesh(graphGeom, graphMat);

// f(x,z)
let pos = graphGeom.attributes.position;
for(let i = 0; i < pos.count; i++){
    let x = pos.getX(i);
  	let z = pos.getZ(i);
	  pos.setY(i, Math.pow(1 + x*x + z*z, .5));
	}
graphGeom.computeVertexNormals();
scene.add(graph)

//**************
// Unit circle
const circGeom = new THREE.CircleGeometry( 1, 20 ); 
let circMat = new THREE.MeshPhongMaterial({color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: .3, wireframe: false});
const circle = new THREE.Mesh( circGeom, circMat ); 
circle.lookAt(new THREE.Vector3(0, 1, 0))
circle.position.set(0,1,0)
scene.add( circle );


//var vec1 = bs.multiVector('1e_0 + 2e_1 + 0e_2').strLog('vec1: ').render({color: 0x0000ff, showRays: false})
//var vec2 = bs.multiVector('-1e_0 - 1e_1 + 3e_2').strLog('vec1: ').render({color: 0x00ff00, showRays: true})

var e0 = bs.multiVector('1e_0').strLog('e0 : ') //.render({color: 0x00ff00})
var e0d = e0.dual().strLog('e0d: ') 
var e0pss = e0.gp(pss).strLog('e0p: ') 

var e1 = bs.multiVector('1e_1').strLog('e1: ') //.render({color: 0xff0000})
var e1d = e1.dual().strLog('e1d: ') 
var e1pss = e1.gp(pss).strLog('e1p: ') 

var e2 = bs.multiVector('1e_2').strLog('e2: ') //.render({color: 0x0000ff})
var e2d = e2.dual().strLog('e2d: ') 
var e2pss = e2.gp(pss).strLog('e2p: ') 



var angle = Math.PI * (3/16)
console.log('angle: ' + angle)

e0.smul(Math.cos(angle)).add(  
	e1.smul(Math.sin(angle)) ).render()

e0d.smul(Math.cos(angle)).add(  
	e1d.smul(Math.sin(angle)) ).render()



//var e01 = bs.multiVector('1e_01')
//var e02 = bs.multiVector('1e_02')
//var e12 = bs.multiVector('1e_12')



var h2point = function(x,y) {
	var h2p = bs.multiVector('1e_12 - ' + x + 'e_02 + ' + y + 'e_01')
	return h2p
}

//var bv1 = bs.multiVector('2e_12').render()
//bv1.gp(bv1).strLog('bv1 sq: ')
//var p1 = h2point(.4, .8).render()

/**************************
**	animate
**************************/
var animationCounter = 0
var start = Date.now()
var showNextCount = 0
var angle, sign
var e12 = bs.multiVector('1e_12')
var e01 = bs.multiVector('1e_01')

function animate() {
	requestAnimationFrame( animate )
	animationCounter = (Date.now() - start)/100
/*
	if (animationCounter < 100) {
		if (animationCounter > showNextCount) {
			showNextCount += 10
			angle = (Math.PI * showNextCount / 100).toFixed(4)
			console.log('angle: ' + angle)

			e12.smul(Math.cos(angle)).add(  
				e01.smul(Math.sin(angle)) ).render()
		}

	}
*/
	cemoCam.renderer.render( scene, camera )
}
animate()