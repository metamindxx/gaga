<script lang="ts">
  /**
   * Slide 30: 3-DOF Agile Eye Inverse Kinematics
   *
   * Refactored from slide30-3dof_agileEye_InverseKinematics.js
   * Uses circle-circle intersections to solve inverse kinematics.
   */

  import { useTask } from '@threlte/core';
  import { cga, e1, e2, e3, no, ni, one } from '../algebra/cga';
  import RenderMv from '../geometry/RenderMv.svelte';
  import type { Multivector } from '../algebra/types';
  import { interactivity } from '@threlte/extras';

  interactivity();

  // Properties of the robot
  // var s0 = 1.0*1e1;
  const s0 = e1.smul(1.0);
  // var s1 = -0.5*1e1 + Math.sqrt(3)*1e2/2;
  const s1 = e1.smul(-0.5).add(e2.smul(Math.sqrt(3) / 2));
  // var s2 = -0.5*1e1 - Math.sqrt(3)*1e2/2;
  const s2 = e1.smul(-0.5).add(e2.smul(-Math.sqrt(3) / 2));
  const r_b = 0.5;
  const r_e = 0.4;
  const speed = 1.2;

  // var rotation_centre = -(1/3)*r_b*1e3;
  const rotation_centre = e3.smul(-(1 / 3) * r_b);
  // var up_rotation_centre = up(rotation_centre);
  const up_rotation_centre = cga.up(rotation_centre);

  // var l = Math.sqrt((((r_b*s0) - rotation_centre)**2)[0]);
  const diff = s0.smul(r_b).sub(rotation_centre);
  const l = Math.sqrt(Math.abs(diff.gp(diff).basisSVal('e_')));

  // The starting distance of the endplane from the e12 plane
  // var d = Math.sqrt(l**2 - r_e**2);
  const d = Math.sqrt(l ** 2 - r_e ** 2);

  // Bivectors for rotors
  const e12 = e1.op(e2);
  const e13 = e1.op(e3);
  const e23 = e2.op(e3);

  // A fixed sphere about the rotation centre
  // var S = !(up_rotation_centre - 0.5*l**2*ni);
  const S = up_rotation_centre.sub(ni.smul(0.5 * l ** 2)).dual();

  // Generate the fixed planes perpendicular to the axes of the motors
  function makeFixedPlane(s: Multivector) {
    // var Tr0 = (1 - 0.5*(( -r_b*s0 + rotation_centre )^ni));
    const t = s.smul(-r_b).add(rotation_centre);
    const Tr = one.sub(t.op(ni).smul(0.5));
    // var a0 = (Tr0 * ((up(r_b*s0)|S)^ni) * ~Tr0).Grade(4);
    const upRbS = cga.up(s.smul(r_b));
    const plane = upRbS.dot(S).op(ni);
    return Tr.gp(plane).gp(Tr.reverse()).selectGrade(4);
  }

  const a0 = makeFixedPlane(s0);
  const a1 = makeFixedPlane(s1);
  const a2 = makeFixedPlane(s2);

  // Generate the fixed circles perpendicular to the axes of the motors
  // var k0 = a0.Vee(S);
  const k0 = cga.meet(a0, S);
  const k1 = cga.meet(a1, S);
  const k2 = cga.meet(a2, S);

  // We will draw the path of the robot
  const path: Multivector[] = [];

  // Animation time state
  let time = $state(0);
  useTask(() => (time = performance.now()));

  // === INVERSE KINEMATICS ===
  const ik = $derived.by(() => {
    // Choose a defining rotor for the end plate pose
    // var theta0 = (Math.cos(speed*performance.now()/1000))*3.141592/8;
    const theta0 = (Math.cos((speed * time) / 1000) * Math.PI) / 8;
    // var theta1 = (Math.cos(speed*performance.now()/2000))*3.141592/8;
    const theta1 = (Math.cos((speed * time) / 2000) * Math.PI) / 8;
    // var theta2 = (Math.cos(speed*performance.now()/1500))*3.141592/8;
    const theta2 = (Math.cos((speed * time) / 1500) * Math.PI) / 8;
    // var R = (Math.E**(1e13*theta2/2)*Math.E**(1e23*theta1/2)*Math.E**(1e12*theta0/2)).Normalized;
    const R = e13
      .exp(theta2 / 2)
      .gp(e23.exp(theta1 / 2))
      .gp(e12.exp(theta0 / 2))
      .normalize();

    // Construct the end plate transformed by the rotor
    // var x0 = r_e*s0 - d*1e3;
    const x0 = s0.smul(r_e).sub(e3.smul(d));
    const x1 = s1.smul(r_e).sub(e3.smul(d));
    const x2 = s2.smul(r_e).sub(e3.smul(d));

    // var y0 = up(R*x0*~R + rotation_centre);
    const y0 = cga.up(R.gp(x0).gp(R.reverse()).add(rotation_centre));
    const y1 = cga.up(R.gp(x1).gp(R.reverse()).add(rotation_centre));
    const y2 = cga.up(R.gp(x2).gp(R.reverse()).add(rotation_centre));

    // Construct the moving circles defined as a result of the end plate moving
    function makeMovingPlaneAndCircle(x: Multivector, y: Multivector) {
      // var Tx0 = (1 + 0.5*((R*x0*~R)^ni));
      const Rx = R.gp(x).gp(R.reverse());
      const Tx = one.add(Rx.op(ni).smul(0.5));
      // var p0 = (Tx0*(((S|y0)^ni).Normalized)*~Tx0).Grade(4);
      const plane = S.dot(y).op(ni).normalize();
      const p = Tx.gp(plane).gp(Tx.reverse()).selectGrade(4);
      // var c0 = p0.Vee(S);
      const c = cga.meet(p, S);
      return { p, c };
    }

    const { p: p0, c: c0 } = makeMovingPlaneAndCircle(x0, y0);
    const { p: p1, c: c1 } = makeMovingPlaneAndCircle(x1, y1);
    const { p: p2, c: c2 } = makeMovingPlaneAndCircle(x2, y2);

    // Intersect the circles to give the elbow position
    function computeElbow(a: Multivector, p: Multivector) {
      // var T0 = (a0.Vee(p0).Vee(S)).Grade(2).Normalized;
      const T = cga.meet(cga.meet(a, p), S).selectGrade(2).normalize();
      // var elb0 = (1 + T0*(1/(Math.sqrt((T0**2)[0]))))*(T0|ni);
      const Tsq = T.gp(T).basisSVal('e_');
      if (Tsq > 0.0001) {
        const projector = one.add(T.smul(1 / Math.sqrt(Tsq)));
        const TdotNi = T.dot(ni);
        return { elb: projector.gp(TdotNi), T };
      }
      return { elb: up_rotation_centre, T };
    }

    const { elb: elb0, T: T0 } = computeElbow(a0, p0);
    const { elb: elb1, T: T1 } = computeElbow(a1, p1);
    const { elb: elb2, T: T2 } = computeElbow(a2, p2);

    // Add to the path array and pop
    // var endpoint = ((y0^y1^y2^ni)*up_rotation_centre*(y0^y1^y2^ni))
    const endPlane = y0.op(y1).op(y2).op(ni);
    const endpoint = endPlane.gp(up_rotation_centre).gp(endPlane);

    path.push(endpoint);
    if (path.length > 100) {
      path.shift();
    }

    return {
      y0
      , y1
      , y2
      , elb0
      , elb1
      , elb2
      , c0
      , k0
      , T0
      , endpoint
      , path
    };
  });
