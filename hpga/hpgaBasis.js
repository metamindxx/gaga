var hpgaBasis = function(scene) {
	var HPGA = {
		isA: 'hpgaBasis'
	,	bs: null		// basisSet
	,	scene: scene
	,	opt: {}

	,	pt: function (x,y,z) {
			return bs.multiVector(x + 'e_1 ' + y + 'e_2 ' + z + 'e_3')
		}

		// from page 14 of Normalization__Square_roots_and_the_Exponential_map_in_Clifford_Algebras_less_than_6D.pdf
		// pga specific
		/*
	,	normalizeRotor: function (r) {
			var e = r.bVal('e_')
			var e10 = r.bVal('e_01')
			var e20 = r.bVal('e_02')
			var e30 = r.bVal('e_03')
			var e12 = r.bVal('e_12')
			var e23 = r.bVal('e_23')
			var e13 = r.bVal('e_13')
			var e1230 = r.bVal('e_0123')
			var A = 1/Math.pow( (e*e + e12*e12 + e23*e23 + e13*e13), .5 )
			var B = (e0123*e - e01*e23 - e02*e13 - e03*e12) *A*A*A
			var mvResult = this.bs.multiVector('')
			mvResult.pushBlade(bs.newBlade(A*e, bs.e))
			mvResult.pushBlade(bs.newBlade(A*e10 + B*e23, bs.e10))
			mvResult.pushBlade(bs.newBlade(A*e20 + B*e13, bs.e20))
			mvResult.pushBlade(bs.newBlade(A*e30 + B*e12, bs.e30))
			mvResult.pushBlade(bs.newBlade(A*e12, bs.e12))
			mvResult.pushBlade(bs.newBlade(A*e23, bs.e23))
			mvResult.pushBlade(bs.newBlade(A*e13, bs.e13))
			mvResult.pushBlade(bs.newBlade(A*e1230 - B*e, bs.e1230))
			return mvResult
		}*/

	, 	pointXYZ: function(mv) {
				return {x: mv.basisSVal('e_1')
					  , y: mv.basisSVal('e_2')
					  , z: mv.basisSVal('e_3')}
		}

	,	renderMV: function (mv, options) {
			// set some defaults
			if (options) { Object.keys(options).forEach(k=> mv.opt[k] = options[k]) }
			if (!mv.opt.color) { mv.opt.color =  0x333333 }

			// what type of object
			if (mv.grade() == 1) {
				if (!mv.opt.size) { mv.opt.size = .5 }

					//** render plane
					var ne1 = mv.basisSVal('e_1')
					var ne2 = mv.basisSVal('e_2')
					var ne0 = mv.basisSVal('e_0')
					var mag = Math.pow(ne1*ne1 + ne2*ne2 - ne0*ne0, 1/2)

					// normalize
					ne1 = ne1/mag
					ne2 = ne2/mag
					ne0 = ne0/mag

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
					group.lookAt(new THREE.Vector3(ne1, ne0, ne2))
					scene.add( group );

					// perp line is dual
					var perpLine = mv.gp(pss).strLog('un normalised: ').normalize().strLog('normalised: ')
					console.log('norm sq: ' + perpLine.normSq())
					//.normalize().strLog('normalised: ')//.render({color: 0xff0000})
					var firstPlane = perpLine.join(origin)//.render({color: 0x0000ff})					
					var firstPoint = firstPlane.gp(mv).render({color: 0x0000ff})

					var points = []
					var rotors = []
					var pt, rotor
					for (i=-1; i<1;i+=.1)  {
						rotor = perpLine.exp(i)
						pt = rotor.gp( firstPoint.gp(rotor.reverse() )).normalize()
						rotors.push(rotor)
						points.push(pt.strLog('pt ' + i + ': ').render({color: 0x00ffff}))
					}

					var a = 3





			} else if (mv.grade() == 2) {
				if (!mv.opt.size) { mv.opt.size = .03 }
				var ne01 = mv.bVal('e_01')
				var ne20 = -mv.bVal('e_02')
				var ne12 = mv.bVal('e_12')
				var magSq = -ne01*ne01 - ne20*ne20 + ne12*ne12
				if (magSq > 0) {
					var mag = Math.pow(magSq, 1/2)

					// normalize
					ne01 = ne01/mag
					ne20 = ne20/mag
					ne12 = ne12/mag

					// on the sheet
					geomSheet = new THREE.SphereGeometry(mv.opt.size, 9, 9)
					matSheet = new THREE.MeshStandardMaterial( {color: mv.opt.color, opacity: 0.6, emissive: 0x111111, side: THREE.DoubleSide} )
					meshSheet = new THREE.Mesh ( geomSheet, matSheet )
					meshSheet.position.set(ne01, ne12, ne20)
					scene.add( meshSheet );

					// line
					var pts = []
					pts.push(new THREE.Vector3(0, 0, 0))
					pts.push(new THREE.Vector3(ne01, ne12, ne20))
					
					const lineGeom = new THREE.BufferGeometry().setFromPoints( pts );
					const lineMat = new THREE.LineBasicMaterial( { color: 0xff0000 } );
					const line = new THREE.Line( lineGeom, lineMat );
					scene.add(line)

					// on h2
					ne01 = ne01/ne12
					ne20 = ne20/ne12
					geomH2 = new THREE.SphereGeometry(mv.opt.size, 9, 9)
					matH2 = new THREE.MeshStandardMaterial( {color: mv.opt.color, opacity: 0.6, emissive: 0x111111, side: THREE.DoubleSide} )
					meshH2 = new THREE.Mesh ( geomH2, matH2 )
					meshH2.position.set(ne01, 1, ne20)
					scene.add( meshH2 );
			} else {
					var mag = Math.pow(-magSq, 1/2)

					// normalize
					ne01 = ne01/mag
					ne20 = ne20/mag
					ne12 = ne12/mag
				// line
					var pts = []
					pts.push(new THREE.Vector3(0, 0, 0))
					pts.push(new THREE.Vector3(ne20, -ne12, ne01))
					
					const lineGeom = new THREE.BufferGeometry().setFromPoints( pts );
					const lineMat = new THREE.LineBasicMaterial( { color: 0xff0000 } );
					const line = new THREE.Line( lineGeom, lineMat );
					scene.add(line)
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

	HPGA.bs = bs
	bs.addBasis('0', -1)
	bs.addBasis('1', +1)
	bs.addBasis('2', +1)


	bs.setDual(bs.e, bs.e012, 1)

	bs.setDual(bs.e0, bs.e12, 1)
	bs.setDual(bs.e1, bs.e02, -1)
	bs.setDual(bs.e2, bs.e01, 1)

	bs.setDual(bs.e01, bs.e2, 1)
	bs.setDual(bs.e02, bs.e1, -1)
	bs.setDual(bs.e12, bs.e0, 1)

	bs.setDual(bs.e012, bs.e, 1)

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
	HPGA.bs.createCayley()
	HPGA.bs.interpretation = HPGA

	return HPGA
}



