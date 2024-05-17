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


//Rendering the origin
bs.multiVector('1e_123').render()

//=====================================================================================//

//		Note: still need to fix .smul() for joinlines and joinplanes (still doesn't invert point order)


var p1 = bs.multiVector('1e_0 + 1e_1 + 2e_2').dual().strLog('p1: ').render({color: 0xff0000})
var p2 = bs.multiVector('1e_0 + 1e_2 + 2e_3').dual().strLog('p2: ').render({color: 0x00ff00})
var join = p1.join(p2).strLog('join: ').render()


var biv = bs.multiVector(' 1e_12 + 1e_23 - 1e_13').normalize().render()


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
var movedP1 = p1.copy()
//var movedJoin = join.copy()
function animate() {


	requestAnimationFrame( animate )
	animationCounter += .01
	
	if (animationCounter < 100) {
		p1.move(biv.exp(animationCounter), movedP1)
	//	join.move(biv.exp(animationCounter), movedJoin)
		movedP1.render()
	//  movedJoin.render()
	}
//	p1 = p1.move(biv.exp(.01)).render()


	cemoCam.renderer.render( scene, camera )

}
animate()