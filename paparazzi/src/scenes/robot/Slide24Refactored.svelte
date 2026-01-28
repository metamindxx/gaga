<script lang="ts">
  /**
   * Slide 24: Serial Robot Inverse Kinematics (CGA)
   *
   * Refactored from slide24-SerialRobot_InverseKinematics.js
   * Uses sphere-sphere intersection to find elbow position.
   */

  import { T } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import { useThrelte } from '@threlte/core';
  import { cga, no, ni, one } from '../../algebra/cga';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import type { Coords3D } from '../../geometry/primitives';
  import { startDrag } from '../../stores/dragManager.svelte';

  interactivity();
  const { camera, renderer } = useThrelte();

  // Set the lengths of the arm pieces
  const rho = 0.8;
  const l = 0.6;

  // Choose a beginning starting point
  // var target = up(0.8*1e2 + 0.5*1e1);
  let target = $state.raw(cga.up([0.5, 0.8, 0]));

  // Draw a robot base
  // var Cbase = (up(0.2*1e1)^up(0.2*1e3)^up(-0.2*1e1)).Normalized;
  const Cbase = cga
    .up([0.2, 0, 0])
    .op(cga.up([0, 0, 0.2]))
    .op(cga.up([-0.2, 0, 0]))
    .normalize();

  // === DERIVED: Extract coords for drag plane ===
  const targetPos = $derived<Coords3D>(cga.down(target) ?? [0.5, 0.8, 0]);

  // === Drag handling ===
  function handlePointerDown(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    startDrag({
      camera: camera.current
      , renderer: renderer
      , getPosition: () => targetPos
      , onDrag: (pos) => {
        target = cga.up(pos);
      }
    });
  }

  // === INVERSE KINEMATICS (derived from target) ===
  const ik = $derived.by(() => {
    // The actual inverse kinematics of the robot
    // var S0 = !(up(0) - 0.5*rho**2*ni);
    const S0 = no.sub(ni.smul(0.5 * rho ** 2)).dual();

    // var S1 = !(target - 0.5*l**2*ni);
    const S1 = target.sub(ni.smul(0.5 * l ** 2)).dual();

    // var C = S0&S1;
    const C = cga.meet(S0, S1);

    // var P = target^up(0)^up(1e2)^ni;
    const P = target
      .op(no)
      .op(cga.up([0, 1, 0]))
      .op(ni);

    // var PP = -(P&C).Grade(2).Normalized;
    const PPmeet = cga.meet(P, C);
    const PPgrade2 = PPmeet.selectGrade(2);
    const ppNorm = PPgrade2.normalize();
    const PP = ppNorm.smul(-1);

    // The square of the point pair describes if the spheres intersect
    // if ((PP*PP)[0] > 0)
    const ppSq = PP.gp(PP).basisSVal('e_');

    let elb, endpoint;

    if (ppSq > 0) {
      // If the spheres intersect then we can just choose one solution
      // var elb = (1 + PP*(1/Math.sqrt((PP*PP)[0])))*(PP|ni);
      const ppSqrt = Math.sqrt(ppSq);
      const projector = one.add(PP.smul(1 / ppSqrt));
      const PPdotNi = PP.dot(ni);
      elb = projector.gp(PPdotNi);
      // var endpoint = target;
      endpoint = target;
    } else {
      // If the spheres do not intersect then we will just reach for the object.
      // var endpoint = up((rho+l)*down(target).Normalized);
      // var elb = up(rho*down(target).Normalized);
      const dir = cga.down(target);
      if (dir) {
        const mag = Math.sqrt(dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2);
        if (mag > 0.0001) {
          // Normalized direction
          const n: Coords3D = [dir[0] / mag, dir[1] / mag, dir[2] / mag];
          elb = cga.up(n.map((v) => v * rho) as Coords3D);
          endpoint = cga.up(n.map((v) => v * (rho + l)) as Coords3D);
        } else {
          elb = cga.up([rho, 0, 0]);
          endpoint = cga.up([rho + l, 0, 0]);
        }
      } else {
        console.warn('Could not extract direction from target MV, defaulting to x-axis');
        elb = cga.up([rho, 0, 0]);
        endpoint = cga.up([rho + l, 0, 0]);
      }
    }

    // Get the angles
    // var L1 = (elb^target^ni).Normalized;
    const L1 = elb.op(target).op(ni).normalize();

    // var L2 = (elb^no^ni).Normalized;
    const L2 = elb.op(no).op(ni).normalize();

    // var L1proj = ((L1|(Cbase^ni))|(Cbase^ni)).Normalized;
    const CbaseNi = Cbase.op(ni);
    const L1proj = L1.dot(CbaseNi).dot(CbaseNi).normalize();

    // var downt = down(target).Normalized;
    const downt = cga.down(target);
    const downtNorm = downt ? Math.sqrt(downt[0] ** 2 + downt[1] ** 2 + downt[2] ** 2) : 1;
    const downtUnit: Coords3D = downt
      ? [downt[0] / downtNorm, downt[1] / downtNorm, downt[2] / downtNorm]
      : [1, 0, 0];

    // var theta0 = Math.atan2((downt|1e3)[0], (downt|1e1)[0]);
    const theta0 = Math.atan2(downtUnit[2], downtUnit[0]);

    // var theta1 = Math.acos((L2|L1proj)[0]);
    const L2dotL1proj = L2.dot(L1proj).basisSVal('e_') ?? 0;
    const theta1 = Math.acos(Math.max(-1, Math.min(1, L2dotL1proj)));

    // var theta2 = Math.acos((L1|L2)[0]);
    const L1dotL2 = L1.dot(L2).basisSVal('e_') ?? 0;
    const theta2 = Math.acos(Math.max(-1, Math.min(1, L1dotL2)));

    return { S0, S1, C, P, PP, elb, endpoint, L1, L2, L1proj, theta0, theta1, theta2 };
  });
