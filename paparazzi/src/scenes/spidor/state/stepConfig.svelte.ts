/**
 * Shared Spidor Step Configuration
 *
 * Used by SpidorFeetDemo (102) and SpidorFull (103).
 */

// ============================================================================
// Step Config State
// ============================================================================

export const stepConfig = $state({
  minTriggerDistance: 0.12
  , stepDurationMs: 220
  , minRestMs: 120
  , finishThreshold: 0.03
});

// ============================================================================
// Scene Props Helper
// ============================================================================

export function getStepProps() {
  return {
    stepMinDist: stepConfig.minTriggerDistance
    , stepDurationMs: stepConfig.stepDurationMs
    , minRestMs: stepConfig.minRestMs
    , stepFinishDist: stepConfig.finishThreshold
  };
}
