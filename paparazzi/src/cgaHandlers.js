/**
 * CGA Render Handlers - Know how to render CGA entities.
 *
 * These are the ONLY place that knows about multivectors and CGA math.
 * The store and renderer are algebra-agnostic.
 */

import * as THREE from "three";

/**
 * Create CGA render handlers.
 * @param {Object} cga - CGA basis { bs, n0, ni, I5 }
 */
export function createCGAHandlers(cga) {
  // === CGA helpers ===

  function pointXYZ(mv) {
    const XScalarNi = -mv.scalarProduct(cga.ni);
    if (Math.abs(XScalarNi) < 1e-10) return { x: 0, y: 0, z: 0 };
    return {
      x: mv.basisSVal("e_1") / XScalarNi
      , y: mv.basisSVal("e_2") / XScalarNi
      , z: mv.basisSVal("e_3") / XScalarNi
    };
  }

  // Embed Euclidean point (x,y,z) into CGA as conformal point
  function up(x, y, z) {
    const euclidean = cga.bs.multiVector({ e_1: x, e_2: y, e_3: z });
    const rSq = x * x + y * y + z * z;
    return cga.n0.add(euclidean).add(cga.ni.smul(0.5 * rSq));
  }

  // === Render handlers ===

  const handlers = {
    point: {
      create(entity, getEntity, scene) {
        const entityId = entity.id;
        const { x, y, z } = pointXYZ(entity.mv);
        const size = entity.size ?? 0.1;
        const color = entity.color ?? 0x888888;

        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshStandardMaterial({
          color
          , emissive: 0x111111
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);

        return {
          mesh
          , update() {
            const ent = getEntity(entityId);
            if (!ent?.mv) return;
            const { x, y, z } = pointXYZ(ent.mv);
            mesh.position.set(x, y, z);
          }
          , dispose() {
            geometry.dispose();
            material.dispose();
          }
        };
      }
    }

    , segment: {
      create(entity, getEntity, scene) {
        const color = entity.color ?? 0xffffff;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6);
        geometry.setAttribute(
          "position"
          , new THREE.BufferAttribute(positions, 3)
        );

        const material = new THREE.LineBasicMaterial({ color });
        const mesh = new THREE.Line(geometry, material);

        function update() {
          const [p1, p2] = entity.refs.map((id) => getEntity(id));
          if (!p1?.mv || !p2?.mv) return;

          const xyz1 = pointXYZ(p1.mv);
          const xyz2 = pointXYZ(p2.mv);
          const pos = geometry.attributes.position.array;
          pos[0] = xyz1.x;
          pos[1] = xyz1.y;
          pos[2] = xyz1.z;
          pos[3] = xyz2.x;
          pos[4] = xyz2.y;
          pos[5] = xyz2.z;
          geometry.attributes.position.needsUpdate = true;
        }

        update();

        return {
          mesh
          , update
          , dispose() {
            geometry.dispose();
            material.dispose();
          }
        };
      }
    }

    , circle: {
      create(entity, getEntity, scene) {
        const color = entity.color ?? 0x0088ff;
        const material = new THREE.LineBasicMaterial({ color });

        let geometry = new THREE.BufferGeometry();
        const mesh = new THREE.LineLoop(geometry, material);

        function update() {
          const pts = entity.refs.map((id) => getEntity(id));
          if (!pts.every((p) => p?.mv)) return;

          const circleMV = pts[0].mv.op(pts[1].mv).op(pts[2].mv);
          const Ic = circleMV.op(cga.ni);
          const IcSq = Math.abs(Ic.sq());
          if (IcSq < 1e-10) return;

          const IcNorm = Ic.smul(1 / Math.sqrt(IcSq));
          const circDual = circleMV.gp(IcNorm);
          const cdDotNi = circDual.scalarProduct(cga.ni);
          if (Math.abs(cdDotNi) < 1e-10) return;

          const circDualNorm = circDual.smul(-1 / cdDotNi);
          const center = circDualNorm.gp(
            circDualNorm.gp(cga.ni).smul(0.5).sadd(1)
          );
          const radius = Math.sqrt(Math.abs(circDualNorm.sq()));

          const Icd = cga.I5.gp(IcNorm);
          let nx = Icd.bVal("e_1")
            , ny = Icd.bVal("e_2")
            , nz = Icd.bVal("e_3");
          const mag = Math.sqrt(nx * nx + ny * ny + nz * nz);
          if (mag < 1e-10) return;
          nx /= mag;
          ny /= mag;
          nz /= mag;

          const centerXYZ = pointXYZ(center);

          // Rebuild geometry
          const path = new THREE.Path();
          path.absarc(0, 0, Math.max(radius, 0.001), 0, Math.PI * 2, false);
          const circlePoints = path
            .getSpacedPoints(64)
            .map((p) => new THREE.Vector3(p.x, p.y, 0));

          geometry.dispose();
          geometry = new THREE.BufferGeometry().setFromPoints(circlePoints);
          mesh.geometry = geometry;

          mesh.rotation.set(0, 0, 0);
          mesh.lookAt(centerXYZ.x + nx, centerXYZ.y + ny, centerXYZ.z + nz);
          mesh.position.set(centerXYZ.x, centerXYZ.y, centerXYZ.z);
        }

        update();

        return {
          mesh
          , update
          , dispose() {
            geometry.dispose();
            material.dispose();
          }
        };
      }
    }
  };

  return {
    handlers
    // Also expose helpers for external use (e.g., drag controller)
    , pointXYZ
    , up
  };
}
