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

var a = bs.multiVector('-2e_0 + 1e_1 + 1e_2').render({color: 0xff0000})
var b = bs.multiVector('-1e_0 - 1e_3').render({color: 0x0000ff})
var line = b.gp(a).selectGrade(2).normalize().render({color: 0x00fAAf})
var rotor = line.exp(Math.PI/1000).strLog('rotor: ')
//var aRot1 = rotor.gp(a.gp(rotor.reverse())).selectGrade(1).strLog('aRot1: ').render()
//var aRot2 = rotor.gp(aRot1.gp(rotor.reverse())).selectGrade(1).strLog('aRot2: ').render()
//var aRot3 = rotor.gp(aRot2.gp(rotor.reverse())).selectGrade(1).strLog('aRot3: ').render()
//var aRot4 = rotor.gp(aRot3.gp(rotor.reverse())).selectGrade(1).strLog('aRot4: ').render()
var point = bs.multiVector('1e_0 + 1e_1 + 2e_2 + 3e_3').dual().strLog('point: ').render(0x00ff)
//This function only rotates planes
function rotate1(mv) {
	for(let i=0; i<1000; ++i){
		var mvRot = rotor.gp(mv.gp(rotor.reverse())).selectGrade(1).strLog('aRot', i,' :').render()
		mv = mvRot.copy()
	}
}
//This function only rotates points
function rotate2(mv) {
	for(let i=0; i<1000; ++i){
		var mvRot = rotor.gp(mv.gp(rotor.reverse())).selectGrade(3).strLog('aRot', i,' :').render()
		mv = mvRot.copy()
	}
}
rotate1(a) 
rotate2(point)

/*
//var a = bs.multiVector(' -1e_0 + 1e_1').normalize().strLog('a: ').render({color: 0xff0000})
//var b = bs.multiVector(' -1e_0 + 1e_2').normalize().smul(1).strLog('b: ').render({color: 0x00ff00})
var a = bs.multiVector(' 1e_0 + 2e_3').dual().normalize().strLog('a: ').render({color: 0xff0000})
var b = bs.multiVector(' 1e_0 + 2e_1').dual().normalize().smul(-1).strLog('b: ').render({color: 0x00ff00})
var rotorSq = b.gp( a.inverse() ).strLog('rotorSq :')
var rotor = rotorSq.rotorSqrt().strLog('rotor 1: ')
//--------------------------------------------------
rotor = rotor.selectGrade(2).strLog('rotor 2: ').render({color: 0x0000ff})
var x = bs.multiVector(' 1e_0 + 1e_1').strLog('x: ').render({color: 0xFF2D00})
var y = bs.multiVector(' 1e_0 + 1e_2 ').smul(-1).strLog('y: ').render({color: 0x0CFF00})
var z = bs.multiVector(' 1e_0 + 1e_3').strLog('z: ').render({color: 0x0015FF})
var xDual = x.dual().strLog('xDual: ').render({color: 0xFF2D00})
var yDual = y.dual().strLog('yDual: ').render({color: 0x0CFF00})
var zDual = z.dual().strLog('zDual: ').render({color: 0x0015FF})
var sumXY = x.add(y).render()
var sumYZ = y.add(z).render()
var sumZX = z.add(x).render()
var sumXYZ = sumXY.add(z).render({color: 0xAAAA})
var sumXYZdual = sumXYZ.dual().render({color: 0xadfd})
//Below's not rendering? I might just be ignorant and it's not meant to render (MEC)
//var xDdotyDot = xDual.join(yDual).strLog('xDdotyDot: ').render({color: 0x00000})

var line = x.gp(y).selectGrade(2).render()

var rotor2Sq = bs.multiVector(' 1e_12').strLog('rotor2Sq: ')
var rotor2 = rotor2Sq.rotorSqrt().strLog('afterSqrt: ').selectGrade(2).normalize().strLog('rotor2: ')
var partRotor2 = rotor2.exp(Math.PI).strLog('partRotor2: ')

//var rot1Test = partRotor2.gp(sumXYZdual.gp(partRotor2.reverse())).selectGrade(3).strLog('rot1Test: ').render({color: 0x0015FF})

var rot1 = partRotor2.gp(sumXYZdual.gp(partRotor2.reverse())).selectGrade(3).strLog('rot1: ').render()
var rot2 = partRotor2.gp(rot1.gp(partRotor2.reverse())).selectGrade(3).strLog('rot2: ').render()
var rot3 = partRotor2.gp(rot2.gp(partRotor2.reverse())).selectGrade(3).strLog('rot3: ').render()
var rot4 = partRotor2.gp(rot3.gp(partRotor2.reverse())).selectGrade(3).strLog('rot4: ').render()
var rot5 = partRotor2.gp(rot4.gp(partRotor2.reverse())).selectGrade(3).strLog('rot5: ').render()
var rot6 = partRotor2.gp(rot5.gp(partRotor2.reverse())).selectGrade(3).strLog('rot6: ').render()

//---------------------------------------------------
//rotor = rotorSq.normalize().strLog('rotor 3: ')

// test the rotor works
//var c = rotor.gp(a.gp(rotor.reverse())).strLog('c: ')
/*
var partRotor = rotor.exp(Math.PI/16).strLog('partRotor: ')
var c = partRotor.gp(a.gp(partRotor.reverse())).selectGrade(3).strLog('c: ').render({color: 0x0000ff})
var d = partRotor.gp(c.gp(partRotor.reverse())).selectGrade(3).strLog('d: ').render()
var e = partRotor.gp(d.gp(partRotor.reverse())).selectGrade(3).strLog('e: ').render()
var f = partRotor.gp(e.gp(partRotor.reverse())).selectGrade(3).strLog('f: ').render()

c.render({color: 0x0000ff})
//var d = bs.multiVector('-0.96e_1 -0.15e_2 +0.23e_3 -0.58e_0').render({color: 0x000000})
*/

/* This worked
var a = bs.multiVector(' -1e_0 - 2e_1').strLog('a: ').render({color: 0xff0000})
var ad = a.dual().strLog('!a: ').render({color: 0xff0000})

var b = bs.multiVector(' 1e_0').dual().strLog('b: ').render({color: 0x0000ff})
//var ad = a.dual().strLog('!a: ').render({color: 0xff0000})



var a = bs.multiVector('-1e_0 +.5e_1').strLog('!a: ').render({color: 0xff0000})
a.sadd(1).strLog('a+1: ').sadd(2).strLog('a+3: ')


var b = bs.multiVector('-1e_0 + .5e_2').strLog('!b: ').render({color: 0x00ff00})
var c = bs.multiVector('-1e_0 + 1e_3').strLog('!c: ').render({color: 0x0000ff})
var p1 = a.op(b.op(c)).strLog('p: ').render({color: 0xff0000})
var p2 = pb.pt(1,2,3).strLog('[123]: ').render({color: 0x0000ff})

var WrotorSq = p2.gp(p1.inverse()).normalize().strLog('WrotorSqU: ')
var WrotorSqReversed = p1.gp(p2.inverse()).normalize().strLog('WrotorSqUReversed: ')
WrotorSq = WrotorSq.normalize().strLog('WrotorSqN: ')
var Wrotor = WrotorSq.sadd(1).strLog('WrotorSqN + 1: ')
Wrotor = Wrotor.normalize().strLog('p1 -> p2: ')

//var p3 = Wrotor.gp(p2).gp(Wrotor.reverse()).render()

*/

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