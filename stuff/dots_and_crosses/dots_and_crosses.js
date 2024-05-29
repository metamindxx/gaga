// scene, camera
const scene = new THREE.Scene();
var cemoCam = new CemoVanillaCamera('points_div')
// var cemoCam = new CemoOrthCamera('points_div')
cemoCam.init(scene)
var camera = cemoCam.camera // main camera
camera.position.set(2, 6, 6)
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
cemo.addVectorToScene([[0, 0, 0],[.1, 0, 0]], mtrlRed, scene)
cemo.addVectorToScene([[0, 0, 0],[0, .1, 0]], mtrlGreen, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 0, .1]], mtrlBlue, scene)

var pb = pgaBasis(scene)

const loader = new THREE.TextureLoader();
var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("/textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})




//Rendering the origin
var origin = bs.multiVector('1e_123').strLog('origin: ')
var infinity = bs.multiVector('1e_0')

//=================================================================================================//

//_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-||
                                                                                      //||
// Array sum function													              //||
function aSum(a) {                                                                    //||
	let sum = 0                                                                       //||
	for (let i=0; i<a.length; i++) {                                                  //||
		sum += a[i]                                                                   //||
	}                                                                                 //||
	return sum                                                                        //||
}                                                                                     //||
                                                                                      //||
// Cross product function                                                             //||
function cross(A, B) {                                                                //||
	return A.gp(B).add(B.gp(A).smul(-1)).smul(0.5)                                    //||
}                                                                                     //||
                                                                                      //||
// Force function                                                                     //||
function Fb(M) {                                                                      //||
	return (M.reverse().gp(bs.multiVector('-9.81e_02').gp(M))).unDual()               //||
}                                                                                     //||
                                                                                      //||
// State change function                                                              //||
function stateDot(state) {                                                                    //||
	var dotM = state.M.gp(state.B).smul(-0.5)//.strLog('dotM: ')                                  //||
	var inside = Fb(state.M).add(cross(state.B, state.B.dual()))                                         //||
	var dotB = (inside).unDual()//.strLog('dotB:')                                    //||
	return {M: dotM, B: dotB}                                                               //||
}                                                                                     //||
                                                                                      //||
function Ib(M,B,pA) {
	//Need to add this. First, add bodyframe position vectors within an array
}
                                                                                      //||
//_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-||

//		Note: still need to fix .smul() for joinlines and joinplanes (still doesn't invert point order)
// Masses
let masses = [0.5,0.5]

// Vectors positions
var x = bs.multiVector('1e_1 - 1e_2 + 1e_3')

// Points from vectors
var X = infinity.add(x).dual().strLog('X: ').render({color: 0xff0000})

// Initial conditions
var B = bs.multiVector('1e_01 + 1e_12').strLog('B: ').render({color: 0x0000ff})

var state = {M: bs.multiVector('-1e_01 - 1e_02').eexp(1),
			 B: B}

// Xdot = X x B
var Xdot = cross(X, B).selectGrade(3).strLog('Xdot: ').render({color: 0x00ff00})

var X_j_Xd = X.join(Xdot).strLog('X_j_Xd: ').render({color: 0xff00ff})
var Ib = X_j_Xd // I[B] = X v Xdot = x v (X x B)

// Fb = (Ib[Bb] x Bb) + Ib[Bb.dot]
var Ib_x_Bb = cross(X_j_Xd, B).selectGrade(2).strLog('Ib_x_Bb: ').render({color: 0x000000})


//=================================================================================================//


/**************************
**	animate
**************************/
var animationCounter = 0

var start = Date.now()

/*
var movedX1 = X1.copy()
var movedX2 = X2.copy()
var movedCoM = CoM.copy()
var deltaState
*/

function animate() {

	requestAnimationFrame( animate )
	animationCounter = (Date.now() - start)/10000

	if (animationCounter < 100) {
/*
		X1.move(state.M,movedX1)
		X2.move(state.M,movedX2)
		CoM.move(state.M,movedCoM)
		movedX1.render()
		movedX2.render()
		movedCoM.render()

		deltaState = stateDot(state)
		state.M = state.M.add(deltaState.M.smul(1/600))
		state.B = state.B.add(deltaState.B.smul(1/600))
*/
	}

	cemoCam.renderer.render( scene, camera )

}
animate()