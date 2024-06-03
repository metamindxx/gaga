var cemo = {
	addLineToScene: function (coords, mtrl, scene) {
		// alert('hello')
		console.log('hello')

		// coords [0] = start vector: [xStart, yStart, zStart]
		// coords [1] = end vector
		lStart = coords[0]
		lEnd = coords[1]

		var gLn = new THREE.Geometry();
		gLn.vertices.push(new THREE.Vector3( lStart[0], lStart[1], lStart[2]) );
		gLn.vertices.push(new THREE.Vector3( lEnd[0],   lEnd[1],   lEnd[2]) );

		var ln = new THREE.Line( gLn, mtrl );
		scene.add(ln);

		return ln
	}

,	addSphereToScene: function (coords, R, mtrl, scene) {
		var gSph = new THREE.SphereBufferGeometry( R, 50, 50);
		var mshSph = new THREE.Mesh(gSph, mtrl);
		mshSph.position.x = coords[0];
		mshSph.position.y = coords[1];
		mshSph.position.z = coords[2];
		scene.add(mshSph);
		return mshSph
	}

,	addConeToScene: function (coords, radius, length, rotation, mtrl, scene) {
		var gCne = new THREE.CylinderGeometry( 0, radius, length, 20, 1);		//(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
		var mshCne = new THREE.Mesh(gCne, mtrl);
		mshCne.position.x = coords[0];
		mshCne.position.y = coords[1];
		mshCne.position.z = coords[2];
		mshCne.rotation.x = rotation[0];
		mshCne.rotation.y = rotation[1];
		mshCne.rotation.z = rotation[2];
		scene.add(mshCne);
		return mshCne
	}
,	addVectorToScene: function (coords, mtrl, scene, clickParent, isDouble) {
		lStart = [0.0, 0.0, 0.0]
		lEnd   = [0.0, 1.0, 0.0]

		// ConeBufferGeometry(radius : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
		var cnHeight = 0.2
		var gCone = new THREE.ConeBufferGeometry(cnHeight / 4, cnHeight, 4)
		gCone.applyMatrix( new THREE.Matrix4().makeTranslation( 0, - cnHeight / 2, 0 ) );
		var mCone = new THREE.Mesh( gCone, mtrl )
		mCone.position.y = 1

		var gLn = new THREE.BufferGeometry();
		var verts = new Float32Array( [
			lStart[0], lStart[1], lStart[2]
		,	lEnd[0],   lEnd[1],   lEnd[2]
		])
		gLn.addAttribute( 'position', new THREE.BufferAttribute( verts, 3 ) )

		var mLine = new THREE.Line( gLn, mtrl );

		var group = new THREE.Group();
		group.add( mCone );
		group.add( mLine );
		mCone.clickParent = clickParent
		mLine.clickParent = clickParent

		if (isDouble) {
			var gCone2 = new THREE.ConeBufferGeometry(cnHeight / 4, cnHeight, 4)
			gCone2.applyMatrix( new THREE.Matrix4().makeTranslation( 0, - cnHeight / 2, 0 ) );
			var mCone2 = new THREE.Mesh( gCone2, mtrl )
			mCone2.position.y = 1-cnHeight*.6
			group.add(mCone2)
			mCone2.clickParent = clickParent
		}

		scene.add( group );

		group.position.x = coords[0][0]
		group.position.y = coords[0][1]
		group.position.z = coords[0][2]
		//lEnd   = coords[1]

		group.ceSetEndFromRoot = function(coords) {
			//group.scale = 2
			var vectorFromRoot = [
				coords[0] - this.position.x
			,	coords[1] - this.position.y
			,	coords[2] - this.position.z
			]
			var len = Math.pow(Math.pow(vectorFromRoot[0], 2) + Math.pow(vectorFromRoot[1], 2) + Math.pow(vectorFromRoot[2], 2), 0.5)
			this.scale.set(len, len, len)

			// https://stackoverflow.com/questions/52977759/three-js-how-to-find-out-xyz-rotations-between-two-vectors
			// the vector starts out pointing along the Y axis
			var myVector = new THREE.Vector3(0.0, 1.0, 0.0);
			var targetVector = new THREE.Vector3(vectorFromRoot[0], vectorFromRoot[1], vectorFromRoot[2]);

			// Normalize vectors to make sure they have a length of 1
			myVector.normalize()
			targetVector.normalize();

			// Create a quaternion, and apply starting, then ending vectors
			var quaternion = new THREE.Quaternion();
			quaternion.setFromUnitVectors(myVector, targetVector);

			// Quaternion now has rotation data within it.
			// We'll need to get it out with a THREE.Euler()
			var euler = new THREE.Euler();
			euler.setFromQuaternion(quaternion);

//			console.log(euler.toArray());

			this.rotation.x = euler.x
			this.rotation.y = euler.y
			this.rotation.z = euler.z
		}

//		lStart = coords[0]
//		lEnd   = coords[1]
		group.ceSetEndFromRoot(coords[1])

		return group
	}

,	addCylinderToScene: function (coords, Cyl_r, Cyl_l, rotation, mtrl, scene) {
		var gCyl = new THREE.CylinderGeometry(Cyl_r, Cyl_r, Cyl_l, 128, 20); //CylinderGeometry(radiusTop : Float, radiusBottom : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
		var mshCyl = new THREE.Mesh(gCyl, mtrl);
        //var cylinder_bsp = new ThreeBSP (mshCyl_o);
		//var gCyl_in = new THREE.CylinderGeometry(Cyl_in_r, Cyl_in_r, Cyl_l, 128, 20);
		//var mshCyl_in = new THREE.Mesh(gCyl_in, mtrl);
		//var cylinder_bsp_sub = new ThreeBSP (mshCyl_in);
	    //var mshCyl = cylinder_bsp.subtract( cylinder_bsp_sub );
		mshCyl.position.x = coords[0];
		mshCyl.position.y = coords[1];
		mshCyl.position.z = coords[2];
		mshCyl.rotation.x = rotation[0];
		mshCyl.rotation.y = rotation[1];
	    mshCyl.rotation.z = rotation[2];
		scene.add(mshCyl);
		return mshCyl
	}
,	addTorusToScene: function (coords, r, tor_r, rotation, mtrl, scene) {
		var gTor = new THREE.TorusGeometry(tor_r, r, 128, 96); //TorusGeometry(radius : Float, tube : Float, radialSegments : Integer, tubularSegments : Integer, arc : Float)
		var mshTor = new THREE.Mesh(gTor, mtrl);
		mshTor.position.x = coords[0];
		mshTor.position.y = coords[1];
		mshTor.position.z = coords[2];
		mshTor.rotation.x = rotation[0];
		mshTor.rotation.y = rotation[1];
	    mshTor.rotation.z = rotation[2];
		scene.add(mshTor);
		return mshTor
	}
,	addFieldLineToScene: function (magnets, mtrl, scene) {

		// Create a sine-like wave
		var curve = new THREE.SplineCurve( [
			new THREE.Vector2( -10, 0 ),
			new THREE.Vector2( 0, 0 ),
			new THREE.Vector2( 10, 0 ),
		] );

		var points = curve.getPoints( 50 );
		var geometry = new THREE.BufferGeometry().setFromPoints( points );

		var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

		// Create the final object to add to the scene
		var splineObject = new THREE.Line( geometry, material );
		scene.add(splineObject)

		curve = new THREE.SplineCurve( [
			new THREE.Vector2( -10, 1),
			new THREE.Vector2(   0, 0.1),
			new THREE.Vector2(  10, 1),
		] );
		points = curve.getPoints( 50 );
		geometry = new THREE.BufferGeometry().setFromPoints( points );
		splineObject = new THREE.Line( geometry, material );
		scene.add(splineObject)

		curve = new THREE.SplineCurve( [
			new THREE.Vector2( -10, -1),
			new THREE.Vector2(   0, -0.1),
			new THREE.Vector2(  10, -1),
		] );
		points = curve.getPoints( 50 );
		geometry = new THREE.BufferGeometry().setFromPoints( points );
		splineObject = new THREE.Line( geometry, material );
		scene.add(splineObject)

		curve = new THREE.SplineCurve( [
			new THREE.Vector2( -10, 2),
			new THREE.Vector2(   0, 0.2),
			new THREE.Vector2(  10, 2),
		] );
		points = curve.getPoints( 50 );
		geometry = new THREE.BufferGeometry().setFromPoints( points );
		splineObject = new THREE.Line( geometry, material );
		scene.add(splineObject)

		curve = new THREE.SplineCurve( [
			new THREE.Vector2( -10,   -2  ),
			new THREE.Vector2(   0,   -0.2),
			new THREE.Vector2(  10, -2  ),
		] );
		points = curve.getPoints( 50 );
		geometry = new THREE.BufferGeometry().setFromPoints( points );
		splineObject = new THREE.Line( geometry, material );
		scene.add(splineObject)



		mshTor = splineObject
		//scene.add(mshTor);
		return mshTor
	}

,	addThickCylinderToScene: function (coords, Cyl_r_in, Cyl_r_out, Cyl_len, rotation, mtrl, scene) {
/*		//CylinderGeometry(radiusTop : Float,
		                   radiusBottom : Float,
		                   height : Float,
		                   radialSegments :
		                   Integer, heightSegments :
		                   Integer, openEnded :
		                   Boolean, thetaStart : Float,
		                   thetaLength : Float) */
		mtrl.side = THREE.DoubleSide;

	    var groupMsh = new THREE.Group()
		var gCylInr, mshCylInr
		if (Cyl_r_in > 0) {
			gCylInr = new THREE.CylinderBufferGeometry(Cyl_r_in, Cyl_r_in, Cyl_len, 128, 20, true);
			mshCylInr = new THREE.Mesh(gCylInr, mtrl);
			groupMsh.add(mshCylInr)
		}


		var gCylOut = new THREE.CylinderBufferGeometry(Cyl_r_out, Cyl_r_out, Cyl_len, 128, 20, true);
		var mshCylOut = new THREE.Mesh(gCylOut, mtrl);

		// RingBufferGeometry(innerRadius : Float, outerRadius : Float, thetaSegments : Integer, phiSegments : Integer, thetaStart : Float, thetaLength : Float)
		var gTopRing = new THREE.RingBufferGeometry( Cyl_r_in, Cyl_r_out, 32 );
		var gBotRing = new THREE.RingBufferGeometry( Cyl_r_in, Cyl_r_out, 32 );

		var mshTopRing = new THREE.Mesh(gTopRing, mtrl);
		mshTopRing.rotation.x = Math.PI / 2;
		mshTopRing.position.y = Cyl_len / 2;

		var mshBotRing = new THREE.Mesh(gBotRing, mtrl);
		mshBotRing.rotation.x = Math.PI / 2;
		mshBotRing.position.y = - Cyl_len / 2;

        //var cylinder_bsp = new ThreeBSP (mshCyl_o);
		//var gCyl_in = new THREE.CylinderGeometry(Cyl_in_r, Cyl_in_r, Cyl_l, 128, 20);
		//var mshCyl_in = new THREE.Mesh(gCyl_in, mtrl);
		//var cylinder_bsp_sub = new ThreeBSP (mshCyl_in);
	    //var mshCyl = cylinder_bsp.subtract( cylinder_bsp_sub );
	    groupMsh.add(mshCylOut)
	    groupMsh.add(mshTopRing)
	    groupMsh.add(mshBotRing)


		groupMsh.position.x = coords[0];
		groupMsh.position.y = coords[1];
		groupMsh.position.z = coords[2];
		groupMsh.rotation.x = rotation[0];
		groupMsh.rotation.y = rotation[1];
	    groupMsh.rotation.z = rotation[2];

//		groupMsh.position.x = 2;
//		groupMsh.rotation.z = Math.PI / 2;

		scene.add(groupMsh);
		var ceCyl = {
			isA: 'ceCyl'
		,	mesh: groupMsh
		,	r_in: Cyl_r_in
		,	r_out: Cyl_r_out
		,	len: Cyl_len
		,	halfLen: Cyl_len / 2
		,	moveContainedParticle: function (position, velocity, dt) {
				// assumes cyl's axis is lying along x axis
				var contained = true
				if (!this.leftPos) {
					this.leftPos = this.mesh.position.x - this.halfLen
					this.rightPos = this.mesh.position.x + this.halfLen
				}

				// place it on the x axis
				if(position.x > this.leftPos && position.x < this.rightPos) {
					var deltaX = velocity[0] * dt
					var newX = position.x + deltaX
					if (newX < this.leftPos) {
						// moved past the left face -- bounce
						position.x = this.leftPos + (this.leftPos - newX)
						velocity[0] = -velocity[0]
					} else if (newX > this.rightPos) {
						// moved past the right face -- bounce
						position.x = this.rightPos - (newX - this.rightPos)
						velocity[0] = -velocity[0]
					} else {
						position.x = position.x + velocity[0] * dt
					}
				} else {
					contained = false
				}

				// place it on the radius
				var radius = Math.pow(Math.pow(position.y, 2) + Math.pow(position.z, 2), .5)
				if (radius >= this.r_in && radius < this.r_out) {
					var newY = position.y + velocity[1] * dt
					var newZ = position.z + velocity[2] * dt

					newRadius = Math.pow(Math.pow(newY, 2) + Math.pow(newZ, 2), .5)

					if(newRadius < this.r_in || newRadius > this.r_out) {
						// https://gamedev.stackexchange.com/questions/33384/how-to-bounce-a-2d-point-particle-off-of-a-circular-edge
						// new velocity v' = v - [2 (n � v) n]
						// n is the normal vector ~ position vector / radius
						// n . v is dot product
						nY = position.y / radius
						nZ = position.z / radius
						nDotV = nY * velocity[1] + nZ * velocity[2]
						velocity[1] = velocity[1] - 2 * nDotV * nY
						velocity[2] = velocity[2] - 2 * nDotV * nZ
						position.y = position.y + velocity[1] * dt
						position.z = position.z + velocity[2] * dt
					} else {
						position.y = position.y + velocity[1] * dt
						position.z = position.z + velocity[2] * dt
					}
				} else {
					contained = false
				}

				return contained
			}
		,	placeInside: function (mesh) {
				// assumes cyl's axis is lying along x axis
				mesh.position.x = this.mesh.position.x - this.halfLen + Math.random() * this.len
				var theta = Math.random() * 2 * Math.PI
				var r = this.r_in + Math.random() * (this.r_out - this.r_in)
				mesh.position.y = r * Math.cos(theta)
				mesh.position.z = r * Math.sin(theta)
			}
		}
		return ceCyl
	}


,	addAnodeToScene: function (r, mtrl, scene) {

		anodeMesh = cemo.addSphereToScene([0,0,0], r, mtrl, scene)

		var ceAnode = {
			isA: 'ceAnode'
		,	mesh: anodeMesh
		,	r: r
		,	moveContainedParticle: function (position, velocity, dt) {
				// move it, then bring it back to the radius of the anode
				var contained = true

				var newX = position.x + velocity[0] * dt
				var newY = position.y + velocity[1] * dt
				var newZ = position.z + velocity[2] * dt
				var newR = Math.pow(
							Math.pow(newX, 2) +
							Math.pow(newY, 2) +
							Math.pow(newZ, 2) ,0.5)
				var scale = this.r / newR
				position.x = newX * scale
				position.y = newY * scale
				position.z = newZ * scale

				return contained
			}
		,	placeInside: function (mesh) {
				// assumes cyl's axis is lying along x axis
				var theta = Math.random() * 2 * Math.PI
				var phi = Math.random() * 2 * Math.PI
				mesh.position.z = r * Math.sin(theta)
				var rCosTheta = r * Math.cos(theta)
				mesh.position.y = rCosTheta * Math.sin(phi)
				mesh.position.x = rCosTheta * Math.cos(phi)
			}
		}
		ceAnode.mesh.cemoParent = ceAnode
		return ceAnode
	}



,	addIon: function (posNeg, mtrl, scene) {
		//function (coords, R, mtrl, scene) {
		var ionRadius = .05
		var ion = {
			mesh: cemo.addSphereToScene([posNeg * 10, Math.random() - 0.5, Math.random() - 0.5], ionRadius, mtrl, scene)
		,	posNeg: posNeg
		}
		ion.update = function (t) {
			this.mesh.position.x = 10 * this.posNeg * Math.cos((this.tStart - t) / 500)
		}

		return ion
	}

,	addNutrl: function (posNeg, mtrl, scene) {
		//function (coords, R, mtrl, scene) {
		var ionRadius = .05
		var nutrl = {
			mesh: cemo.addSphereToScene([Math.random() - 0.5, -1, Math.random() - 0.5], ionRadius, mtrl, scene)
		}
		nutrl.update = function (t) {
			this.mesh.position.y += .02
		}

		return nutrl
	}

,	addBufferVertexBlobToScene: function (coords, r, mtrl, scene) {

			var numParticles = 1;

			var positions = new Float32Array( numParticles * 3 );
			var scales = new Float32Array( numParticles );

			positions[ 0 ] = 0; // x
			positions[ 1 ] = 0; // y
			positions[ 2 ] = 0; // z

			scales[ 0 ] = .1;

			var geometry = new THREE.BufferGeometry();
			geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
			geometry.addAttribute( 'scale', new THREE.BufferAttribute( scales, 1 ) );
			particles = new THREE.Points( geometry, mtrl );
			scene.add( particles );
			return (particles)
}

,	addEtron: function (coords, mtrl, scene) {
		//function (coords, R, mtrl, scene) {
		var etrnRadius = .03
		var velMultiplier = .1



		var etrn = {
			isA: 'etrn'
//		,	mesh: cemo.addSphereToScene(coords, etrnRadius, mtrl, scene)
		,	charge: -absCharge
		,	mesh: cemo.addBufferVertexBlobToScene(coords, etrnRadius, shaderMaterial_blue, scene)
//		,	mesh: dot
		,	v: [(.5 - Math.random()) * velMultiplier, (.5 - Math.random()) * velMultiplier, (.5 - Math.random()) * velMultiplier]
		,	f: [0.0,0.0,0.0]
//		,	posNeg: posNeg
		}

 		etrn.setContainer = function (container) {
 			this.container = container
 			container.placeInside(this.mesh)
 		}

 		etrn.zeroForceVector = function () {
 			this.f[0] = 0.0
			this.f[1] = 0.0
 			this.f[2] = 0.0
 		}

 		etrn.calculateForces = function (charges, myIndex) {
 			for (var i = myIndex+1; i < charges.length; ++i) {
 				this.calculateMutualForce(charges[i])
 			}
 		}

 		etrn.calculateMutualForce = function (otherParticle) {
			if (!gui.ceParams.updateEtrons) {
				if (otherParticle.isA == 'etrn') {
					return
				}
			}

			cemo.calculateMutualForce(this, otherParticle)
 		}

		etrn.update = function (dt) {
			if (!gui.ceParams.updateEtrons) {
				return
			}

			// update the velocity vector using the force vector
			var velocityCap = .02
			var maxAbsVi = 0
			var absVi = 0
			for (var i=0; i<3; ++i) {
				this.v[i] = this.v[i] + this.f[i] / mass

				// record the max speed in any one direction
				absVi = Math.abs(this.v[i])
				if (absVi > velocityCap) {
					if (absVi > maxAbsVi) {
						maxAbsVi = absVi
					}
				}
			}

			// cap the velocity at .2 abs on any axis. keep direction the same
			if (maxAbsVi != 0) {
				maxAbsVi = maxAbsVi / velocityCap
				for (var i=0; i<3; ++i) {
					this.v[i] = this.v[i] / maxAbsVi
				}
			}

			if (this.container) {
				if (this.container.moveContainedParticle(this.mesh.position, this.v, dt) == false) {
					this.container.placeInside(this.mesh)
				}
			} else {
				this.mesh.position.x = this.mesh.position.x + this.v[0] * dt
				this.mesh.position.y = this.mesh.position.y + this.v[1] * dt
				this.mesh.position.z = this.mesh.position.z + this.v[2] * dt
			}
		}

		return etrn
	}

,	addPosTron: function (coords, mtrl, scene) {
		//function (coords, R, mtrl, scene) {
		var postronRadius = .03
		var velMultiplier = .01

		var postron = {
			isA: 'postron'
//		,	mesh: cemo.addSphereToScene(coords, postronRadius, mtrlRed, scene)
		,	mesh: cemo.addBufferVertexBlobToScene(coords, postronRadius, mtrl, scene)
//		,	mesh: particles
		,	charge: absCharge
		,	v: [0,0,0]
		,	f: [0.0,0.0,0.0]
		,	selected: false
		}

		postron.mesh.cemoParent = postron

 		postron.setContainer = function (container) {
 			this.container = container
 			container.placeInside(this.mesh)
 		}

 		postron.zeroForceVector = function () {
 			this.f[0] = 0.0
			this.f[1] = 0.0
 			this.f[2] = 0.0
 		}

 		postron.calculateForces = function (charges, myIndex) {
 			for (var i = myIndex+1; i < charges.length; ++i) {
 				this.calculateMutualForce(charges[i])
 			}
 		}

 		postron.calculateMutualForce = function (otherParticle) {
			if (!gui.ceParams.updatePosTrons) {
				if (otherParticle.isA == 'postron') {
					return
				}
			}

			cemo.calculateMutualForce(this, otherParticle)
		}


		postron.update = function (dt) {
			if (!(
					(gui.ceParams.updatePosTrons && this.isA == 'postron')
				||	(gui.ceParams.updateIons && this.isA == 'ion'))) {
				return
			}
			if(this.showForce) {
				var a = 0 // handy for breakpoint
			}


			// update the velocity vector using the force vector
			var velocityCap = 0.1
			dims = 3
			if (this.isA == 'ion') {
				velocityCap = 100
				dt = .001
				dims = 1 // only move along x axis for ions
			}
			var maxAbsVi = 0
			var absVi = 0
			for (var i=0; i<dims; ++i) {
				this.v[i] = this.v[i] + this.f[i] / mass

				// record the max speed in any one direction
				absVi = Math.abs(this.v[i])
				if (absVi > velocityCap) {
					if (absVi > maxAbsVi) {
						maxAbsVi = absVi
					}
				}
			}

			// cap the velocity at .2 abs on any axis. keep direction the same
			if (maxAbsVi != 0) {
				maxAbsVi = maxAbsVi / velocityCap
				for (var i=0; i<3; ++i) {
					this.v[i] = this.v[i] / maxAbsVi
				}
			}

			if (this.container) {
				if (this.container.moveContainedParticle(this.mesh.position, this.v, dt) == false) {
					this.container.placeInside(this.mesh)
				}
			} else {
				this.mesh.position.x = this.mesh.position.x + this.v[0] * dt
				this.mesh.position.y = this.mesh.position.y + this.v[1] * dt
				this.mesh.position.z = this.mesh.position.z + this.v[2] * dt
			}

			if(this.showForce) {
				var vecStart = [this.mesh.position.x, this.mesh.position.y, this.mesh.position.z]
				var absForce = Math.pow(Math.pow(this.f[0], 2) + Math.pow(this.f[1], 2) + Math.pow(this.f[2], 2), 0.5)
				var vecEnd = []
				for (var i=0; i<3; ++i) {
					// vecEnd[i] = vecStart[i] + this.f[i] / absForce
					vecEnd[i] = vecStart[i] + this.f[i] * forceVectorScale
				}

				if (!this.forceVector) {
					this.forceVector = cemo.addVectorToScene([vecStart,vecEnd], mtrlRed, scene)
				} else {
					this.forceVector.position.x = this.mesh.position.x
					this.forceVector.position.y = this.mesh.position.y
					this.forceVector.position.z = this.mesh.position.z
					this.forceVector.ceSetEndFromRoot(vecEnd)

				}
			} else if (this.forceVector && this.forceVector.position.x < 1000) {
				// move the vecor off the screen
				this.forceVector.position.x = 1000
				this.forceVector.position.y = 0
				this.forceVector.position.z = 0
			}
		}

		return postron
	}
	,	calculateMutualForce: function (p1, p2) {
		var pos1 = p1.mesh.position
		var pos2 = p2.mesh.position
		var v3Distance = [
			(pos1.x - pos2.x) * distanceMultiplier,
			(pos1.y - pos2.y) * distanceMultiplier,
			(pos1.z - pos2.z) * distanceMultiplier]

		var distance_sq = Math.pow(v3Distance[0], 2) +
						  Math.pow(v3Distance[1], 2) +
						  Math.pow(v3Distance[2], 2)
		if (distance_sq < 0.000001) {
			distance_sq = 0.000001
			// v3Distance = [0.001, 0.001, 0.001]
		}
		var distance = Math.pow(distance_sq, 0.5)
		var f = p1.charge * p2.charge * by4PiE0 / distance_sq

		var v3F = [
			f * v3Distance[0] / distance,
			f * v3Distance[1] / distance,
			f * v3Distance[2] / distance]

		// add to the sum of forces on this particle
		p1.f[0] += v3F[0]
		p1.f[1] += v3F[1]
		p1.f[2] += v3F[2]

		// add to the sum of forces on the other particle
		p2.f[0] -= v3F[0]
		p2.f[1] -= v3F[1]
		p2.f[2] -= v3F[2]
	}
}



var cemoOptions = {
	distanceMultiplier: 1
,	chargeMultiplier: 1E13
,	absCharge: 1.6E-19 * this.chargeMultiplier
,	massMultiplier: 1E30
,	mass: 9.1E-31 * this.massMultiplier
,	ep0: 8.854E-12
,	qqBy4PiE0: this.charge * this.charge / (4 * Math.PI * this.ep0)
}
