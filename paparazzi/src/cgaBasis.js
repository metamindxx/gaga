import * as THREE from "three";
import { createBasisSet } from "./basisSet.js";

// eslint-disable-next-line no-unused-vars
const UNIT_Z = new THREE.Vector3(0, 0, 1);

export function createCgaBasis(scene, { basisSet } = {}) {
  const bs = basisSet ?? createBasisSet();
  const cga = {
    isA: "cgaBasis",
    bs: null, // basisSet
    scene: scene,
    opt: {},

    pt: function (x, y, z) {
      return bs.multiVector({ e_1: x, e_2: y, e_3: z });
    },

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

    pointXYZ: function (mv) {
      // https://clifford.readthedocs.io/en/latest/tutorials/cga/index.html
      // normalize
      // Xn = X / (X . ni)
      // since X and ni are both vectors, their dot will produce a scalar so next line is not needed
      // // Xn = X (X . ni) / (X . ni)^2
      // Then just read off the xyz coords
      var XScalarNi = -mv.scalarProduct(cga.ni);
      //			var XdotNiSq = XdotNi.sq()
      //			var Xn = this.gp(XdotNi) // X (X . ni)
      //			Xn = Xn.smul(1/XdotNiSq)

      // 2022-11-07 - in fact, we don't need to divide everything by the multiple,
      // since we are chucking away the ep and em bits, we can just divide the xi's
      // var Xn = this.smul(1/XdotNi)
      // return {x: -Xn.d[1], y: -Xn.d[2], z:-Xn.d[3]}
      return {
        x: mv.basisSVal("e_1") / XScalarNi,
        y: mv.basisSVal("e_2") / XScalarNi,
        z: mv.basisSVal("e_3") / XScalarNi,
      };
    },
    renderMV: function (mv, options) {
      // set some defaults
      if (options) {
        Object.keys(options).forEach((k) => (mv.opt[k] = options[k]));
      }
      if (!mv.opt.color) {
        mv.opt.color = 0x333333;
      }

      // what type of object
      if (mv.grade() == 3) {
        // Find the plane of the circle by wedging with ni
        // this is the pseudoscalar I for the circle
        var Ic = mv.op(cga.ni);

        // we want Ic to be the unit plane so find its size
        var IcSize = Math.pow(Math.abs(Ic.sq()), 0.5);

        // Bring Ic down to (unit) size
        Ic = Ic.smul(1 / IcSize);

        // take the dual of the circle wrt its plane Ic
        var circ_dual = mv.gp(Ic);

        // normalise so C*.ni = -1
        var cdDotNi = circ_dual.scalarProduct(cga.ni);
        circ_dual = circ_dual.smul(-1 / cdDotNi);

        // centre
        var cent = circ_dual.gp(circ_dual.gp(cga.ni).smul(0.5).sadd(1));
        cent.opt.size = 0.02;
        cent.render();

        // radius of circle
        var rad = Math.pow(circ_dual.sq(), 0.5);

        var Icd = cga.I5.gp(Ic),
          nx = Icd.bVal("e_1"),
          ny = Icd.bVal("e_2"),
          nz = Icd.bVal("e_3"),
          //				,	nd = d
          mag = Math.pow(nx * nx + ny * ny + nz * nz, 1 / 2);

        // normalize
        nx = nx / mag;
        ny = ny / mag;
        nz = nz / mag;
        //				nd = nd/mag

        var normal = new THREE.Vector3(nx, ny, nz);
        var xyz = this.pointXYZ(cent);

        if (this.material === undefined) {
          this.material = new THREE.LineBasicMaterial({ color: 0x0000ff });
        }
        if (this.geometry === undefined) {
          // function buildUnitCircleGeometry(segments = DEFAULT_CIRCLE_SEGMENTS) {
          //   const path = new THREE.Path();
          //   path.absarc(0, 0, 1, 0, Math.PI * 2, false);
          //   const vectors = path.getSpacedPoints(segments).map((pt) => {
          //     return new THREE.Vector3(pt.x, pt.y, 0);
          //   });
          //   return new THREE.BufferGeometry().setFromPoints(vectors);
          // }
          // this.geometry = buildUnitCircleGeometry();

          // this.geometry = new THREE.SphereGeometry(.1,.1,.1)
          this.geometry = new THREE.CircleGeometry(rad, 64);
          console.log(this.geometry);
          // Remove center vertex
          // TODO: delete center vertex properly
          // this.geometry.vertices.shift();
        }
        if (this.mesh === undefined) {
          this.mesh = new THREE.LineLoop(this.geometry, this.material);
          scene.add(this.mesh);
        }

        this.geometry.lookAt(normal);
        this.mesh.position.set(xyz.x, xyz.y, xyz.z);
      } else if (mv.grade() == 4) {
        var isPlane = false;
        var sphD = cga.I5.gp(mv); // dual sph in I5
        //	var ss = sphD.sq()
        var sphDN = Math.abs(sphD.scalarProduct(cga.ni)); // sphD . ni = -1   <<-- normalise condition

        if (sphDN > 0.0001) {
          sphD = sphD.smul(1 / sphDN);
          rad = Math.pow(sphD.sq(), 0.5);
        } else {
          isPlane = true;
        }

        if (!isPlane || rad > 1000) {
          // sphere
          var centre = sphD.gp(cga.ni.gp(sphD));
          console.log(centre.strLog("centre: " + centre));
          console.log("Radius: " + rad);
          centre.render();

          if (this.sphMat == undefined) {
            this.sphMat = new THREE.MeshPhongMaterial({
              color: 0xff00ff,
              emissive: 0x111111,
              opacity: 0.5,
              transparent: true,
            });
          }
          if (this.sphGeom == undefined) {
            this.sphGeom = new THREE.SphereGeometry(rad, 50, 50);
          }
          if (this.sphMesh == undefined) {
            this.sphMesh = new THREE.Mesh(this.sphGeom, this.sphMat);
            scene.add(this.sphMesh);
          }

          // xyz = centre.xyz()
          xyz = this.pointXYZ(centre);
          this.sphMesh.position.x = xyz.x;
          this.sphMesh.position.y = xyz.y;
          this.sphMesh.position.z = xyz.z;
        } else {
          // plane
          var phiMag = Math.pow(-mv.sq(), 0.5);
          var phi = mv.smul(1 / phiMag); // normalise
          console.log("phiMag: " + phiMag);
          var phiD = cga.I5.gp(phi);
          var d = phiD.scalarProduct(cga.n0);
          console.log("d: " + d);
          var nHat = phiD.sub(cga.ni.smul(d));
          nHat.strLog("nHat: ");
          //var sphDN = -sphD.dot(cg.ni).d[0]
          //sphD = sphD.smul(1/sphDN)

          let nx = nHat.bVal("e_1"),
            ny = nHat.bVal("e_2"),
            nz = nHat.bVal("e_3"),
            nd = d,
            mag = Math.pow(nx * nx + ny * ny + nz * nz, 1 / 2);

          // normalize
          nx = nx / mag;
          ny = ny / mag;
          nz = nz / mag;
          nd = nd / mag;

          if (this.plMat == undefined) {
            this.plMat = new THREE.MeshStandardMaterial({
              color: 0xffff00,
              emissive: 0x111111,
              side: THREE.DoubleSide,
            });
          }
          if (this.plGeom == undefined) {
            this.plGeom = new THREE.PlaneGeometry(1 * mag, 1 * mag);
          }
          if (this.planeMesh == undefined) {
            this.planeMesh = new THREE.Mesh(this.plGeom, this.plMat);
            scene.add(this.planeMesh);
          }
          this.plGeom.lookAt(new THREE.Vector3(nx, ny, nz));
          this.plGeom.translate(-nx * nd, -ny * nd, -nz * nd);
        }

        // Point
      } else if (mv.grade() == 1) {
        if (!mv.opt.size) {
          mv.opt.size = 0.1;
        }

        xyz = this.pointXYZ(mv);

        // render
        if (mv.renderStuff == null) {
          mv.renderStuff = {};
          var rs = mv.renderStuff;
          rs.geomOut = new THREE.SphereGeometry(mv.opt.size, 9, 9);
          rs.matOut = new THREE.MeshStandardMaterial({
            color: mv.opt.color,
            opacity: 0.6,
            emissive: 0x111111,
            side: THREE.DoubleSide,
          });
          rs.meshOut = new THREE.Mesh(rs.geomOut, rs.matOut);

          scene.add(rs.meshOut);

          rs.meshOut.clickParent = mv;
        }

        mv.renderStuff.meshOut.position.set(xyz.x, xyz.y, xyz.z);
      }

      if (options && options.renderComponents && mv.components) {
        for (let i = 0; i < mv.components.length; ++i) {
          mv.components[i].render(options);
        }
      }
    },
  };

  cga.bs = bs;
  bs.addBasis("1", +1);
  bs.addBasis("2", +1);
  bs.addBasis("3", +1);
  bs.addBasis("p", +1);
  bs.addBasis("m", -1);

  cga.n0 = bs.multiVector({ e_m: 0.5, e_p: -0.5 });
  cga.ni = bs.multiVector({ e_m: 1, e_p: 1 });
  cga.I5 = bs.multiVector({ e_123pm: 1 });
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
  cga.bs.createCayley();
  cga.bs.interpretation = cga;

  return cga;
}
