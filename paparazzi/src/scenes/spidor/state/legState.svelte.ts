/**
 * Spidor Leg Slide - State
 */

export const config = $state({
  segmentCount: 3
  , segmentLength: 0.2
  , lockToPlane: false
  , useKneeHint: false
  , kneePosition: 0.9
  , solverIterations: 1
});

export function getSceneProps() {
  return {
    segmentCount: config.segmentCount
    , segmentLength: config.segmentLength
    , lockToPlane: config.lockToPlane
    , setKnee: config.useKneeHint
    , kneePosition: config.kneePosition
    , solveN: config.solverIterations
  };
}
