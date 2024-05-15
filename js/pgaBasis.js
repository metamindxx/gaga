var pgaBasis = function(scene) {
	var PB = {
		isA: 'pgaBasis'
	,	bs: null		// basisSet
	,	scene: scene
	,	opt: {}

	,	pt: function (x,y,z) {
			var mvResult = bs.multiVector('')
			mvResult.pushBlade( bs.newBlade(-1, bs.e123) )
			if (x) {
				mvResult.pushBlade(bs.newBlade(x, bs.e023))
			}
			if (y) {
				mvResult.pushBlade(bs.newBlade(-y, bs.e013))
			}
			if (z) {
				mvResult.pushBlade(bs.newBlade(z, bs.e012))
			}
			return mvResult
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
				// z,y,x,1 == d[11], d[12], d[13], d[14]
				var ex = - mv.basisSVal('e_023')
				,	ey =   mv.basisSVal('e_013')
				,	ez = - mv.basisSVal('e_012')
				var i0 =   mv.basisSVal('e_123')

				//i0 = Math.pow(ex*ex + ey*ey + ez*ez, 0.5)
				return {x: ex/i0, y: ey/i0, z: ez/i0}
		}

	,	renderMV: function (mv, options) {
			// set some defaults
			if (options) { Object.keys(options).forEach(k=> mv.opt[k] = options[k]) }
			if (!mv.opt.color) { mv.opt.color =  0x333333 }

			// what type of object
			if (mv.grade() == 1) {
				if (!mv.opt.size) { mv.opt.size = .5 }

				//** render plane
				var nx = mv.basisSVal('e_1')
				var ny = mv.basisSVal('e_2')
				var nz = mv.basisSVal('e_3')
				var nd = mv.basisSVal('e_0')
				var mag = Math.pow(nx*nx + ny*ny + nz*nz, 1/2)

				// normalize
				nx = nx/mag
				ny = ny/mag
				nz = nz/mag
				nd = -nd/mag

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

				// need to translate first since it uses object coordinates...
				// group.translateOnAxis(theAxis, nd)
				group.lookAt(new THREE.Vector3(nx, ny, nz))
				group.position.set(nx*nd, ny*nd, nz*nd)
				scene.add( group );


			} else if (mv.grade() == 2) {
				//** render line
				if (mv.components) {
					var p0 = mv.components[0]
					var xyz0 = this.pointXYZ(p0)
					var p1 = mv.components[1]
					var xyz1 = this.pointXYZ(p1)
					cemo.addVectorToScene([[xyz0.x, xyz0.y, xyz0.z],[xyz1.x, xyz1.y, xyz1.z]], new THREE.MeshBasicMaterial( { color: mv.opt.color }), scene)
				} else {
					// e for euclidian - direction of line
					var ex =   mv.basisSVal('e_23')
					,	ey = - mv.basisSVal('e_13')
					,	ez =   mv.basisSVal('e_12')
					var mag = Math.pow(ex*ex + ey*ey + ez*ez, 1/2)
					ex = ex/mag
					ey = ey/mag
					ez = ez/mag

					// i for infinite - moment of line
					var ix = mv.basisSVal('e_01') / mag
					,	iy = mv.basisSVal('e_02') / mag
					,	iz = mv.basisSVal('e_03') / mag

					// take the cross product (shh!) to rotate the moment line around the direction line.
					// the moment line is the correct length and now lies in the plane of the moment's rotation perp to the direction
					// ie, this is the translation
					var crossX =  ey*iz - iy*ez
					,	crossY =  ez*ix - iz*ex
					,	crossZ =  ex*iy - ix*ey

					cemo.addVectorToScene([[crossX, crossY, crossZ],[crossX + ex, crossY + ey, crossZ + ez]], new THREE.MeshBasicMaterial( { color: mv.opt.color }), scene)
				}
			} else if (mv.grade() == 3) {
				if (!mv.opt.size) { mv.opt.size = .1 }

				// z,y,x,1 == d[11], d[12], d[13], d[14]
				var xyz = this.pointXYZ(mv)
				var i0 =   mv.basisSVal('e_123')

				// outside
				var gSphOut = new THREE.SphereGeometry(mv.opt.size, 9, 9)
				,	mOut = new THREE.MeshStandardMaterial( {color: mv.opt.color, opacity: 0.6, emissive: 0x111111} )
				,	mshSphOut = new THREE.Mesh ( gSphOut, mOut )

				// inside
				var insideSize = (1 + (Math.sign(i0) * -0.1) ) * mv.opt.size  // +- 10% of outside size
				//var insideSize = 1.2 * mv.opt.size  // +- 20% of outside size
				var gSphIn = new THREE.SphereGeometry(insideSize, 5, 5)
				,	mIn = new THREE.MeshStandardMaterial( {color: mv.opt.color, wireframe: true} )
				,	mshSphIn = new THREE.Mesh ( gSphIn, mIn )

				var group = new THREE.Group();
				group.add( mshSphOut );
				group.add( mshSphIn );
				scene.add( group )

				// is ideal point?
				if (Math.abs(i0) < .001) {
					// put the point a distance of 1 away from the origin and put an arrow pointing to infinity
					i0 = Math.pow(ex*ex + ey*ey + ez*ez, 0.5)
					ex = ex/i0
					ey = ey/i0
					ez = ez/i0
					i0 = 1
					cemo.addVectorToScene([[xyz.x, xyz.y, xyz.z],[2*xyz.x, 2*xyz.y, 2*xyz.z]], new THREE.MeshBasicMaterial( { color: mv.opt.color }), scene)
				}

				group.position.set(xyz.x, xyz.y, xyz.z)
			}



		}
	}

	PB.bs = bs
	bs.addBasis('0', 0)
	bs.addBasis('1', +1)
	bs.addBasis('2', +1)
	bs.addBasis('3', +1)

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
	PB.bs.createCayley()
	PB.bs.interpretation = PB

	// copy the ganja dual map
	bs.setDual(bs.e, bs.e0123, 1)

	bs.setDual(bs.e0, bs.e123, 1)
	bs.setDual(bs.e1, bs.e023, -1)
	bs.setDual(bs.e2, bs.e013, 1)
	bs.setDual(bs.e3, bs.e012, -1) 

	bs.setDual(bs.e01, bs.e23, 1)
	bs.setDual(bs.e02, bs.e13, -1)
	bs.setDual(bs.e03, bs.e12, 1)
	bs.setDual(bs.e12, bs.e03, 1)
	bs.setDual(bs.e13, bs.e02, -1)
	bs.setDual(bs.e23, bs.e01, 1)

	bs.setDual(bs.e012, bs.e3, -1)
	bs.setDual(bs.e013, bs.e2, 1)
	bs.setDual(bs.e023, bs.e1, -1)
	bs.setDual(bs.e123, bs.e0, 1)

	bs.setDual(bs.e0123, bs.e, 1)

	return PB
}



