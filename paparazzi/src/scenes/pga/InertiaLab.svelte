<script lang="ts">
  import { useTask } from '@threlte/core';
  import { onMount, onDestroy } from 'svelte';
  import { pga, e01 } from '../../algebra/pga';
  import type { Multivector as MV } from '../../algebra/types.js';
  import Sphere from '$geometry/Sphere.svelte';
  import RenderMv from '../../geometry/RenderMv.svelte';
  import { config, stats } from './inertiaLabState.svelte';
  import {
    origin
    , gravityForque
    , dampingForque
    , accumulateSpherePlaneContactForque
      , correctPenetration
    , kineticEnergyFromInertia
    , makeInertiaInverseFromMap
    , makeShiftedInertiaMap
    , sphereInertiaMap
    , spherePlaneSpringEnergy
    , stepRigidBodySemiImplicit
    , sumInertiaMaps
    , type InertiaMap
  } from '../../lib/pga-dynamics';

  // Inertia maps (reactive to config)

  const Xleft  = $derived(pga.translator([-config.halfOffset, 0, 0], 1));
  const Xright = $derived(pga.translator([ config.halfOffset, 0, 0], 1));

  const localSphereInertia: InertiaMap = $derived.by(() =>
    sphereInertiaMap(config.sphereMass, config.sphereRadius));

  const joinedInertia: InertiaMap = $derived.by(() => {
    const Ileft  = makeShiftedInertiaMap(Xleft,  localSphereInertia);
    const Iright = makeShiftedInertiaMap(Xright, localSphereInertia);
    return sumInertiaMaps([Ileft, Iright]);
  });

  const joinedInertiaInv: InertiaMap = $derived.by(() =>
    makeInertiaInverseFromMap(joinedInertia));

  const groundPlane   = $derived(pga.plane([0, 1, 0], 0));
  const localSphereMotors = $derived([Xleft, Xright]);
  const totalMass = $derived(2 * config.sphereMass);

  // Simulation state

  /** Build a motor from current config: translate to dropHeight, then tilt. */
  function buildHoldMotor(): MV {
    const Rx = pga.rotor([0, 0, 1], config.dropAngleX);
    const T  = pga.translator([0, config.dropHeight, 0], 1);
    return T.gp(Rx);
  }

  let dropped = $state(false);
  let M = $state(buildHoldMotor());
  let B = $state(e01.smul(0));   // zero rate

  // Event handlers

  function drop() {
    if (dropped) return;
    // Lock in the current held motor; launch with zero velocity.
    dropped = true;
  }

  function reset() {
    dropped = false;
    M = buildHoldMotor();
    B = e01.smul(0);
  }

  onMount(() => {
    window.addEventListener('inertialab-drop',  drop);
    window.addEventListener('inertialab-reset', reset);
    reset();
  });
  onDestroy(() => {
    window.removeEventListener('inertialab-drop',  drop);
    window.removeEventListener('inertialab-reset', reset);
  });

  // Task loop

  useTask((delta) => {
    if (!dropped) {
      // Hold mode: keep motor locked to current config angles/height.
      M = buildHoldMotor();
      B = e01.smul(0);
    } else {

      const steps = Math.max(1, Math.round(config.substeps));
      const dt = Math.min(delta, 1 / 30) / steps;

      const gcc = {
        plane: groundPlane
        , planeNormal: [0, 1, 0] as [number, number, number]
        , radius: config.sphereRadius
        , stiffness: config.groundStiffness
        , damping: config.groundDamping
        , frictionMu: config.groundFriction
      };
      for (let i = 0; i < steps; i++) {
        const Fg      = gravityForque(M.reverse(), config.gravity * totalMass);
        const Fd      = dampingForque(B, config.bodyDamping);
        const Fground = accumulateSpherePlaneContactForque({ M, B }, joinedInertiaInv, localSphereMotors, gcc, dt);
        const F       = Fg.add(Fd).add(Fground);
        const next    = stepRigidBodySemiImplicit({ M, B }, F, joinedInertia, joinedInertiaInv, dt);
        M = next.M;
        B = next.B;
        // Baumgarte position correction: bleeds residual penetration over a few substeps,
        // preventing deep-tunnelling rocking instability for compound bodies.
        M = correctPenetration(M, B, localSphereMotors, gcc, 0.8);
      }
    }

    // Update energy display (runs in both hold and dropped modes).
    const comY = (pga.pointCoords(M.sandwich(origin)) ?? [0, 0, 0])[1];
    const gcc2 = {
      plane: groundPlane
      , planeNormal: [0, 1, 0] as [number, number, number]
      , radius: config.sphereRadius
      , stiffness: config.groundStiffness
      , damping: config.groundDamping
      , frictionMu: config.groundFriction
    };
    stats.ke       = kineticEnergyFromInertia(B, joinedInertia);
    stats.pe       = -config.gravity * totalMass * comY;
    stats.springPE = spherePlaneSpringEnergy({ M, B }, localSphereMotors, gcc2);
    stats.total    = stats.ke + stats.pe + stats.springPE;
  });

  // Derived display values
  const localCenterLeft  = $derived(Xleft.sandwich(origin));
  const localCenterRight = $derived(Xright.sandwich(origin));

  const Pleft  = $derived(M.sandwich(localCenterLeft));
  const Pright = $derived(M.sandwich(localCenterRight));

  const leftCoords  = $derived((pga.pointCoords(Pleft)  ?? [0, 0, 0]) as [number, number, number]);
  const rightCoords = $derived((pga.pointCoords(Pright) ?? [0, 0, 0]) as [number, number, number]);
</script>

<Sphere center={leftCoords}  radius={config.sphereRadius} color={0x99b7ff} opacity={0.9} />
<Sphere center={rightCoords} radius={config.sphereRadius} color={0xffb299} opacity={0.9} />

<RenderMv mv={[Pleft, Pright]} color={0xe8d18c} lineWidth={0.01} />
