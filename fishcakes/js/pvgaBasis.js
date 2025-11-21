// Projective VGA

var pvgaBasis = function(scene) {
	var PVGA = {
		isA: 'pvgaBasis'
	,	bs: null		// basisSet
	,	scene: scene
	,	opt: {}

	,	pt: function (x,y,z) {
			var mv = this.bs.multiVector('1e_p + ' + x + 'e_x + ' + y + 'e_y + ' + z + 'e_z')
			mv.bs = this.bs
			mv.algebra = this
			return mv

			/*
			var pt = {
				isA: 'pt'
			,	mv: this.bs.multiVector('1e_p + ' + x + 'e_x + ' + y + 'e_y + ' + z + 'e_z')
			}
			pt.strLog = function(args) { pt.mv.strLog(args) }
			return pt
			*/
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
			var p = mv.basisSVal('e_p')
			return {x: mv.basisSVal('e_x')/p, y: mv.basisSVal('e_y')/p, z:mv.basisSVal('e_z')/p}
		}
	,	renderMV: function (mv, options) {
			// set some defaults
			if (options) { Object.keys(options).forEach(k=> mv.opt[k] = options[k]) }
			if (!mv.opt.color) { mv.opt.color =  0x333333 }

			// what type of object
			if (mv.grade() == 3) {
				// Find the plane of the circle by wedging with ni
				// this is the pseudoscalar I for the circle
				var Ic = mv.op(cga.ni)

				// we want Ic to be the unit plane so find its size
				var IcSize = Math.pow( Math.abs(Ic.sq()) , 0.5)

				// Bring Ic down to (unit) size
				Ic = Ic.smul(1/IcSize)

				// take the dual of the circle wrt its plane Ic
				var circ_dual = mv.gp(Ic)

				// normalise so C*.ni = -1
				var cdDotNi = circ_dual.scalarProduct(cga.ni)
				circ_dual = circ_dual.smul(-1/cdDotNi)

				// centre
				var cent = circ_dual.gp(circ_dual.gp(cga.ni).smul(0.5).sadd(1))
				cent.opt.size = .02
				cent.render()

				// radius of circle
				var rad = Math.pow(circ_dual.sq(), 0.5)

				var Icd = cga.I5.gp(Ic)
				,	nx = Icd.bVal('e_1')
				,	ny = Icd.bVal('e_2')
				,	nz = Icd.bVal('e_3')
//				,	nd = d
				,	mag = Math.pow(nx*nx + ny*ny + nz*nz, 1/2)

				// normalize
				nx = nx/mag
				ny = ny/mag
				nz = nz/mag
//				nd = nd/mag

				var xyz = this.pointXYZ(cent)

				if (this.material == undefined) {
					this.material = new THREE.LineBasicMaterial( { color: 0x0000ff } )
				}
				if (this.geometry == undefined) {
					// this.geometry = new THREE.SphereGeometry(.1,.1,.1)
					this.geometry = new THREE.CircleGeometry( rad, 64 );
					// Remove center vertex
					this.geometry.vertices.shift();
				}
				if (this.mesh == undefined) {
					this.mesh = new THREE.LineLoop( this.geometry, this.material )
					scene.add( this.mesh )
				}

				this.geometry.lookAt(new THREE.Vector3(nx,ny,nz))
//				this.geometry.translate(xyz.x, xyz.y, xyz.z)

				this.mesh.position.x = xyz.x
				this.mesh.position.y = xyz.y
				this.mesh.position.z = xyz.z

			} else if (mv.grade() == 4) {

				var isPlane = false
				var sphD = cga.I5.gp(mv)  // dual sph in I5
			//	var ss = sphD.sq()
				var sphDN = Math.abs(sphD.scalarProduct(cga.ni))  // sphD . ni = -1   <<-- normalise condition

				if (sphDN > 0.0001) {
					sphD = sphD.smul(1/sphDN)
					var rad = Math.pow(sphD.sq(), .5)
				} else {
					isPlane = true
				}

				if (!isPlane || rad > 1000) {
					// sphere
					var centre = sphD.gp(cga.ni.gp(sphD))
					console.log(centre.strLog('centre: ' + centre))
					console.log('Radius: ' + rad)
					centre.render()

					if (this.sphMat == undefined) {
						this.sphMat = new THREE.MeshPhongMaterial( { color: 0xff00ff, emissive: 0x111111, opacity: 0.5, transparent: true} );
					}
					if (this.sphGeom == undefined) {
						// this.geometry = new THREE.SphereGeometry(.1,.1,.1)
						this.sphGeom = new THREE.SphereBufferGeometry( rad, 50, 50);
					}
					if (this.sphMesh == undefined) {
						this.sphMesh = new THREE.Mesh ( this.sphGeom, this.sphMat )
						scene.add( this.sphMesh )
					}

					//var xyz = centre.xyz()
					var xyz = this.pointXYZ(centre)
					this.sphMesh.position.x = xyz.x;
					this.sphMesh.position.y = xyz.y;
					this.sphMesh.position.z = xyz.z;
				} else {
					// plane
					var phiMag = Math.pow(-mv.sq(), 0.5)
					var phi = mv.smul(1/phiMag) // normalise
					console.log('phiMag: ' + phiMag)
					var phiD = cga.I5.gp(phi)
					var d = (phiD.scalarProduct(cga.n0))
					console.log('d: ' + d)
					var nHat = phiD.sub(cga.ni.smul(d))
					nHat.strLog('nHat: ')
					//var sphDN = -sphD.dot(cg.ni).d[0]
					//sphD = sphD.smul(1/sphDN)

					var nx = nHat.bVal('e_1')
					,	ny = nHat.bVal('e_2')
					,	nz = nHat.bVal('e_3')
					,	nd = d
					,	mag = Math.pow(nx*nx + ny*ny + nz*nz, 1/2)

					// normalize
					nx = nx/mag
					ny = ny/mag
					nz = nz/mag
					nd = nd/mag

					if (this.plMat == undefined) {
						this.plMat = new THREE.MeshStandardMaterial( {color: 0xffff00, emissive: 0x111111, side: THREE.DoubleSide} );
					}
					if (this.plGeom == undefined) {
						this.plGeom = new THREE.PlaneBufferGeometry( 1*mag, 1*mag );
					}
					if (this.planeMesh == undefined) {
						this.planeMesh = new THREE.Mesh ( this.plGeom, this.plMat )
						scene.add( this.planeMesh )
					}
					this.plGeom.lookAt(new THREE.Vector3(nx,ny,nz))
					this.plGeom.translate(-nx*nd, -ny*nd, -nz*nd)
				}




			// Point
			} else if (mv.grade() == 1) {
				if (!mv.opt.size) { mv.opt.size = .1 }

				var xyz = this.pointXYZ(mv)

				// render
				if (mv.renderStuff == null) {
					mv.renderStuff = {}
					var rs = mv.renderStuff
					rs.geomOut = new THREE.SphereGeometry(mv.opt.size, 9, 9)
					rs.matOut = new THREE.MeshStandardMaterial( {color: mv.opt.color, opacity: 0.6, emissive: 0x111111, side: THREE.DoubleSide} )
					rs.meshOut = new THREE.Mesh ( rs.geomOut, rs.matOut )

					scene.add( rs.meshOut )

					rs.meshOut.clickParent = mv
				}

				mv.renderStuff.meshOut.position.set(xyz.x, xyz.y, xyz.z)
			}

			if (options && options.renderComponents && mv.components) {
				var comp
				for (var i=0; i<mv.components.length; ++i) {
					mv.components[i].render(options)
				}
			}


		}
	}

	PVGA.bs = basisSet()
	PVGA.bs.addBasis('p', 0)
	PVGA.bs.addBasis('x', 1)
	PVGA.bs.addBasis('y', 1)
	PVGA.bs.addBasis('z', 1)

	//CGA.n0 =  bs.multiVector('0.5e_m - 0.5e_p')
	//CGA.ni = bs.multiVector('  1e_m +   1e_p')
	//CGA.I5 = bs.multiVector('1e_123pm')
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
	PVGA.bs.createCayley()
	PVGA.bs.interpretation = PVGA

	return PVGA
}



