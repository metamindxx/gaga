/**
 * Skinning Slide - State
 */

export const config = $state({
  useDQS: true
  , rotationAngle: 0.5
  , animate: true
  , animationSpeed: 1.0
});

export function getSceneProps() {
  return {
    useDQS: config.useDQS
    , rotationAngle: config.rotationAngle
    , animate: config.animate
    , animationSpeed: config.animationSpeed
  };
}

// Setter for external updates (e.g., animation)
export function setRotationAngle(angle: number): void {
  config.rotationAngle = angle;
}
