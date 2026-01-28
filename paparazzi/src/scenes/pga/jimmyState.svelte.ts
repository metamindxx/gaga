/**
 * Jimmy Animation Slide - State
 */

export const config = $state({
  animWeights: [1.0, 0, 0, 0, 0, 0]
  , speed: 1.0
  , debugNoSkinning: false
  , debugIdentity: false
});

export const jimmyAnimNames = ['Walk', 'Jump', 'Run', 'Stride', 'Idle', 'Zombie'];

export function getSceneProps() {
  return {
    animWeights: config.animWeights
    , speed: config.speed
    , debugNoSkinning: config.debugNoSkinning
    , debugIdentity: config.debugIdentity
  };
}

// Helper for updating individual animation weights
export function setAnimWeight(index: number, value: number): void {
  config.animWeights[index] = value;
  config.animWeights = [...config.animWeights]; // Trigger reactivity
}
