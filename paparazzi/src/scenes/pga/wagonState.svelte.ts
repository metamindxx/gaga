/**
 * Wagon Scene - State
 *
 * Controls for speed, steering, and animation.
 */

export const config = $state({
  speed: 0.5
  , steerAngle: 0
  , animate: true
});

export function getSceneProps() {
  return {
    speed: config.speed
    , steerAngle: config.steerAngle
    , animate: config.animate
  };
}
