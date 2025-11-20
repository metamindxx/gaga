var mcgaBasis = function(scene) {
	var MCGA = {
		isA: 'mcgaBasis'
	,	bs: null		// basisSet
	,	scene: scene
	,	opt: {}

	,	pt: function (t,x,y,z) {
		return bs.multiVector(t + 'e_0 ' + x + 'e_1 ' + y + 'e_2 ' + z + 'e_3')
	}

	,	mcgaXYZfrom4Bivec: function(mv) {
			return {x: mv.bVal('e_10'), y: mv.bVal('e_20'), z: mv.bVal('e_30') }
		}

	,	mcgaTXY: function(mv) {
			var ne01 = mv.bVal('e_01')
			var ne20 = -mv.bVal('e_02')
			var ne12 = mv.bVal('e_12')

			var res = {
				magSq: -ne01*ne01 - ne20*ne20 + ne12*ne12
			}
			if (res.magSq >= 0) {
				res.isProper = true
				res.mag = Math.pow(res.magSq, 1/2)
			} else {
				res.isProper = false
				res.mag = Math.pow(-res.magSq, 1/2)
			}

			// normalize "p" for point on hyperbola
			res.px = ne20/res.mag
			res.pz = ne01/res.mag
			res.pd = ne12/res.mag

			// h is for hyperbolic disk
			res.hx = res.px / res.pd
			res.hz = res.pz / res.pd

			return res
		}


	,	renderMV: function (mv, options) {
			// set some defaults
			if (options) { Object.keys(options).forEach(k=> mv.opt[k] = options[k]) }
			if (!mv.opt.color) { mv.opt.color =  0x333333 }

			// what type of object
			if (mv.grade() == 1) {
				if (!mv.opt.size) { mv.opt.size = .5 }

					//** render plane
					var nex = mv.basisSVal('e_x')
					var ney = mv.basisSVal('e_y')
					var net = mv.basisSVal('e_t')
					var mag = Math.pow(Math.abs(nex*nex + ney*ney - net*net), 1/2)

					// normalize
					nex = nex/mag
					ney = ney/mag
					net = net/mag

					// front
					var gCircFront = new THREE.CircleGeometry( mv.opt.size, 32 );
					var mFront = new THREE.MeshStandardMaterial( {color: mv.opt.color, opacity: 0.4, emissive: 0x111111, side: THREE.DoubleSide} );
					var mshCircFront = new THREE.Mesh( gCircFront, mFront );
					// back
					var gCircBack = new THREE.CircleGeometry( mv.opt.size * .8, 32 );
					var mBack = new THREE.MeshStandardMaterial( {color: mv.opt.color, opacity: 0.6, emissive: 0x111111, side: THREE.BackSide} );
					//var mBack = new THREE.MeshStandardMaterial( {color: mv.opt.color, wireframe: true} )
					var mshCircBack = new THREE.Mesh( gCircBack, mBack );
					mshCircBack.position.set(0,0,-.001)

					var group = new THREE.Group();
					group.add( mshCircFront );
					group.add( mshCircBack );
					mshCircFront.clickParent = mv

					// need to translate first since it uses object coordinates...
					// group.translateOnAxis(theAxis, nd)
					group.lookAt(new THREE.Vector3(nex, ney, net))
					scene.add( group );

					// projective line
					const points = [];
					points.push( new THREE.Vector3( -ney, nex, 0 ) );
					points.push( new THREE.Vector3( ney, -nex, 0 ) );
					const lineMaterial = new THREE.LineBasicMaterial( { color: mv.opt.color } );
					const geometry = new THREE.BufferGeometry().setFromPoints( points );
					const line = new THREE.Line( geometry, material );
					line.position.set(-nex*net, -ney*net, 1)
					scene.add( line );

			} else if (mv.grade() == 2) {
				if (!mv.opt.size) { mv.opt.size = .02 }

				if (mv.opt.as = "xyzFrom4Bivec") {
					var xyz = this.mcgaXYZfrom4Bivec(mv)
					//var xyz1 = {x: 0, y: 0, z: xyz0.z}
					cemo.addVectorToScene([[0, 0, xyz.z],[xyz.x, xyz.y, xyz.z]], new THREE.MeshBasicMaterial( { color: mv.opt.color }), scene, mv)
				
				}


			// Point
			} else if (mv.grade() == 3) {
			}

			if (options && options.renderComponents && mv.components) {
				var comp
				for (var i=0; i<mv.components.length; ++i) {
					mv.components[i].render(options)
				}
			}


		}
	}

	MCGA.bs = bs
	
	bs.addBasis('x', +1)
	bs.addBasis('y', +1)
	bs.addBasis('z', +1)
	bs.addBasis('p', +1)
	bs.addBasis('m', -1)

	MCGA.n0 =  bs.multiVector('0.5e_m - 0.5e_p')
	MCGA.ni = bs.multiVector('  1e_m +   1e_p')
	MCGA.I5 = bs.multiVector('1e_xyzpm')
	
	/*
	// gradeOrder?
	bs.bladeOrder = ['e_',
					 'e_0',   'e_1',   'e_2',   'e_3',
							  'e_01',  'e_02',  'e_03',
							  'e_23',  'e_13',  'e_12',
					 'e_123', 'e_013', 'e_023', 'e_012',
					 'e0123'
					 ]
	*/

	// create the cayley table with a symmetric dual
	MCGA.bs.createCayley()
	MCGA.bs.interpretation = MCGA

	return MCGA
}



