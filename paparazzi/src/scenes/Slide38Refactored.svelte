<script lang="ts">
  /**
   * Slide 38: Delta Robot Inverse Kinematics Demo
   *
   * Refactored from slide38-delatRobot_inverse_demo.js
   * Drag the end effector Y to compute motor angles via IK.
   */

  import { T } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import { cga, e1, e2, e3, e123, ni, one } from '../algebra/cga';
  import RenderMv from '../geometry/RenderMv.svelte';
  import type { Multivector } from '../algebra/types';
  import { useDrag } from '../composables/useDrag.svelte';

  // Enable interactivity for click/pointer events on meshes
  interactivity();

  // Define the constants in the problem
  // var s0 = 1.0*1e1;
  const s0 = e1.smul(1.0);
  // var s1 = -0.5*1e1 + Math.sqrt(3)*1e2/2;
  const s1 = e1.smul(-0.5).add(e2.smul(Math.sqrt(3) / 2));
  // var s2 = -0.5*1e1 - Math.sqrt(3)*1e2/2;
  const s2 = e1.smul(-0.5).add(e2.smul(-Math.sqrt(3) / 2));

  // var r_b = 0.3;
  const r_b = 0.3;
  // var r_e = 0.1;
  const r_e = 0.1;
  // var l = 0.5;
  const l = 0.5;
  // var rho = 0.8;
  const rho = 0.8;

  // The circles are also fixed
  // var C0 = !((up(r_b*s0) -0.5*l*l*ni)^(1e123*(1e3^s0)));
  function makeFixedCircle(s: Multivector): Multivector {
    const sphere = cga.up(s.smul(r_b)).sub(ni.smul(0.5 * l * l));
    const plane = e123.gp(e3.op(s));
    return sphere.op(plane).dual();
  }
  const C0 = makeFixedCircle(s0);
  const C1 = makeFixedCircle(s1);
  const C2 = makeFixedCircle(s2);

  // Base motor positions (static)
  // up(r_b*s0), up(r_b*s1), up(r_b*s2)
  const base0 = cga.up(s0.smul(r_b));
  const base1 = cga.up(s1.smul(r_b));
  const base2 = cga.up(s2.smul(r_b));
  // up(r_b*s0)^up(r_b*s1)^up(r_b*s2)
  const baseCircle = base0.op(base1).op(base2);

  // === STATE: End effector position as MULTIVECTOR ===
  // var Y = up(1.0*1e3);
  let Y = $state.raw(cga.up(e3.smul(1.0)));

  // === Drag handling ===
  const drag = useDrag({
    getPosition: () => cga.down(Y) ?? [0, 0, 1]
    , onDrag: (pos) => {
      Y = cga.up(pos);
    }
  });

  // === INVERSE KINEMATICS ===
  const ik = $derived.by(() => {
    // var y = -(1e1*(Y|1e1) + 1e2*(Y|1e2) + 1e3*(Y|1e3))/(Y|ni)[0];
    const YdotNi = Y.dot(ni).basisSVal('e_') || 1;
    const y = e1
      .smul(-Y.dot(e1).basisSVal('e_') / YdotNi)
      .add(e2.smul(-Y.dot(e2).basisSVal('e_') / YdotNi))
      .add(e3.smul(-Y.dot(e3).basisSVal('e_') / YdotNi));

    // var X0 = up(y + r_e*s0);
    const X0 = cga.up(y.add(s0.smul(r_e)));
    const X1 = cga.up(y.add(s1.smul(r_e)));
    const X2 = cga.up(y.add(s2.smul(r_e)));

    // var S0 = X0 - 0.5*rho*rho*ni;
    const S0 = X0.sub(ni.smul(0.5 * rho * rho));
    const S1 = X1.sub(ni.smul(0.5 * rho * rho));
    const S2 = X2.sub(ni.smul(0.5 * rho * rho));

    // var T0 = !(S0^(!C0)).Normalized;
    const T0 = S0.op(C0.dual()).dual().normalize();
    const T1 = S1.op(C1.dual()).dual().normalize();
    const T2 = S2.op(C2.dual()).dual().normalize();

    // var A0 = (1+T0)*(T0|ni);
    const A0 = one.add(T0).gp(T0.dot(ni));
    const A1 = one.add(T1).gp(T1.dot(ni));
    const A2 = one.add(T2).gp(T2.dot(ni));

    // var a0 = -(1e1*(A0|1e1) + 1e2*(A0|1e2) + 1e3*(A0|1e3))/(A0|ni)[0];
    function extractVec(A: Multivector): Multivector {
      const AdotNi = A.dot(ni).basisSVal('e_') || 1;
      return e1
        .smul(-A.dot(e1).basisSVal('e_') / AdotNi)
        .add(e2.smul(-A.dot(e2).basisSVal('e_') / AdotNi))
        .add(e3.smul(-A.dot(e3).basisSVal('e_') / AdotNi));
    }
    const a0 = extractVec(A0);
    const a1 = extractVec(A1);
    const a2 = extractVec(A2);

    // var theta0 = Math.atan2(1.0*(a0|1e3)[0],1.0*(a0|s0)[0]);
    const theta0 = Math.atan2(a0.dot(e3).basisSVal('e_'), a0.dot(s0).basisSVal('e_'));
    const theta1 = Math.atan2(a1.dot(e3).basisSVal('e_'), a1.dot(s1).basisSVal('e_'));
    const theta2 = Math.atan2(a2.dot(e3).basisSVal('e_'), a2.dot(s2).basisSVal('e_'));

    return {
      X0
      , X1
      , X2
      , A0
      , A1
      , A2
      , theta0
      , theta1
      , theta2
    };
  });
