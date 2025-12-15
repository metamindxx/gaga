<script lang="ts">
  /**
   * Slide 35: Delta Robot Forward Kinematics
   *
   * Refactored from slide35-delatRobot_forward.js
   * Intersects three spheres to find the end effector position.
   */

  import { useTask } from '@threlte/core';
  import { cga, e1, e2, e3, ni, one } from '../algebra/cga';
  import RenderMv from '../geometry/RenderMv.svelte';
  import { interactivity } from '@threlte/extras';
  import type { EditableField, ActionButton } from '../stores/hoverInfo';

  interactivity();

  // The directions from the base of each motor
  // var s0 = 1.0*1e1;
  const s0 = e1.smul(1.0);
  // var s1 = -0.5*1e1 + Math.sqrt(3)*1e2/2;
  const s1 = e1.smul(-0.5).add(e2.smul(Math.sqrt(3) / 2));
  // var s2 = -0.5*1e1 - Math.sqrt(3)*1e2/2;
  const s2 = e1.smul(-0.5).add(e2.smul(-Math.sqrt(3) / 2));

  // Physical properties of the robot
  // var r_b = 0.3;
  const r_b = 0.3;
  // var r_e = 0.1;
  const r_e = 0.1;
  // var l = 0.5;
  const l = 0.5;
  // var rho = 0.8;
  const rho = 0.8;
  // var speed = 0.5;
  const speed = 0.5;

  // Animation time state
  let time = $state(0);

  // Manual mode: when true, use manual theta values
  let manualMode = $state(false);
  let manualTheta0 = $state(0.5);
  let manualTheta1 = $state(0.5);
  let manualTheta2 = $state(0.5);

  useTask(() => {
    if (!manualMode) {
      time = performance.now();
    }
  });

  // === FORWARD KINEMATICS ===
  const fk = $derived.by(() => {
    // Three motor angles
    let theta0: number, theta1: number, theta2: number;

    if (manualMode) {
      theta0 = manualTheta0;
      theta1 = manualTheta1;
      theta2 = manualTheta2;
    } else {
      // var theta0 = Math.cos(speed*performance.now()/1000)**2*3.141592/2;
      theta0 = (Math.cos((speed * time) / 1000) ** 2 * Math.PI) / 2;
      // var theta1 = Math.cos(speed*performance.now()/2000)**2*3.141592/2;
      theta1 = (Math.cos((speed * time) / 2000) ** 2 * Math.PI) / 2;
      // var theta2 = Math.cos(speed*performance.now()/1500)**2*3.141592/2;
      theta2 = (Math.cos((speed * time) / 1500) ** 2 * Math.PI) / 2;
    }

    // Calculate the elbow positions
    // var Elb0 = up((r_b + l*Math.cos(1.0*theta0))*s0 + l*Math.sin(1.0*theta0)*1e3);
    const Elb0 = cga.up(s0.smul(r_b + l * Math.cos(theta0)).add(e3.smul(l * Math.sin(theta0))));
    const Elb1 = cga.up(s1.smul(r_b + l * Math.cos(theta1)).add(e3.smul(l * Math.sin(theta1))));
    const Elb2 = cga.up(s2.smul(r_b + l * Math.cos(theta2)).add(e3.smul(l * Math.sin(theta2))));

    // Calculate the spheres at the pseudo-elbow positions
    // var S0 = up((r_b - r_e + l*Math.cos(1.0*theta0))*s0 + l*Math.sin(1.0*theta0)*1e3) - 0.5*rho*rho*ni;
    const S0 = cga
      .up(s0.smul(r_b - r_e + l * Math.cos(theta0)).add(e3.smul(l * Math.sin(theta0))))
      .sub(ni.smul(0.5 * rho * rho));
    const S1 = cga
      .up(s1.smul(r_b - r_e + l * Math.cos(theta1)).add(e3.smul(l * Math.sin(theta1))))
      .sub(ni.smul(0.5 * rho * rho));
    const S2 = cga
      .up(s2.smul(r_b - r_e + l * Math.cos(theta2)).add(e3.smul(l * Math.sin(theta2))))
      .sub(ni.smul(0.5 * rho * rho));

    // Intersect the spheres to find the endpoint
    // var T = (S0^S1^S2).Normalized*1e12345;
    const wedge = S0.op(S1).op(S2);
    const T = wedge.normalize().dual();

    // var Y = (1+T)*(T|ni);
    const TdotNi = T.dot(ni);
    const Y = one.add(T).gp(TdotNi);

    // var y = -(1e1*(Y|1e1) + 1e2*(Y|1e2) + 1e3*(Y|1e3))/(Y|ni)[0];
    // This extracts the Euclidean point from Y
    // We can use this to construct the end plate positions
    const YdotNi = Y.dot(ni).basisSVal('e_') || 1;
    const y = e1
      .smul(-Y.dot(e1).basisSVal('e_') / YdotNi)
      .add(e2.smul(-Y.dot(e2).basisSVal('e_') / YdotNi))
      .add(e3.smul(-Y.dot(e3).basisSVal('e_') / YdotNi));

    // Calculate the end plate positions
    // var X0 = up(y + r_e*s0);
    const X0 = cga.up(y.add(s0.smul(r_e)));
    const X1 = cga.up(y.add(s1.smul(r_e)));
    const X2 = cga.up(y.add(s2.smul(r_e)));

    return {
      theta0
      , theta1
      , theta2
      , Elb0
      , Elb1
      , Elb2
      , S0
      , S1
      , S2
      , Y
      , X0
      , X1
      , X2
    };
  });

  // Base motor positions (static)
  const base0 = cga.up(s0.smul(r_b));
  const base1 = cga.up(s1.smul(r_b));
  const base2 = cga.up(s2.smul(r_b));
  const baseCircle = base0.op(base1).op(base2);

  // Editable fields for each motor
  const editableFields0: EditableField[] = $derived([
    {
      key: 'θ0'
      , label: 'θ0'
      , value: fk.theta0
      , min: 0
      , max: Math.PI / 2
      , step: 0.01
      , onChange: (v: number) => {
        manualMode = true;
        manualTheta0 = v;
      }
    }
  ]);

  const editableFields1: EditableField[] = $derived([
    {
      key: 'θ1'
      , label: 'θ1'
      , value: fk.theta1
      , min: 0
      , max: Math.PI / 2
      , step: 0.01
      , onChange: (v: number) => {
        manualMode = true;
        manualTheta1 = v;
      }
    }
  ]);

  const editableFields2: EditableField[] = $derived([
    {
      key: 'θ2'
      , label: 'θ2'
      , value: fk.theta2
      , min: 0
      , max: Math.PI / 2
      , step: 0.01
      , onChange: (v: number) => {
        manualMode = true;
        manualTheta2 = v;
      }
    }
  ]);
  // Action to resume animation
  const resumeAction: ActionButton[] = $derived(
    manualMode
      ? [
          {
            label: '▶ Resume Animation'
            , onClick: () => {
              manualMode = false;
            }
          }
        ]
      : []
  );