</script>

<!-- 0x000000, no -->
<RenderMv mv={no} label={`θ0: ${((180 * ik.theta0) / Math.PI).toFixed(1)}°`} />

<!-- 0x000000, Cbase, [up(0), elb], [endpoint, elb], endpoint -->
<RenderMv mv={Cbase} label={`θ1: ${((180 * ik.theta1) / Math.PI).toFixed(1)}°`} />
<RenderMv mv={[no, ik.elb]} />
<RenderMv mv={[ik.endpoint, ik.elb]} />
<RenderMv mv={ik.endpoint} />

<!-- 0xFF0000, C, target -->
<RenderMv mv={ik.C} color={0xff0000} />
<T.Mesh position={targetPos} onpointerdown={handlePointerDown}>
  <T.SphereGeometry args={[0.06, 16, 16]} />
  <T.MeshBasicMaterial color="#ff0000" />
</T.Mesh>

<!-- 0xFF0000, PP, elb -->
<RenderMv mv={ik.PP} color={0xff0000} />
<RenderMv mv={ik.elb} color={0xff0000} label={`θ2: ${((180 * ik.theta2) / Math.PI).toFixed(1)}°`} />

<!-- 0xCC000000, S0, S1, P, L1proj -->
<RenderMv mv={ik.S0} color={0x000000} opacity={0.08} />
<RenderMv mv={ik.S1} color={0x000000} opacity={0.08} />
<RenderMv mv={ik.P} color={0x000000} opacity={0.08} />
<RenderMv mv={ik.L1proj} color={0x000000} opacity={0.08} />

<!-- Angle labels (HTML overlay would be needed for text, logging for now) -->
<!-- "theta0: " + 180*theta0/3.141592 -->
<!-- "theta1: " + 180*theta1/3.141592 -->
<!-- "theta2: " + 180*theta2/3.141592 -->
