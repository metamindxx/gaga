// scene, camera
const scene = new THREE.Scene();
var cemoCam = new CemoVanillaCamera('points_div')
// var cemoCam = new CemoOrthCamera('points_div')
cemoCam.init(scene)
var camera = cemoCam.camera // main camera
camera.position.set(2, 4, 4)
//camera.rotation.z += Math.PI/2

// lights
scene.add(new THREE.AmbientLight(0x444444));
var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(10, 20, 50);
scene.add(light);

// materials
const loader = new THREE.TextureLoader();
// var dottyMaterial = new THREE.MeshLambertMaterial({map: loader.load("textures/dots_256.png"), alphaTest: 0.5, side: THREE.BackSide})
var mtrlRed   = new THREE.LineBasicMaterial( { color: 0xff0000 } );
var mtrlGreen = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
var mtrlBlue  = new THREE.LineBasicMaterial( { color: 0x0000ff } );

// axes
cemo.addVectorToScene([[0, 0, 0],[1, 0, 0]], mtrlRed, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 1, 0]], mtrlGreen, scene)
cemo.addVectorToScene([[0, 0, 0],[0, 0, 1]], mtrlBlue, scene)

var cga = cgaBasis(scene)
// var pb = pgaBasis(scene)


// PGA
//var origin = bs.multiVector('1e_123').strLog('origin: ')
//var infinity = bs.multiVector('1e_0')



// CGA
var point = function(x,y,z) {
	var mvStr = x + 'e_1 + ' + y + 'e_2 +' + z + 'e_3'
	var x3d = bs.multiVector(mvStr)
	var infScale = (x*x + y*y + z*z)/2
	return cga.n0.add( x3d ).add( cga.ni.smul(infScale) )
}

var Thing = function(parent) {
	var th = {
		parent: parent
	,	things: []
//	,	things: [id= '1']
	,	idStr: '01'
	,	id: function() {
			return this.idStr
		}

	// Add Point
	,	add_point: function(x,y,z,opts) {
			var mvStr = x + 'e_1 + ' + y + 'e_2 +' + z + 'e_3'
			var x3d = bs.multiVector(mvStr)
			var infScale = (x*x + y*y + z*z)/2
			var pCga = cga.n0.add( x3d ).add( cga.ni.smul(infScale) )
			var o = {color: cRed}
			if (opts && opts.color) {
				o.color = opts.color
			}

			pCga.parent = this
			pCga.options = o
			this.things.push(pCga)
			return pCga
		}

	// Render
	,	render: function() {
			var thing
			for (var i=0; i<this.things.length; ++i) {
				thing = this.things[i]
				var color = cRed
				if(thing.options && thing.options.color) {
					color = thing.options.color
				}
				thing.render({color: color})

			}
		}

	}

	th.forEach = function(aTh) {
		console.log('aTh: ')
		var a = 0
//		console.log('aTh: ' + aTh.id)
		}




	return th
}

var things = []
var thing = Thing()
things.push(thing)
thing.add_point(-2,0,1, {id:'red', color: cRed})
thing.add_point(1,-1,.5, {id:'blue', color: cBlue})

// the forEach function
var feT = function () {
	console.log('feT')
	//console.log(item.id)
}

// bind forEach()
things.forEach(element => {
	console.log('hello')
	console.log(element.id())
	}
)


thing.render()

feT()


/*
	var p1 = point(-2,0,1).render({color: cRed})
	,	p2 = point(1,-1,.5).render({color: cBlue})
	//,	p3 = point(1,1,2).render({color: cGreen})
	,	p3 = point(1,1,2).smul(2).render({color: cGreen})
	,	p4 = point(0,2,-0).render({color: cPink})
	,	c1 = p1.op(p2.op(p3)).render()
	,	s1 = c1.op(p4).render()
	,	s2 = c1.op(cga.ni).render()
*/


//=================================================================================================//
var bannerDiv = document.getElementById('banner_div')
bannerDiv.style.fontFamily = 'Courier New, Courier'
bannerDiv.style.position.absolute = true
bannerDiv.style.zIndex = 3
//bannerDiv.innerHTML = 'banner! Yey!' // bs.renderHtml()


var infoDiv = document.getElementById('info_div')
infoDiv.style.fontFamily = 'Courier New, Courier'
infoDiv.style.position.absolute = true
infoDiv.style.zIndex = 3
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
		// for each (var tng) in things

	}

	cemoCam.renderer.render( scene, camera )
}
animate()