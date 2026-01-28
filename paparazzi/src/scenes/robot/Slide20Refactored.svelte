<script lang="ts">
  /**
   * Slide 20: Serial Robot Forward Kinematics (3D)
   *
   * Refactored from slide20-SerialRobot_Forward3d.js
   * Uses CGA rotors for joint rotations.
   */

  import { useTask } from '@threlte/core';
  import { cga, e1, e2, e3, no } from '../../algebra/cga';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import type { Multivector } from '../../algebra/types';
  import { interactivity } from '@threlte/extras';

  interactivity();
  // Bivectors for rotations (corresponding to 1e12, 1e13 in ganja.js)
  const e12 = e1.op(e2);
  const e13 = e1.op(e3);

  // Robot arm parameters
  const rho = 1.0;
  const l = 0.5;

  // Draw a robot base: C = (up(0.2*1e1)^up(0.2*1e3)^up(-0.2*1e1)).Normalized
  const C = cga
    .up([0.2, 0, 0])
    .op(cga.up([0, 0, 0.2]))
    .op(cga.up([-0.2, 0, 0]))
    .normalize();

  // We will draw the path of the robot (as CGA points)
  const path: Multivector[] = [];

  // Animation time state
  let time = $state(0);
  useTask(() => (time = performance.now()));

  // Set up time varying parameters for the rotors
  const speed = 0.5;

  // All kinematics derived from time
  const fk = $derived.by(() => {
    const theta0 = (Math.cos((speed * time) / 3000) * Math.PI) / 2;
    const theta1 = 1 + (Math.cos((speed * time) / 1000) ** 2 * Math.PI) / 4;
    const theta2 = Math.cos((speed * time) / 1500) ** 2 * Math.PI;

    // Create a time varying rotor to mimic the behaviour of the base
    const R0 = e13.exp(-theta0 / 2).normalize();
    const R1 = e12.exp(-theta1 / 2).normalize();
    const Rbase = R0.gp(R1).normalize();

    // Define the points of the robot
    const elb0 = Rbase.smul(rho).gp(e1).gp(Rbase.reverse());

    // This is the motor in the elbow
    const R2 = Rbase.gp(e12.exp(-theta2 / 2).normalize()).normalize();

    // The end point
    const endpoint = elb0.sub(R2.gp(e1).smul(l).gp(R2.reverse()));

    // Base rotation indicator (for drawing the base direction)
    const indicator = R0.gp(e1.smul(0.2)).gp(R0.reverse());

    // Add to the path array and pop
    path.push(cga.up(endpoint));
    if (path.length > 100) {
      path.shift();
    }

    return {
      indicator
      , elb0
      , endpoint
      , path
    };
  });
</script>

<!-- Robot base circle: C = (up(0.2*1e1)^up(0.2*1e3)^up(-0.2*1e1)).Normalized -->
<RenderMv mv={C} />

<!-- Elbow point: up(elb0) -->
<RenderMv mv={cga.up(fk.elb0)} />

<!-- End point: up(endpoint) -->
<RenderMv mv={cga.up(fk.endpoint)} />

<!-- Base rotation indicator: [up(0), R0*up(0.2*1e1)*~R0] -->
<RenderMv mv={[cga.up(fk.indicator), no, cga.up(fk.elb0), cga.up(fk.endpoint)]} />

<!-- Path trail (red) -->
<RenderMv mv={fk.path} color={0xff0000} opacity={0.33} />
