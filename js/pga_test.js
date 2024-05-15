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

var p1 = bs.multiVector('1e_0 + 1e_1 + 2e_2').dual().strLog('p1: ').render({color: 0xff0000})
var p2 = bs.multiVector('1e_0 + 2e_2 + 3e_3').dual().strLog('p2: ').render({color: 0x0000ff})
var p3 = bs.multiVector('1e_0 + 3e_3 + 1e_1').dual().strLog('p3: ').render({color: 0x00ff00})
var join12 = p1.join(p2).strLog('join12: ').render()
var join23 = p2.join(p3).strLog('join23: ').render()
var join31 = p3.join(p1).strLog('join31: ').render()
var join231 = p1.join(join23).strLog('join231: ').render()

var B = bs.multiVector('1e_12 - 3e_13').normalize().strLog('B: ').render()
var R = B.exp(Math.PI/100).strLog('R: ')
/*
var rotOfp1 = R.gp(p1.gp(R.reverse())).selectGrade(3).strLog('rotOfp1: ').render({color: 0xFF0000})
var rotOfp2 = sqrtB.gp(p2.gp(sqrtB.reverse())).selectGrade(3).strLog('rotOfp1: ').render({color: 0x0000ff})
var rotOfp3 = sqrtB.gp(p3.gp(sqrtB.reverse())).selectGrade(3).strLog('rotOfp1: ').render({color: 0x00ff00})

var join12Rot = rotOfp1.join(rotOfp2).strLog('join12: ').render()
var join23Rot = rotOfp2.join(rotOfp3).strLog('join23: ').render()
var join31Rot = rotOfp3.join(rotOfp1).strLog('join31: ').render()
*/


function rotateAll(mv1,mv2,mv3,clr1,clr2,clr3,) {
	for(let i=0; i<100; ++i){
		var mvRot1 = R.gp(mv1.gp(R.reverse())).selectGrade(3).strLog('mvRot1', i,' :').render({color: clr1})
		var mvRot2 = R.gp(mv2.gp(R.reverse())).selectGrade(3).strLog('mvRot2', i,' :').render({color: clr2})
		var mvRot3 = R.gp(mv3.gp(R.reverse())).selectGrade(3).strLog('mvRot3', i,' :').render({color: clr3})
		mv1 = mvRot1.copy()
		mv2 = mvRot2.copy()
		mv3 = mvRot3.copy()
		var join12Rot = mv1.join(mv2).strLog('join12: ', i,' :').render()
		var join23Rot = mv2.join(mv3).strLog('join23: ', i,' :').render()
		var join31Rot = mv3.join(mv1).strLog('join31: ', i,' :').render()
		var joinPlane = join12Rot.join(mv3).strLog('joinPlane: ', i,' :').render({color: 0xAAA})
	}
}

rotateAll(p1,p2,p3,0xFF0000,0x0000ff,0x00ff00)

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
function animate() {
	requestAnimationFrame( animate )
	animationCounter += .01
	cemoCam.renderer.render( scene, camera )
}
animate()