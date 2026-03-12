/**
 * Newton's Cradle State
 */

export const config = $state({
  collisionModel: 'impulse' as 'spring' | 'impulse'
});

export function getSceneProps() {
  return {
    collisionModel: config.collisionModel
  };
}
