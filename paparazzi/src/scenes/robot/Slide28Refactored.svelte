<script lang="ts">
  /**
   * Slide 28: 2-DOF Agile Eye Forward Kinematics
   *
   * Refactored from slide28-2dof_agileEyeForwardKinematics.js
   * Uses plane-sphere intersections to solve forward kinematics.
   */

  import { useTask } from '@threlte/core';
  import { cga, e1, e2, e3, no, ni, one } from '../../algebra/cga';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import type { Multivector } from '../../algebra/types';
  import { interactivity } from '@threlte/extras';

  interactivity();

  // The directions of the motors from the origin
  // var s0 = -1.0*1e1;
  const s0 = e1.smul(-1.0);
  // var s1 = -1.0*1e2;
  const s1 = e2.smul(-1.0);

  // Properties of the robot
  const r_b = 0.5;
  const r_e = 0.3;
  const speed = 1.2;

  // Bivectors for rotors
  // 1e23, 1e13
  const e23 = e2.op(e3);
  const e13 = e1.op(e3);

  // We will draw the path of the robot
  const path: Multivector[] = [];

  // Animation time state
  let time = $state(0);
  useTask(() => (time = performance.now()));

  // === FORWARD KINEMATICS ===
  const fk = $derived.by(() => {
    // The two rotors
    // var theta0 = (Math.cos(speed*performance.now()/3000))*3.141592/4;
    // var R0 = Math.E**(1e23*theta0/2);
    const theta0 = (Math.cos((speed * time) / 3000) * Math.PI) / 4;
    const R0 = e23.exp(theta0 / 2).normalize();

    // var theta1 = (Math.cos(speed*performance.now()/1000))*3.141592/4;
    // var R1 = Math.E**(1e13*theta1/2);
    const theta1 = (Math.cos((speed * time) / 1000) * Math.PI) / 4;
    const R1 = e13.exp(theta1 / 2).normalize();

    // The 3D positions of the elbow points
    // var x0 = R0*r_e*1e3*~R0;
    const x0 = R0.gp(e3.smul(r_e)).gp(R0.reverse());
    // var x1 = R1*r_e*1e1*~R1;
    const x1 = R1.gp(e1.smul(r_e)).gp(R1.reverse());

    // Construct two planes through the origin and rotate them
    // var P0 = (R0*(up(1e1)^up(-1e1)^up(1e2)^ni)*~R0).Grade(4);
    const P0base = cga
      .up(e1)
      .op(cga.up(e1.smul(-1)))
      .op(cga.up(e2))
      .op(ni);
    const P0 = R0.gp(P0base).gp(R0.reverse()).selectGrade(4);

    // var P1 = (R1*(up(1e3)^up(-1e3)^up(1e2)^ni)*~R1).Grade(4);
    const P1base = cga
      .up(e3)
      .op(cga.up(e3.smul(-1)))
      .op(cga.up(e2))
      .op(ni);
    const P1 = R1.gp(P1base).gp(R1.reverse()).selectGrade(4);

    // var S = !(up(0) - 0.5*r_e**2*ni);
    const S = no.sub(ni.smul(0.5 * r_e ** 2)).dual();

    // The two cyan circles
    // var C0 = (P0.Vee(S)).Normalized;
    const C0 = cga.meet(P0, S).normalize();
    // var C1 = (P1.Vee(S)).Normalized;
    const C1 = cga.meet(P1, S).normalize();

    // Intersect the two planes and the sphere
    // var T = (P1.Vee(P0).Vee(S)).Grade(2).Normalized;
    const T = cga.meet(cga.meet(P1, P0), S).selectGrade(2).normalize();

    // Calculate Pc from point pair T
    // var Pc = (1 + T*(1/(Math.sqrt((T**2)[0]))))*(T|ni);
    const Tsq = T.gp(T).basisSVal('e_');
    let Pc;
    if (Tsq > 0.0001) {
      const projector = one.add(T.smul(1 / Math.sqrt(Tsq)));
      const TdotNi = T.dot(ni);
      Pc = projector.gp(TdotNi);
    } else {
      Pc = no;
    }

    // Calculate the final red circle
    // var Cfinal = T^up(x1);
    const Cfinal = T.op(cga.up(x1));

    // var norm_plane = !(Cfinal^ni);
    const norm_plane = Cfinal.op(ni).dual();

    // var direction = (norm_plane|1e1)*1e1 + (norm_plane|1e2)*1e2 + (norm_plane|1e3)*1e3;
    const dir1 = norm_plane.dot(e1).basisSVal('e_') ?? 0;
    const dir2 = norm_plane.dot(e2).basisSVal('e_') ?? 0;
    const dir3 = norm_plane.dot(e3).basisSVal('e_') ?? 0;
    const direction = e1.smul(dir1).add(e2.smul(dir2)).add(e3.smul(dir3));

    // var Y = up(r_b*direction/Math.sqrt((direction**2)[0]));
    const dirSq = direction.gp(direction).basisSVal('e_') ?? 0;
    let Y;
    if (dirSq > 0.0001) {
      Y = cga.up(direction.smul(r_b / Math.sqrt(dirSq)));
    } else {
      Y = no;
    }

    // Add to the path array and pop
    path.push(Y);
    if (path.length > 100) {
      path.shift();
    }

    // Reflected Pc: 1e45*Pc*1e45 (reflection through origin)
    // In ganja, 1e45 is e4^e5, which in our basis is related to no^ni
    // The reflection inverts points through origin: P -> -P for the Euclidean part
    const PcReflected = no.op(ni).gp(Pc).gp(no.op(ni));

    // Base plane: up(r_b*s1)^up(r_b*s1+1e3)^up(r_b*s1+1e1)^ni
    const s1rb = s1.smul(r_b);
    const basePlane = cga
      .up(s1rb)
      .op(cga.up(s1rb.add(e3)))
      .op(cga.up(s1rb.add(e1)))
      .op(ni);

    return {
      s0
      , s1 // Motor directions
      , x0
      , x1 // Elbow positions (Euclidean vectors)
      , S // Sphere
      , C0
      , C1 // Cyan circles
      , T // Point pair
      , Pc // Point on sphere
      , PcReflected // Reflected Pc
      , Cfinal // Red circle
      , Y // End effector position
      , basePlane
      , path
    };
  });
