import * as THREE from "three";
import { createBasisSet } from "./basisSet.js";
import { createCemoVanillaCamera } from "./cameras/cemoVanillaCamera.js";

const DEFAULT_BACK_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xddaaff
  , opacity: 0.6
  , emissive: 0x111111
  , transparent: true
  , side: THREE.BackSide
});

export function createPgaBasis(scene, options = {}) {
  const bs = options.basisSet ?? createBasisSet();
  const cemo = options.cemo ?? createCemoVanillaCamera();
  const dottyMaterial = options.dottyMaterial ?? DEFAULT_BACK_MATERIAL;

  const I3 = bs.multiVector();
  const I4 = bs.multiVector();

  // Converts a multivector into a Vector3 unless the point sits at infinity.
  function buildVector3(mv) {
    if (!mv) {
      return null;
    }

    const xyz = PB.pointXYZ(mv);
    if (xyz.inf) {
      return null;
    }

    return new THREE.Vector3(xyz.x, xyz.y, xyz.z);
  }

  // Get first color from options or multivectors
  function resolveColor(options, ...mvs) {
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

  const renderer = {
    // Triangles are a list of points and get rendered with a solid front face and a dotty back face
    triangle(mv0, mv1, mv2, options = {}) {
      const xyz0 = PB.pointXYZ(mv0);
      const xyz1 = PB.pointXYZ(mv1);
      const xyz2 = PB.pointXYZ(mv2);

      const pts = [
        new THREE.Vector3(xyz0.x, xyz0.y, xyz0.z)
        , new THREE.Vector3(xyz1.x, xyz1.y, xyz1.z)
        , new THREE.Vector3(xyz2.x, xyz2.y, xyz2.z)
      ];

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
    // Grade-1 blades (planes) get visualized with two concentric discs
    , plane(mv) {
      if (!mv.opt.size) {
        mv.opt.size = 0.5;
      }

      let nx = mv.basisSVal("e_1");
      let ny = mv.basisSVal("e_2");
      let nz = mv.basisSVal("e_3");
      let nd = mv.basisSVal("e_0");
      const mag = Math.pow(nx * nx + ny * ny + nz * nz, 1 / 2);

      nx = nx / mag;
      ny = ny / mag;
      nz = nz / mag;
      nd = -nd / mag;

      const gCircFront = new THREE.CircleGeometry(mv.opt.size, 32);
      const mFront = new THREE.MeshStandardMaterial({
        color: mv.opt.color
        , opacity: 0.4
        , emissive: 0x111111
        , side: THREE.DoubleSide
      });
      const mshCircFront = new THREE.Mesh(gCircFront, mFront);

      const gCircBack = new THREE.CircleGeometry(mv.opt.size * 0.8, 32);
      const mBack = new THREE.MeshStandardMaterial({
        color: mv.opt.color
        , opacity: 0.6
        , emissive: 0x111111
        , side: THREE.BackSide
      });
      const mshCircBack = new THREE.Mesh(gCircBack, mBack);
      mshCircBack.position.set(0, 0, -0.001);

      const group = new THREE.Group();
      group.add(mshCircFront);
      group.add(mshCircBack);
      group.lookAt(new THREE.Vector3(nx, ny, nz));
      group.position.set(nx * nd, ny * nd, nz * nd);
      scene.add(group);
      console.log("added plane", group);
    }
    // Lists of points are drawn as poly-lines
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
    // Grade-2 blades (lines) are rendered as vectors pointing along the line
    , line(mv) {
      if (!(cemo && typeof cemo.addVectorToScene === "function")) {
        return;
      }

      let ex = mv.basisSVal("e_23")
        , ey = -mv.basisSVal("e_13")
        , ez = mv.basisSVal("e_12");
      const mag = Math.pow(ex * ex + ey * ey + ez * ez, 1 / 2);
      ex /= mag;
      ey /= mag;
      ez /= mag;

      const ix = mv.basisSVal("e_01") / mag
        , iy = mv.basisSVal("e_02") / mag
        , iz = mv.basisSVal("e_03") / mag;

      const crossX = ey * iz - iy * ez
        , crossY = ez * ix - iz * ex
        , crossZ = ex * iy - ix * ey;

      cemo.addVectorToScene(
        [
          [crossX, crossY, crossZ]
          , [crossX + ex, crossY + ey, crossZ + ez]
        ]
        , new THREE.MeshBasicMaterial({ color: mv.opt.color })
        , scene
      );
    }
    // Points are rendered as shells while Ideals are rendered as vectors
    , point(mv) {
      if (!mv.opt.size) {
        mv.opt.size = 0.1;
      }

      let i0 = mv.basisSVal("e_123");
      let xyz;
      if (Math.abs(i0) < 0.001) {
        mv.opt.size *= 0.2;
        xyz = {
          x: -mv.basisSVal("e_023")
          , y: mv.basisSVal("e_013")
          , z: -mv.basisSVal("e_012")
        };
        i0 = 1;
        if (cemo && typeof cemo.addVectorToScene === "function") {
          cemo.addVectorToScene(
            [
              [xyz.x, xyz.y, xyz.z]
              , [2 * xyz.x, 2 * xyz.y, 2 * xyz.z]
            ]
            , new THREE.MeshBasicMaterial({ color: mv.opt.color })
            , scene
            , true
          );
        }
      } else {
        xyz = PB.pointXYZ(mv);
      }

      if (mv.renderStuff == null) {
        mv.renderStuff = {};
        const rs = mv.renderStuff;
        rs.geomOut = new THREE.SphereGeometry(mv.opt.size, 9, 9);
        rs.matOut = new THREE.MeshStandardMaterial({
          color: mv.opt.color
          , opacity: 0.6
          , emissive: 0x111111
        });
        rs.meshOut = new THREE.Mesh(rs.geomOut, rs.matOut);

        const insideSize = (1 + Math.sign(i0) * -0.1) * mv.opt.size;
        rs.geomIn = new THREE.SphereGeometry(insideSize, 5, 5);
        rs.matIn = new THREE.MeshStandardMaterial({
          color: mv.opt.color
          , wireframe: true
        });
        rs.meshIn = new THREE.Mesh(rs.geomIn, rs.matIn);

        rs.renderGroup = new THREE.Group();
        rs.renderGroup.add(rs.meshOut);
        rs.renderGroup.add(rs.meshIn);
        scene.add(rs.renderGroup);
      }

      mv.renderStuff.renderGroup.position.set(xyz.x, xyz.y, xyz.z);
    }
    // Rendering entry point for `basis.renderMV(list)`
    //   length 1 -> render MV directly
    //   length 3 -> treat as triangle
    //   everything else -> poly-line through consecutive points
    , list(mvs, options = {}) {
      if (mvs.length === 1) {
        // Render a single MV
        mvs[0].render(options);
      } else if (mvs.length === 3) {
        // Render a triangle
        renderer.triangle(mvs[0], mvs[1], mvs[2], options);
      } else {
        // Render line segments
        renderer.lineSegments(mvs, options);
      }
    }
  };

  const PB = {
    isA: "pgaBasis"
    , bs: bs // basisSet
    , scene: scene
    , opt: {}
    , I3
    , I4

    , pt(x, y, z) {
      var mvResult = bs.multiVector("");
      mvResult.pushBlade(bs.newBlade(-1, bs.e123));
      if (x) {
        mvResult.pushBlade(bs.newBlade(x, bs.e023));
      }
      if (y) {
        mvResult.pushBlade(bs.newBlade(-y, bs.e013));
      }
      if (z) {
        mvResult.pushBlade(bs.newBlade(z, bs.e012));
      }
      return mvResult;
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

    , pointXYZ(mv) {
      // z,y,x,1 == d[11], d[12], d[13], d[14]
      var ex = -mv.basisSVal("e_023")
        , ey = mv.basisSVal("e_013")
        , ez = -mv.basisSVal("e_012")
        , i0 = mv.basisSVal("e_123");

      var infinite = false;
      if (Math.abs(i0) < 0.0001) {
        infinite = true;
        var iMag = Math.pow(ex * ex + ey * ey + ez * ez, 1 / 2);
        return {
          x: ex / iMag
          , y: ey / iMag
          , z: ez / iMag
          , i: 0
          , inf: infinite
        };
      } else {
        return { x: ex / i0, y: ey / i0, z: ez / i0, i: 1, inf: infinite };
      }
    }

    , renderMV(mv, options) {
      if (mv?.isA !== "mv") {
        return renderer.list(mv, options);
      }

      options = options ?? {};
      // set some defaults
      if (!mv.opt) {
        mv.opt = {};
      }
      if (options) {
        Object.keys(options).forEach((k) => (mv.opt[k] = options[k]));
      }
      if (!mv.opt.color) {
        mv.opt.color = 0x333333;
      }

      let grade = mv.grade();
      if (grade === 1) {
        renderer.plane(mv);
      } else if (grade === 2) {
        renderer.line(mv);
      } else if (grade === 3) {
        renderer.point(mv);
      }
    }
  };

  PB.bs = bs;
  bs.addBasis("0", 0);
  bs.addBasis("1", +1);
  bs.addBasis("2", +1);
  bs.addBasis("3", +1);

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
  bs.createCayley();
  bs.interpretation = PB;

  // copy the ganja dual map
  bs.setDual(bs.e, bs.e0123, 1);

  bs.setDual(bs.e0, bs.e123, 1);
  bs.setDual(bs.e1, bs.e023, -1);
  bs.setDual(bs.e2, bs.e013, 1);
  bs.setDual(bs.e3, bs.e012, -1);

  bs.setDual(bs.e01, bs.e23, 1);
  bs.setDual(bs.e02, bs.e13, -1);
  bs.setDual(bs.e03, bs.e12, 1);
  bs.setDual(bs.e12, bs.e03, 1);
  bs.setDual(bs.e13, bs.e02, -1);
  bs.setDual(bs.e23, bs.e01, 1);

  bs.setDual(bs.e012, bs.e3, 1);
  bs.setDual(bs.e013, bs.e2, -1);
  bs.setDual(bs.e023, bs.e1, 1);
  bs.setDual(bs.e123, bs.e0, -1);

  bs.setDual(bs.e0123, bs.e, 1);

  PB.I3.pushBlade(bs.newBlade(1, bs.e123));
  PB.I4.pushBlade(bs.newBlade(1, bs.e0123));

  return PB;
}
