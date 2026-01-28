/**
 * Spidor Full Slide - State
 */

import { getStepProps } from './stepConfig.svelte';

export const config = $state({
  segmentCount: 3
  , segmentLength: 0.2
  , lockToPlane: true
  , useKneeHint: true
  , kneePosition: 0.9
  , solverIterations: 4
  , showVisualization: true
});

export function getSceneProps() {
  return {
    ...getStepProps()
    , segmentCount: config.segmentCount
    , segmentLength: config.segmentLength
    , lockToPlane: config.lockToPlane
    , setKnee: config.useKneeHint
    , kneePosition: config.kneePosition
    , solveN: config.solverIterations
    , showViz: config.showVisualization
  };
}