</script>

<!-- 0x00000000, up(r_b*s0), (1.0*theta0).toFixed(2) -->
<RenderMv
  mv={base0}
  label={fk.theta0.toFixed(2)}
  editableFields={editableFields0}
  actions={resumeAction}
/>

<!-- up(r_b*s1), (1.0*theta1).toFixed(2) -->
<RenderMv
  mv={base1}
  label={fk.theta1.toFixed(2)}
  editableFields={editableFields1}
  actions={resumeAction}
/>

<!-- up(r_b*s2), (1.0*theta2).toFixed(2) -->
<RenderMv
  mv={base2}
  label={fk.theta2.toFixed(2)}
  editableFields={editableFields2}
  actions={resumeAction}
/>

<!-- up(r_b*s0)^up(r_b*s1)^up(r_b*s2) -->
<RenderMv mv={baseCircle} />

<!-- 0x00000000, Elb0, [up(r_b*s0),Elb0], 0x00FF0000, "l" -->
<RenderMv mv={fk.Elb0} />
<RenderMv mv={[base0, fk.Elb0]} label="l" color={0xff0000} />

<!-- 0x00000000, Elb1, [up(r_b*s1),Elb1] -->
<RenderMv mv={fk.Elb1} />
<RenderMv mv={[base1, fk.Elb1]} />

<!-- 0x00000000, Elb2, [up(r_b*s2),Elb2] -->
<RenderMv mv={fk.Elb2} />
<RenderMv mv={[base2, fk.Elb2]} />

<!-- 0x00000000, [Elb0,X0], 0x00FF0000, "rho" -->
<RenderMv mv={[fk.Elb0, fk.X0]} label="ρ" color={0xff0000} />

<!-- 0x00000000, [Elb1,X1], [Elb2,X2] -->
<RenderMv mv={[fk.Elb1, fk.X1]} />
<RenderMv mv={[fk.Elb2, fk.X2]} />

<!-- [X0,X1,X2] -->
<RenderMv mv={[fk.X0, fk.X1, fk.X2]} closed />

<!-- X0, X1, X2 -->
<RenderMv mv={fk.X0} />
<RenderMv mv={fk.X1} />
<RenderMv mv={fk.X2} />

<!-- 0x00FF0000, Y, "Y" -->
<RenderMv mv={fk.Y} color={0xff0000} label="Y" />

<!-- 0xAAF0F0F0, S0, S1, S2 (optional spheres - uncomment to visualize) -->
<!-- <RenderMv mv={fk.S0} color={0xf0f0f0} opacity={0.1} /> -->
<!-- <RenderMv mv={fk.S1} color={0xf0f0f0} opacity={0.1} /> -->
<!-- <RenderMv mv={fk.S2} color={0xf0f0f0} opacity={0.1} /> -->
