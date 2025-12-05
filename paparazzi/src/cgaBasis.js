import * as THREE from "three";
import { createBasisSet } from "./basisSet.js";

const DEFAULT_CIRCLE_SEGMENTS = 64;
const DEFAULT_BACK_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xddaaff
  , opacity: 0.6
  , emissive: 0x111111
  , transparent: true
  , side: THREE.BackSide
});

function buildCircleOutlineGeometry(
  radius
  , segments = DEFAULT_CIRCLE_SEGMENTS
) {
  const safeRadius = radius > 0 ? radius : 1e-4;
  const path = new THREE.Path();
  path.absarc(0, 0, safeRadius, 0, Math.PI * 2, false);
  const points = path
    .getSpacedPoints(segments)
    .map((pt) => new THREE.Vector3(pt.x, pt.y, 0));
  return new THREE.BufferGeometry().setFromPoints(points);
}

function resolveColor(options = {}, ...mvs) {
  if (options.color) {
    return options.color;
  }
  for (const mv of mvs) {
    if (mv?.opt?.color) {
      return mv.opt.color;
    }
  }
  return 0x333333;
}

function createRenderer({ scene, dottyMaterial, pointXYZ }) {
  function buildVector3(mv) {
    if (!mv) {
      return null;
    }
    const xyz = pointXYZ(mv) ?? {};
    if (
      !Number.isFinite(xyz.x) ||
      !Number.isFinite(xyz.y) ||
      !Number.isFinite(xyz.z)
    ) {
      return null;
    }
    return new THREE.Vector3(xyz.x, xyz.y, xyz.z);
  }

  return {
    triangle(mv0, mv1, mv2, options = {}) {
      const pts = [mv0, mv1, mv2].map((mv) => buildVector3(mv));
      if (pts.some((pt) => !pt)) {
        console.warn("triangle requires finite points", pts);
        return;
      }

      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const uvs = [0, 0, 0, 1, 1, 0];
      geom.setAttribute(
        "uv"
        , new THREE.BufferAttribute(new Float32Array(uvs), 2)
      );
      const color = resolveColor(options, mv0, mv1, mv2);
      const frontMaterial = new THREE.MeshBasicMaterial({
        color
        , side: THREE.FrontSide
      });
      const frontMesh = new THREE.Mesh(geom, frontMaterial);
      const backMesh = new THREE.Mesh(geom, dottyMaterial);
      scene.add(frontMesh, backMesh);

      geom.computeVertexNormals();
    }

    , lineSegments(points, options = {}) {
      if (!Array.isArray(points) || points.length < 2) {
        return;
      }

      const vec3s = points.map((mv) => buildVector3(mv));
      const segmentCount = vec3s.length - 1;
      const positions = new Float32Array(segmentCount * 6);
      const colors = new Float32Array(segmentCount * 6);

      for (let i = 0; i < segmentCount; i += 1) {
        const start = vec3s[i];
        const end = vec3s[i + 1];
        if (!start || !end) {
          console.warn("skipping invalid segment", i, start, end);
          continue;
        }
        const offset = i * 6;
        positions[offset + 0] = start.x;
        positions[offset + 1] = start.y;
        positions[offset + 2] = start.z;
        positions[offset + 3] = end.x;
        positions[offset + 4] = end.y;
        positions[offset + 5] = end.z;

        const color = new THREE.Color(
          resolveColor(options, points[i], points[i + 1])
        );
        colors[offset + 0] = color.r;
        colors[offset + 1] = color.g;
        colors[offset + 2] = color.b;
        colors[offset + 3] = color.r;
        colors[offset + 4] = color.g;
        colors[offset + 5] = color.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position"
        , new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const material = new THREE.LineBasicMaterial({ vertexColors: true });
      scene.add(new THREE.LineSegments(geometry, material));
    }

    , list(mvs, options = {}) {
      if (!Array.isArray(mvs) || mvs.length === 0) {
        return;
      }

      if (mvs.length === 1) {
        mvs[0]?.render(options);
      } else if (mvs.length === 3) {
        this.triangle(mvs[0], mvs[1], mvs[2], options);
      } else {
        this.lineSegments(mvs, options);
      }
    }
  };
}

export function createCgaBasis(scene, options = {}) {
  const { basisSet, cemo, dottyMaterial: customBackMaterial } = options;
  const bs = basisSet ?? createBasisSet();
  const dottyMaterial = customBackMaterial ?? DEFAULT_BACK_MATERIAL;
  let renderer;
  const cga = {
    isA: "cgaBasis"
    , bs: bs // basisSet
    , scene: scene
    , opt: {}
    , cemo
    , n0: bs.multiVector()
    , ni: bs.multiVector()
    , I5: bs.multiVector()

    , pt: function (x, y, z) {
      return bs.multiVector({ e_1: x, e_2: y, e_3: z });
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

    , pointXYZ: function (mv) {
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
        x: mv.basisSVal("e_1") / XScalarNi
        , y: mv.basisSVal("e_2") / XScalarNi
        , z: mv.basisSVal("e_3") / XScalarNi
      };
    }
    , renderMV: function (mv, options) {
      if (!mv) {
        return;
      }

      if (mv?.isA !== "mv") {
        return renderer.list(mv, options);
      }

      options = options ?? {};
      if (!mv.opt) {
        mv.opt = {};
      }
      Object.assign(mv.opt, options);
      if (!mv.opt.color) {
        mv.opt.color = resolveColor(options, mv);
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

        var Icd = cga.I5.gp(Ic)
          , nx = Icd.bVal("e_1")
          , ny = Icd.bVal("e_2")
          , nz = Icd.bVal("e_3")
          //				,	nd = d
          , mag = Math.pow(nx * nx + ny * ny + nz * nz, 1 / 2);

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
          this.geometry = buildCircleOutlineGeometry(rad);
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
              color: 0xff00ff
              , emissive: 0x111111
              , opacity: 0.5
              , transparent: true
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

          let nx = nHat.bVal("e_1")
            , ny = nHat.bVal("e_2")
            , nz = nHat.bVal("e_3")
            , nd = d
            , mag = Math.pow(nx * nx + ny * ny + nz * nz, 1 / 2);

          // normalize
          nx = nx / mag;
          ny = ny / mag;
          nz = nz / mag;
          nd = nd / mag;

          if (this.plMat == undefined) {
            this.plMat = new THREE.MeshStandardMaterial({
              color: 0xffff00
              , emissive: 0x111111
              , side: THREE.DoubleSide
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
            color: mv.opt.color
            , opacity: 0.6
            , emissive: 0x111111
            , side: THREE.DoubleSide
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
    }
  };

  renderer = createRenderer({
    scene
    , dottyMaterial
    , pointXYZ: (mv) => cga.pointXYZ(mv)
  });

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
