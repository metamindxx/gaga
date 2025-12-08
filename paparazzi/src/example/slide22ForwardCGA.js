// ==============================================================================
// CGA Serial Robot Forward Kinematics with Translators (slide22 port)
// ==============================================================================

import { createBasisSet } from "../basisSet";
import { createCgaBasis } from "../cgaBasis";

export function slide22ForwardCGAExample(scene, cemo) {
  const cgaBs = createBasisSet();
  const cga = createCgaBasis(scene, { basisSet: cgaBs, cemo });

  const origin = cga.bs.multiVector({});
  const e1 = cga.bs.multiVector({ e_1: 1 });
  const e2 = cga.bs.multiVector({ e_2: 1 });
  const e3 = cga.bs.multiVector({ e_3: 1 });
  const e12 = e1.op(e2);
  const e13 = e1.op(e3);

  // Null basis
  const ni = cga.ni;
  const n0 = cga.n0;
  const up = (x) => n0.add(x).add(x.gp(x).smul(0.5).gp(ni));

  // Lengths of the robot limbs
  const rho = 1.0;
  const l = 0.5;

  // Robot base
  const size = 0.2;
  const C = up(e1.smul(size))
    .op(up(e3.smul(size)))
    .op(up(e1.smul(-size)))
    .normalize();
  cga.renderMV(C, { color: 0x888888 });

  // Path and visuals
  const pathMax = 100;
  let path = [];
  let pathSegments = [];
  let arms = [];

  const dirInf = e1.op(ni); // direction toward +x at infinity
  const speed = 0.5;

  return {
    animateRobot(timeMs) {
      const theta0 = Math.cos((speed * timeMs) / 3000) * (Math.PI / 2);
      const theta1 =
        1 + Math.pow(Math.cos((speed * timeMs) / 1000), 2) * (Math.PI / 4);
      const theta2 = Math.pow(Math.cos((speed * timeMs) / 1500), 2) * Math.PI;

      const R0 = e13.smul(-theta0 / 2).exp(1);
      const R1 = e12.smul(-theta1 / 2).exp(1);

      // Translator for the 1st link
      const Rrho = cgaBs
        .multiVector({ e_: 1 })
        .add(dirInf.smul(-0.5 * rho));

      // Elbow position rotor and point
      const ElbR = R0.gp(R1).gp(Rrho);
      const Elb0 = ElbR.gp(n0).gp(ElbR.reverse());

      // Elbow rotor
      const R2 = e12.smul(-theta2 / 2).exp(1);

      // Translator for the 2nd link
      const Rl = cgaBs
        .multiVector({ e_: 1 })
        .add(dirInf.smul(0.5 * l));

      // Compound rotor
      const R = R0.gp(R1).gp(Rrho).gp(R2).gp(Rl);

      // Endpoint
      const endpoint = R.gp(n0).gp(R.reverse());

      // Manage path points
      path.push(endpoint);
      if (path.length > pathMax) {
        const dropped = path.shift();
        const mesh = dropped.renderStuff?.meshOut;
        if (mesh) {
          scene.remove(mesh);
          mesh.geometry?.dispose?.();
          mesh.material?.dispose?.();
        }
        const seg = pathSegments.shift();
        if (seg) {
          scene.remove(seg);
          seg.geometry?.dispose?.();
          seg.material?.dispose?.();
        }
      }

      // Clear previous arms
      arms.forEach((arm) => {
        scene.remove(arm);
        arm.geometry?.dispose?.();
        arm.material?.dispose?.();
      });
      arms = [];

      // Segments: base rotor, elbow link, forearm link
      arms.push(
        cga.renderMV([
          up(origin)
          , R0.gp(up(e1.smul(size))).gp(R0.reverse())
          , up(origin)
          , Elb0
          , Elb0
          , endpoint
        ])
      );

      // Path segment
      if (path.length >= 2) {
        pathSegments.push(cga.renderMV(path.slice(-2)));
      }
    }
  };
}
