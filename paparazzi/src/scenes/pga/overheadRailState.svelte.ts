/**
 * Overhead Rail Scene - State
 *
 * Controls for speed, animation, position, and individual latch states.
 */

export const config = $state({
  speed: 1.0
  , animate: true
  , cartPosition: 0 // 0..1 normalized along rail
  , latches: [false, false, false, false, false, false] as boolean[]
});

export function getSceneProps() {
  return {
    speed: config.speed
    , animate: config.animate
    , cartPosition: config.cartPosition
    , latches: config.latches
  };
}
