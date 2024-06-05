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
cemo.addVectorToScene([[0, 0, 0],[1, 0, 0]], mtrlRed, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 1, 0]], mtrlGreen, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 0, 1]], mtrlBlue, scene)

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
// Curve
var hypPoints = []
for (var i=-2; i<2; i+=.02) {
	hypPoints.push(new THREE.Vector3(i, Math.pow(1 + i*i, .5), 0)) 	
}

const curveGeom = new THREE.BufferGeometry().setFromPoints( hypPoints );
const curveMat = new THREE.LineBasicMaterial( { color: 0xff0000 } );
const curve = new THREE.Line( curveGeom, curveMat );
scene.add(curve)

//**************
// Unit circle
const circGeom = new THREE.CircleGeometry( 1, 20 ); 
//let circMat = new THREE.MeshNormalMaterial({color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: .3, wireframe: false});
let circMat = new THREE.MeshPhongMaterial({color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: .3, wireframe: false});
//const circMat = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
const circle = new THREE.Mesh( circGeom, circMat ); 
circle.lookAt(new THREE.Vector3(0, 1, 0))
circle.position.set(0,1,0)
scene.add( circle );


//var line1 = bs.multiVector('1e_0 + 2e_1').render()
var vec1 = bs.multiVector('.5e_0 + 3e_1 + 2e_2').strLog('vec1: ').render()
var perpLine = vec1.gp(pss).strLog('perpLine: ').render({color: 0xff00ff})

var h2point = function(x,y) {
	var h2p = bs.multiVector('1e_12 - ' + x + 'e_02 + ' + y + 'e_01')
	return h2p
}

//var p1 = h2point(.4, .8).render()


/*

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