<script lang="ts">
  /**
   * Rolling Ball; plain vector/quaternion physics, no geometric algebra.
   * Solid sphere rolling down a tilted plane under gravity + contact + friction.
   */
  import { T, useTask } from '@threlte/core';
  import { Decal } from '@threlte/extras';
  import { CanvasTexture, Quaternion, Vector3 } from 'three';

  // Parameters
  const BALL_RADIUS = 0.3;
  const BALL_MASS   = 1.0;
  const I_ROT       = (2 / 5) * BALL_MASS * BALL_RADIUS * BALL_RADIUS; // solid sphere
  const GRAVITY     = -9.81;

  const SLOPE_ANGLE_DEG = 15;
  const SLOPE_ANGLE     = (SLOPE_ANGLE_DEG * Math.PI) / 180;

  // Slope plane: rotated about the X axis so it tilts in the +Z direction
  const planeNormal = new Vector3(0, Math.cos(SLOPE_ANGLE), -Math.sin(SLOPE_ANGLE)).normalize();
  const planeD = 0; // plane passes through the origin

  const STIFFNESS       = 5000;
  const CONTACT_DAMPING = 50;
  const FRICTION_MU     = 0.1;
  const LINEAR_DAMPING  = 0.02;

  const DROP_HEIGHT     = 3;
  const STEPS_PER_FRAME = 10;

  // State
  let pos   = $state(new Vector3(0, DROP_HEIGHT, 3));
  let vel   = $state(new Vector3(0, 0, 0));
  let omega = $state(new Vector3(0, 0, 0)); // angular velocity (world frame)
  let quat  = $state(new Quaternion());     // orientation

  // Decal texture
  function makeDotTexture(): CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${size * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', size / 2, size / 2);
    const tex = new CanvasTexture(canvas);
    tex.flipY = false;
    return tex;
  }
  const ballTexture = makeDotTexture();
  const DECAL_SCALE: [number, number, number] = [BALL_RADIUS * 0.9, BALL_RADIUS * 0.9, BALL_RADIUS * 0.9];

  // Physics

  function signedDistToPlane(p: Vector3): number {
    return p.dot(planeNormal) - planeD;
  }

  function simulate(dt: number): void {
    // 1. Gravity
    const accel = new Vector3(0, GRAVITY, 0);
    const torque = new Vector3(0, 0, 0);

    // 2. Contact (penalty spring + damping)
    const dist = signedDistToPlane(pos);
    const penetration = BALL_RADIUS - dist;
    let normalForce = 0;

    if (penetration > 0) {
      // Normal velocity toward the plane
      const vDotN = vel.dot(planeNormal);
      // Clamp so contact is never attractive (sticky)
      normalForce = Math.max(0, STIFFNESS * penetration - CONTACT_DAMPING * vDotN);

      // Apply contact force along the plane normal
      accel.addScaledVector(planeNormal, normalForce / BALL_MASS);

      // 3. Friction
      // Contact point offset from center (toward plane surface)
      const r = planeNormal.clone().multiplyScalar(-BALL_RADIUS);

      // Velocity at contact point: v_contact = vel + omega × r
      const vContact = vel.clone().add(new Vector3().crossVectors(omega, r));

      // Remove the normal component (tangential slip velocity)
      const slip = vContact.clone().addScaledVector(planeNormal, -vContact.dot(planeNormal));
      const slipSpeed = slip.length();

      if (slipSpeed > 1e-8) {
        // Friction clamped to prevent slip reversal
        // A tangential force F changes slip speed at rate F × (1/m + R²/I)
        const effectiveInvMass = 1 / BALL_MASS + BALL_RADIUS * BALL_RADIUS / I_ROT;
        const maxFriction = slipSpeed / (effectiveInvMass * dt);
        const frictionMag = Math.min(FRICTION_MU * normalForce, maxFriction);

        // Friction direction opposes slip
        const frictionDir = slip.clone().multiplyScalar(-1 / slipSpeed);
        const frictionForce = frictionDir.clone().multiplyScalar(frictionMag);

        // F/m
        accel.addScaledVector(frictionForce, 1 / BALL_MASS);

        // τ = r × F, angular accel = τ / I
        const tau = new Vector3().crossVectors(r, frictionForce);
        torque.addScaledVector(tau, 1 / I_ROT);
      }
    }

    // 4. Linear damping
    accel.addScaledVector(vel, -LINEAR_DAMPING);

    // 5. Integration
    // Update velocities
    vel.addScaledVector(accel, dt);
    omega.addScaledVector(torque, dt);

    // Update position / orientation using new velocities
    pos.addScaledVector(vel, dt);

    // Quaternion integration: q' = q + 0.5 * dt * (ω_quat * q)
    // where ω_quat = (ωx, ωy, ωz, 0) treated as a quaternion
    const qdt = 0.5 * dt;
    const ox = omega.x, oy = omega.y, oz = omega.z;
    const qx = quat.x, qy = quat.y, qz = quat.z, qw = quat.w;
    // ω_quat * q
    quat.x += qdt * ( ox * qw + oy * qz - oz * qy);
    quat.y += qdt * (-ox * qz + oy * qw + oz * qx);
    quat.z += qdt * ( ox * qy - oy * qx + oz * qw);
    quat.w += qdt * (-ox * qx - oy * qy - oz * qz);
    quat.normalize();
  }

  // Physics loop
  useTask((delta) => {
    const dt = Math.min(delta, 1 / 30) / STEPS_PER_FRAME;
    for (let step = 0; step < STEPS_PER_FRAME; step++) {
      simulate(dt);
    }
    // Trigger reactivity
    pos = pos.clone();
    vel = vel.clone();
    omega = omega.clone();
    quat = quat.clone();
  });

  // Slope visual geometry
  const SLOPE_LENGTH = 20;
  const SLOPE_WIDTH  = 4;
</script>

<!-- Ball -->
<T.Mesh position={pos.toArray()} quaternion={quat.toArray()}>
  <T.SphereGeometry args={[BALL_RADIUS, 32, 32]} />
  <T.MeshStandardMaterial color={0xcc2200} transparent opacity={0.9} />
  <Decal src={ballTexture} position={[BALL_RADIUS, 0, 0]} scale={DECAL_SCALE} />
</T.Mesh>

<!-- Slope plane -->
<T.Mesh
  position={[0, 0, 0]}
  rotation.x={-Math.PI / 2 - SLOPE_ANGLE}
>
  <T.PlaneGeometry args={[SLOPE_WIDTH, SLOPE_LENGTH]} />
  <T.MeshStandardMaterial color={0x228833} side={2} />
</T.Mesh>
