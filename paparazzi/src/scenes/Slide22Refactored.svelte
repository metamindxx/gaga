<script lang="ts">
  /**
   * Slide 22: Serial Robot Forward Kinematics with Translators (CGA Motors)
   *
   * Refactored from slide22-SerialRobot_ForwardCGA.js
   * Uses CGA translators (motors) for link transformations.
   *
   * Key difference from Slide 20:
   * - Slide 20 uses rotors only (pure rotations in Euclidean space)
   * - Slide 22 uses motors = rotors * translators (conformal transformations)
   */

  import { useTask } from '@threlte/core';
  import { cga, e1, e2, e3, no, ni, one } from '../algebra/cga';
  import RenderMv from '../geometry/RenderMv.svelte';
  import type { Multivector } from '../algebra/types';
  import { interactivity } from '@threlte/extras';

  interactivity();

  // Bivectors for rotations (corresponding to 1e12, 1e13 in ganja.js)
  const e12 = e1.op(e2);
  const e13 = e1.op(e3);

  // Lengths of the robot limbs
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

    // Translator for the 1st link: Rrho = 1 - 0.5*rho*(1e1^ni)
    const Rrho = one.sub(e1.op(ni).smul(0.5 * rho));

    // Elbow position: ElbR = R0*R1*Rrho, Elb0 = ElbR*no*~ElbR
    const ElbR = R0.gp(R1).gp(Rrho);
    const Elb0 = ElbR.gp(no).gp(ElbR.reverse());

    // This is the motor in the elbow
    const R2 = e12.exp(-theta2 / 2).normalize();

    // Translator for the 2nd link: Rl = 1 + 0.5*l*(1e1^ni)
    const Rl = one.add(e1.op(ni).smul(0.5 * l));

    // The compound motor: R = R0*R1*Rrho*R2*Rl
    const R = R0.gp(R1).gp(Rrho).gp(R2).gp(Rl);

    // The end point: endpoint = R*no*~R
    const endpoint = R.gp(no).gp(R.reverse());

    // Base rotation indicator (for drawing the base direction)
    const indicator = R0.gp(e1.smul(0.2)).gp(R0.reverse());

    // Add to the path array and pop
    path.push(endpoint);
    if (path.length > 100) {
      path.shift();
    }

    return {
      indicator
      , Elb0
      , endpoint
      , path
    };
  });
</script>

<!-- Robot base circle: C = (up(0.2*1e1)^up(0.2*1e3)^up(-0.2*1e1)).Normalized -->
<RenderMv mv={C} />

<!-- Elbow point: Elb0 -->
<RenderMv mv={fk.Elb0} />

<!-- End point: endpoint -->
<RenderMv mv={fk.endpoint} />

<!-- Segments: [up(0), R0*up(0.2*1e1)*~R0], [up(0), Elb0], [Elb0, endpoint] -->
<RenderMv mv={[cga.up(fk.indicator), no, fk.Elb0, fk.endpoint]} />

<!-- Path trail (red) -->
<RenderMv mv={fk.path} color={0xff0000} opacity={0.33} />
