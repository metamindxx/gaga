<script lang="ts">
  /**
   * MotorGroup - Apply a PGA motor to child objects
   *
   * Wraps children in a T.Group whose position and rotation
   * are derived from the given motor (multivector).
   *
   * Usage:
   *   <MotorGroup motor={someMotor}>
   *     <T.Mesh> ... </T.Mesh>
   *   </MotorGroup>
   */

  import { T } from '@threlte/core';
  import { pga } from '../algebra/pga';
  import type { Multivector as MV } from '../algebra/types.js';
  import type { Snippet } from 'svelte';

  interface Props {
    motor: MV;
    children?: Snippet;
  }
  let { motor, children }: Props = $props();

  const _origin = pga.point([0, 0, 0]);

  const position = $derived(
    pga.pointCoords(motor.sandwich(_origin)) as [number, number, number] ?? [0, 0, 0]
  );

  const quaternion = $derived.by(() => {
    const sc  = motor.bVal('e_');
    const b12 = motor.bVal('e_12');
    const b13 = motor.bVal('e_13');
    const b23 = motor.bVal('e_23');
    const norm = Math.sqrt(sc * sc + b12 * b12 + b13 * b13 + b23 * b23) || 1;
    return [-b23 / norm, b13 / norm, -b12 / norm, sc / norm] as [number, number, number, number];
  });
</script>

<T.Group {position} {quaternion}>
  {#if children}
    {@render children()}
  {/if}
</T.Group>
