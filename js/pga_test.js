// scene, camera
const scene = new THREE.Scene();
var cemoCam = new CemoVanillaCamera('points_div')
// var cemoCam = new CemoOrthCamera('points_div')
cemoCam.init(scene)
var camera = cemoCam.camera // main camera
camera.position.set(1, 4, 4)
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

var pb = pgaBasis(scene)

const loader = new THREE.TextureLoader();
var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("/textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})




//Rendering the origin
bs.multiVector('1e_123').render()

//=====================================================================================//

//		Note: still need to fix .smul() for joinlines and joinplanes (still doesn't invert point order)


var p1 = bs.multiVector('1e_0 + 1e_1 + 2e_2').dual().strLog('p1: ').render({color: 0xff0000})
var p2 = bs.multiVector('1e_0 + 1e_2 + 1.5e_3').dual().strLog('p2: ').render({color: 0x00ff00})
var p3 = bs.multiVector('1e_0 + .3e_2 + .2e_3').dual().strLog('p2: ').render({color: 0x0000ff})
var join = p1.join(p2).strLog('join: ').render()

var a = bs.multiVector('1e_0 + 1e_1 + 2e_2 + 1e_3').dual().strLog('a: ').render({color: 0xdd00ff})

var biv = bs.multiVector(' 1e_12 + 1e_23 - 1e_13 + 2e_01 - 1e_02').normalize().render()

var translation = bs.multiVector('1e_01+1e_02').render()

var JoinAp2 = p3.join(p2).strLog('JoinAp2: ').render()
var JoinAp2p1 = JoinAp2.join(p1).strLog('JoinAp2p1: ')
JoinAp2p1.id = 'JoinAp2p1'
var movedTriangle = JoinAp2p1.copy().render({color: 0xdd00ff})
movedTriangle.id = 'movedTriangle'

//=====================================================================================//

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
var movedP1 = a.copy()
movedP1.opt.color = 0xff00ff
var rotor
var start = Date.now()
function animate() {

	requestAnimationFrame( animate )
	animationCounter = (Date.now() - start)/10000
	
	if (animationCounter < 100) {
		rotor = biv.eexp(-animationCounter)
		a.move(rotor, movedP1)
		movedP1.render()

		JoinAp2p1.move(rotor, movedTriangle)
		//movedTriangle.render({color: 0xff0000, renderComponents: true})
		movedTriangle.render({color: 0xff0000, renderComponents: false})
	}

	cemoCam.renderer.render( scene, camera )

}
animate()