</script>

<svelte:window onpointermove={drag.onPointerMove} onpointerup={drag.onPointerUp} />

<!-- 0x00000000, up(r_b*s0), (1.0*theta0).toFixed(2) -->
<RenderMv mv={base0} label={ik.theta0.toFixed(2)} />

<!-- up(r_b*s1), (1.0*theta1).toFixed(2) -->
<RenderMv mv={base1} label={ik.theta1.toFixed(2)} />

<!-- up(r_b*s2), (1.0*theta2).toFixed(2) -->
<RenderMv mv={base2} label={ik.theta2.toFixed(2)} />

<!-- up(r_b*s0)^up(r_b*s1)^up(r_b*s2) -->
<RenderMv mv={baseCircle} />

<!-- 0x00FF0000, Y, "y" (draggable) -->
<T.Mesh position={cga.down(Y) ?? [0, 0, 1]} onpointerdown={drag.onPointerDown}>
  <T.SphereGeometry args={[0.04, 16, 16]} />
  <T.MeshBasicMaterial color="#FF0000" />
</T.Mesh>

<!-- 0x00000000, X0, X1, X2, [X0,X1,X2] -->
<RenderMv mv={ik.X0} />
<RenderMv mv={ik.X1} />
<RenderMv mv={ik.X2} />
<RenderMv mv={[ik.X0, ik.X1, ik.X2]} closed />

<!-- 0x00000000, A0, [up(r_b*s0),A0] -->
<RenderMv mv={ik.A0} />
<RenderMv mv={[base0, ik.A0]} />

<!-- A1, [up(r_b*s1),A1] -->
<RenderMv mv={ik.A1} />
<RenderMv mv={[base1, ik.A1]} />

<!-- A2, [up(r_b*s2),A2] -->
<RenderMv mv={ik.A2} />
<RenderMv mv={[base2, ik.A2]} />

<!-- X0, [X0,A0] -->
<RenderMv mv={[ik.X0, ik.A0]} />

<!-- X1, [X1,A1] -->
<RenderMv mv={[ik.X1, ik.A1]} />

<!-- X2, [X2,A2] -->
<RenderMv mv={[ik.X2, ik.A2]} />
