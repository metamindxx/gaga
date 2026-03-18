export const config = $state({
  // Full rate bivector B (body frame):
  //   Ideal part (e₀₁, e₀₂, e₀₃)    → translational velocity (m/s)
  //   Euclidean part (e₂₃, e₁₃, e₁₂) → angular velocity (rad/s)
  vx: 0 // e₀₁ — velocity in x (m/s)
  , vy: 0 // e₀₂ — velocity in y (m/s)
  , vz: 3 // e₀₃ — velocity in z (m/s), typical cue shot
  , wx: 0 // e₂₃ — spin about x (rad/s), sidespin
  , wy: 0 // e₁₃ — spin about y (rad/s), English
  , wz: -105 // e₁₂ — spin about z (rad/s), backspin (draw shot default)
  , dropHeight: 0.05 // metres above ground
  , stepsPerFrame: 8 // physics substeps per rendered frame
});

export function getSceneProps() {
  return { ...config };
}
