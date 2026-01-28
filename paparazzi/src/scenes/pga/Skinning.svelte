<script lang="ts">
  /**
   * Skinning.svelte - Dual Quaternion Skinning vs Linear Blend Skinning
   */

  import { useTask } from '@threlte/core';
  import { Text } from '@threlte/extras';
  import { pga, e13, e01 } from '../../algebra/pga';
  import type { Multivector as MV } from '../../algebra/types.js';
  import Segment from '../../geometry/Segment.svelte';
  import Point from '../../geometry/Point.svelte';

  interface Props {
    /** Use Dual Quaternion Skinning (true) or Linear Blend Skinning (false) */
    useDQS?: boolean;
    /** Rotation angle in radians (0 to π) */
    rotationAngle?: number;
    /** Whether to animate the rotation automatically */
    animate?: boolean;
    /** Animation speed multiplier */
    animationSpeed?: number;
  }

  let {
    useDQS = true
    , rotationAngle = 0.5
    , animate = true
    , animationSpeed = 1.0
  }: Props = $props();

  /** Number of sides on the rod (4 = square cross-section) */
  const sides = 4;

  /** Number of segments along the rod's length */
  const segments = 15;

  /** Time multiplier for animation speed */
  const timeScale = 0.00025;

  /** Rod color */
  const rodColor = 0x224488;

  /** Cached rotors and translators */
  const e13Rotor = e13.motor();
  const e01Translator = e01.motor();

  /**
   * Generate the original (rest pose) points for a square rod.
   * The rod extends from y=-1 to y=1, centered at origin.
   */
  function generateRodPoints(): MV[] {
    const points: MV[] = [];

    // e13 is the xz-plane bivector, rotation about y-axis
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < sides; j++) {
        // Rotate a point around y-axis to create the cross-section
        const angleAroundY = ((Math.PI * 2) / sides) * j;
        const rot = e13Rotor(angleAroundY / 2);

        // Start point at (-0.5, y, 0) and rotate it
        const y = -1 + i / (segments / 2); // y from -1 to 1
        const basePoint = pga.point([-0.5, y, 0]);

        points.push(rot.sandwich(basePoint));
      }
    }

    return points;
  }

  /**
   * Generate edge pairs (indices into points array) for the rod mesh.
   * Creates both circumferential edges (around the rod) and longitudinal edges (along the rod).
   */
  function generateEdges(): [number, number][] {
    const edges: [number, number][] = [];

    // Circumferential edges (around each ring)
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < sides; j++) {
        const idx1 = i * sides + j;
        const idx2 = i * sides + ((j + 1) % sides);
        edges.push([idx1, idx2]);
      }
    }

    // Longitudinal edges (along the length)
    for (let i = 0; i < segments - 1; i++) {
      for (let j = 0; j < sides; j++) {
        const idx1 = i * sides + j;
        const idx2 = (i + 1) * sides + j;
        edges.push([idx1, idx2]);
      }
    }

    return edges;
  }

  /** Original rest-pose points (never modified) */
  const pointsOrig = generateRodPoints();

  /** Edge index pairs */
  const edges = generateEdges();

  /** Current deformed points (updated each frame) */
  let points = $state<MV[]>(pointsOrig.map((p) => p));

  /** Animation time */
  let time = $state(0);

  /** Derived skinning method label */
  const skinningLabel = $derived(useDQS ? 'Dual Quaternion Skinning' : 'Linear Blend Skinning');

  useTask((delta) => {
    // Update animation time
    if (animate) time += delta * 1000 * timeScale * animationSpeed;

    // Two bones: one at top, one at bottom
    // Bone 1: bottom bone, rotates about -e13 (negative y rotation axis)
    // Bone 2: top bone, rotates about e13 (positive y rotation axis)
    // Original formula: Math.PI * 0.6 * Math.sin(time * 10) - oscillates negative to positive
    const rotAngle = animate ? Math.PI * 0.3 * Math.sin(time * 10) : rotationAngle / 2;
    const transAmount = Math.sin(time);
    const transAmount2 = Math.sin(time / 2);

    // Create bone motors (rotation * translation)
    // b1 rotates around bottom, b2 rotates around top
    const b1 = e13Rotor(-rotAngle).gp(e01Translator(transAmount * 0.1));
    const b2 = e13Rotor(rotAngle).gp(e01Translator(transAmount2 * 0.1));

    // Transform all points
    const newPoints: MV[] = [];
    for (let i = 0; i < pointsOrig.length; i++) {
      const origPoint = pointsOrig[i];

      // Get y-coordinate to compute blending weights
      // Points go from y=-1 (bottom) to y=1 (top)
      const coords = pga.pointCoords(origPoint);
      if (!coords) {
        newPoints.push(origPoint);
        continue;
      }

      const y = coords[1];
      // w1 is weight for bone 1 (bottom), w2 for bone 2 (top)
      // Linear blend based on y position: bottom=0 → w1=0.5, top=1 → w1=0
      const w1 = (y + 1) / 2; // 0 at bottom (-1), 1 at top (+1)
      const w2 = 1 - w1; // 1 at bottom, 0 at top

      if (useDQS) {
        // Dual Quaternion Skinning: blend motors, then apply
        // Motor blending: (w1*b1 + w2*b2).Normalized
        const blendedMotor = b1.smul(w2).add(b2.smul(w1)).normalize();
        newPoints.push(blendedMotor.sandwich(origPoint));
      } else {
        // Linear Blend Skinning: apply motors separately, then blend positions
        // Result: w1 * (b1 >>> point) + w2 * (b2 >>> point)
        const p1 = b1.sandwich(origPoint);
        const p2 = b2.sandwich(origPoint);
        newPoints.push(p1.smul(w2).add(p2.smul(w1)));
      }
    }

    points = newPoints;
  });

  /** Convert points to coordinate arrays for rendering */
  const pointCoords = $derived(
    points.map((p) => pga.pointCoords(p) ?? ([0, 0, 0] as [number, number, number]))
  );
</script>

<!-- Title label showing current skinning method -->
<Text text={skinningLabel} fontSize={0.15} position={[0, 1.8, 0]} anchorX="center" />

<!-- Render all edges as line segments -->
{#each edges as [i1, i2]}
  <Segment start={pointCoords[i1]} end={pointCoords[i2]} color={rodColor} lineWidth={0.015} />
{/each}

{#each pointCoords as coord}
  <Point position={coord} radius={0.02} color={rodColor} />
{/each}