</script>

<!-- 0x00000000, up(r_b*s0), 'R0' -->
<RenderMv mv={cga.up(fk.s0.smul(r_b))} label="R0" />

<!-- up(r_b*s1), 'R1' -->
<RenderMv mv={cga.up(fk.s1.smul(r_b))} label="R1" />

<!-- up(x0), 'X0' -->
<RenderMv mv={cga.up(fk.x0)} label="X0" />

<!-- up(x1), 'X1' -->
<RenderMv mv={cga.up(fk.x1)} label="X1" />

<!-- up(-x1) -->
<RenderMv mv={cga.up(fk.x1.smul(-1))} />

<!-- up(x0)^up(r_b*s0), up(x1)^up(r_b*s1) -->
<RenderMv mv={cga.up(fk.x0).op(cga.up(fk.s0.smul(r_b)))} />
<RenderMv mv={cga.up(fk.x1).op(cga.up(fk.s1.smul(r_b)))} />

<!-- Pc^up(x0) -->
<RenderMv mv={fk.Pc.op(cga.up(fk.x0))} />

<!-- [up(0*1e1), Y] -->
<RenderMv mv={[no, fk.Y]} />

<!-- Y, 'M' -->
<RenderMv mv={fk.Y} label="M" />

<!-- 0xA00000FF, [Pc, up(x1), up(-x1)] -->
<RenderMv mv={[fk.Pc, cga.up(fk.x1), cga.up(fk.x1.smul(-1))]} color={0xa00000} />

<!-- Pc, 'Pc' -->
<RenderMv mv={fk.Pc} color={0xa00000} label="Pc" />

<!-- [1e45*Pc*1e45, up(x1), up(-x1)] -->
<RenderMv mv={[fk.PcReflected, cga.up(fk.x1), cga.up(fk.x1.smul(-1))]} color={0xa00000} />

<!-- 0x5A00AFAF, C0, C1 -->
<RenderMv mv={fk.C0} color={0x5a00af} opacity={0.5} />
<RenderMv mv={fk.C1} color={0x5a00af} opacity={0.5} />

<!-- 0x000000FF, T -->
<RenderMv mv={fk.T} />

<!-- 0x00FF0000, Cfinal -->
<RenderMv mv={fk.Cfinal} color={0xff0000} />

<!-- 0xAA000000, up(r_b*s1)^up(r_b*s1+1e3)^up(r_b*s1+1e1)^ni -->
<RenderMv mv={fk.basePlane} color={0xaa0000} opacity={0.08} />

<!-- 0x55FF0000, path -->
<RenderMv mv={fk.path} color={0xff0000} opacity={0.33} />