</script>

<!-- 0x00000000, y0, 'y0' -->
<RenderMv mv={ik.y0} label="y0" />

<!-- y1, 'y1' -->
<RenderMv mv={ik.y1} label="y1" />

<!-- y2, 'y2' -->
<RenderMv mv={ik.y2} label="y2" />

<!-- 0xAA000000, [y0, y1, y2] -->
<RenderMv mv={[ik.y0, ik.y1, ik.y2]} closed color={0xaa0000} opacity={0.08} />

<!-- [up_rotation_centre, y0], [up_rotation_centre, y1], [up_rotation_centre, y2] -->
<RenderMv mv={[up_rotation_centre, ik.y0]} color={0xaa0000} />
<RenderMv mv={[up_rotation_centre, ik.y1]} color={0xaa0000} />
<RenderMv mv={[up_rotation_centre, ik.y2]} color={0xaa0000} />

<!-- 0x00000000, up(r_b*s0)^up(r_b*s1)^up(r_b*s2) -->
<RenderMv
  mv={cga
    .up(s0.smul(r_b))
    .op(cga.up(s1.smul(r_b)))
    .op(cga.up(s2.smul(r_b)))}
/>

<!-- 0x00FF0000, up_rotation_centre -->
<RenderMv mv={up_rotation_centre} color={0xff0000} />

<!-- 0x000000FF, c0, k0, T0 -->
<RenderMv mv={ik.c0} color={0x0000ff} />
<RenderMv mv={k0} color={0x0000ff} />
<RenderMv mv={ik.T0} color={0x0000ff} />

<!-- 0x00000000, up(r_b*s0), up(r_b*s1), up(r_b*s2) -->
<RenderMv mv={cga.up(s0.smul(r_b))} />
<RenderMv mv={cga.up(s1.smul(r_b))} />
<RenderMv mv={cga.up(s2.smul(r_b))} />

<!-- 0x00FF0000, [elb0, up(r_b*s0), up_rotation_centre], ... -->
<RenderMv mv={[ik.elb0, cga.up(s0.smul(r_b)), up_rotation_centre]} color={0xff0000} />
<RenderMv mv={[ik.elb1, cga.up(s1.smul(r_b)), up_rotation_centre]} color={0xff0000} />
<RenderMv mv={[ik.elb2, cga.up(s2.smul(r_b)), up_rotation_centre]} color={0xff0000} />

<!-- [elb0, y0, up_rotation_centre], ... -->
<RenderMv mv={[ik.elb0, ik.y0, up_rotation_centre]} color={0xff0000} />
<RenderMv mv={[ik.elb1, ik.y1, up_rotation_centre]} color={0xff0000} />
<RenderMv mv={[ik.elb2, ik.y2, up_rotation_centre]} color={0xff0000} />

<!-- 0x00000000, up_rotation_centre^endpoint -->
<RenderMv mv={up_rotation_centre.op(ik.endpoint)} />

<!-- 0x55FF0000, path -->
<RenderMv mv={ik.path} color={0xff0000} opacity={0.33} />
