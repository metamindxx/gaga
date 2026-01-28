/**
 * Spidor Foot Slide - State
 */

export const config = $state({
  minTriggerDistance: 0.12
  , stepDurationMs: 220
  , minRestMs: 120
  , finishThreshold: 0.03
  , neighborAMoving: false
  , neighborBMoving: false
  , targetRadius: 0.6
  , targetSpeed: 0.35
});

export function getSceneProps() {
  return {
    stepMinDist: config.minTriggerDistance
    , stepDurationMs: config.stepDurationMs
    , minRestMs: config.minRestMs
    , stepFinishDist: config.finishThreshold
    , neighborA: config.neighborAMoving
    , neighborB: config.neighborBMoving
    , targetRadius: config.targetRadius
    , targetSpeed: config.targetSpeed
  };
}
