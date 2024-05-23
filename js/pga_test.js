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

var pb = pgaBasis(scene)

const loader = new THREE.TextureLoader();
var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("/textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})




//Rendering the origin
var origin = bs.multiVector('1e_123').strLog('origin: ').render()

//=====================================================================================//

function cross(A, B) {
	return A.gp(B).add(B.gp(A).smul(-1)).smul(0.5).selectGrade(A.gradeStored)
}

//		Note: still need to fix .smul() for joinlines and joinplanes (still doesn't invert point order)
// Masses
let m1 = 10
let m2 = 10

// Vectors positions
var x1 = bs.multiVector('1e_1+1e_2').strLog('x1: ')
var x2 = bs.multiVector('-1e_1-1e_2').strLog('x1: ')
var sumX = x1.smul(m1).add(x2.smul(m2)).smul(1/(m1+m2))

// Points from vectors
var X1 = bs.multiVector('1e_0').add(x1).dual().strLog('X1: ').render({color: 0xff0000})
var X2 = bs.multiVector('1e_0').add(x2).dual().strLog('X2: ').render({color: 0x00ff00})
var CoM = bs.multiVector('1e_0').add(sumX).dual().strLog('CoM: ').render({color: 0xff00ff})

// Initial conditions
var initialRotationAboutCoM = CoM.join(bs.multiVector('1e_3').dual()).smul(1).strLog('iTaCoM: ').render()
//var initialRotationAboutCoM = bs.multiVector('5e_12').strLog('iTaCoM: ')
//var renderingTheAbove = bs.multiVector('1.75e_01 -1.00e_02 +1.00e_12').render()
var state = [bs.multiVector('1e_'),initialRotationAboutCoM]

// Force function
function Force(M) {
	return (M.reverse().gp(bs.multiVector('-10e_02').gp(M)).dual())
}

// State change function
function dS(M,B,x,y,m1,m2) {
	var dotM = M.gp(B).smul(-0.5)//.strLog('dotM: ')
	var inside = Force(M).add(cross(B,Ib(B,M,x,y,m1,m2)).smul(1))
	var dotB = (inside).unDual()//.strLog('dotB:')
	return [dotM, dotB] 
}



function Ib(Bb,M,x,y,m1,m2) {
	return M.reverse().gp(Iw(M.gp(Bb.gp(M.reverse())),x,y,m1,m2).gp(M)).strLog('Ib: ')
}

function Iw(Bw,x,y,m1,m2) {
	el1 = x.join(cross(x,Bw)).strLog('el1: ')
	el2 = y.join(cross(y,Bw)).strLog('el2: ')
	return el1.smul(m1).add(el2.smul(m2)).strLog('Iw: ')
}

bs.multiVector('1.33e_03 - 0.67e_13 - 0.67e_23').render()
bs.multiVector('2.67e_03 + 1.33e_13 + 1.33e_23').render()


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

var start = Date.now()

var movedX1 = X1.copy()
var movedX2 = X2.copy()
var movedCoM = CoM.copy()

function animate() {

	requestAnimationFrame( animate )
	animationCounter = (Date.now() - start)/10000
	
	if (animationCounter < .01) {
		
		X1.move(state[0],movedX1)
		X2.move(state[0],movedX2)
		CoM.move(state[0],movedCoM)
		movedX1.render()
		movedX2.render()
		movedCoM.render()

		state[0] = state[0].add(dS(state[0],state[1],X1,X2,m1,m2)[0].smul(1/300))
		state[1] = state[1].add(dS(state[0],state[1],X1,X2,m1,m2)[1].smul(1/300))
	}

	cemoCam.renderer.render( scene, camera )

}
animate()