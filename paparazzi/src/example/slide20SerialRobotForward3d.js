// ==============================================================================
// CGA Serial Robot Forward 3D Kinematics Example
// ==============================================================================

import { createBasisSet } from "../basisSet";
import { createCgaBasis } from "../cgaBasis";

export function slide20Forward3dExample(scene, cemo) {
  // Create a Clifford Algebra with 4,1 metric for 3D CGA.

  const cgaBs = createBasisSet();

  const cga = createCgaBasis(scene, { basisSet: cgaBs, cemo });

  const origin = cga.bs.multiVector({});
  const e1 = cga.bs.multiVector({ e_1: 1 });
  const e2 = cga.bs.multiVector({ e_2: 1 });
  const e3 = cga.bs.multiVector({ e_3: 1 });
  const e12 = e1.op(e2);
  const e13 = e1.op(e3);

  // We start by defining a null basis, and upcasting for points
  const ni = cga.ni;
  const n0 = cga.n0;
  const up = (x) => n0.add(x).add(x.gp(x).smul(0.5).gp(ni));

  const rho = 1.0;
  const l = 0.5;

  // Draw a robot base
  const size = 0.2;
  const C = up(e1.smul(size))
    .op(up(e3.smul(size)))
    .op(up(e1.smul(-size)))
    .normalize();
  cga.renderMV(C, { color: 0x888888 });

  // We will draw the path of the robot
  const pathMax = 100;
  let path = [];
  let pathSegments = [];
  let arms = [];

  const speed = 0.5;
  return {
    animateRobot(timeMs) {
      // Set up time varying parameters for the the rotors
      const theta0 = Math.cos((speed * timeMs) / 3000) * (Math.PI / 2);
      const theta1 =
        1 + Math.pow(Math.cos((speed * timeMs) / 1000), 2) * (Math.PI / 4);
      const theta2 = Math.pow(Math.cos((speed * timeMs) / 1500), 2) * Math.PI;

      // Create a time varying rotor to mimic the behaviour of the base
      const R0 = e13.smul(-theta0 / 2).exp(1);
      const R1 = e12.smul(-theta1 / 2).exp(1);
      const Rbase = R0.gp(R1).normalize();

      // Define the points of the robot
      const elb0 = Rbase.smul(rho).gp(e1).gp(Rbase.reverse());

      // This is the motor in the elbow
      const R2 = Rbase.gp(e12.smul(-theta2 / 2).exp(1));

      // The end point
      const endpoint = elb0.sub(R2.smul(l).gp(e1).gp(R2.reverse()));

      // Add the endpoint to the path and remove old meshes
      path.push(up(endpoint));
      if (path.length > pathMax) {
        let dropped = path.shift();
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

      // render arms
      arms.push(
        cga.renderMV([
          R0.gp(up(e1.smul(size))).gp(R0.reverse())
          , up(origin)
          , up(elb0)
          , up(endpoint)
        ])
      );

      // render path segment
      if (path.length >= 2) {
        pathSegments.push(cga.renderMV(path.slice(-2)));
      }
    }
  };
}
