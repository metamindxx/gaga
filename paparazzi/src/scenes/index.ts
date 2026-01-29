/**
 * Scene Registration - All scenes registered in one place
 */

import { registerGroup, registerScene } from '../stores/sceneRegistry.svelte';

// ============================================================================
// Groups
// ============================================================================

registerGroup({ id: 'robot', name: 'CGA Robot Demos', icon: '🤖', order: 1 });
registerGroup({ id: 'spidor', name: 'Spidor Demos', icon: '🕷️', order: 2 });
registerGroup({ id: 'pga', name: 'PGA Demos', icon: '📐', order: 3 });

// ============================================================================
// Robot Demos
// ============================================================================

import Slide20Refactored from './robot/Slide20Refactored.svelte';
import Slide22Refactored from './robot/Slide22Refactored.svelte';
import Slide24Refactored from './robot/Slide24Refactored.svelte';
import Slide28Refactored from './robot/Slide28Refactored.svelte';
import Slide30Refactored from './robot/Slide30Refactored.svelte';
import Slide35Refactored from './robot/Slide35Refactored.svelte';
import Slide38Refactored from './robot/Slide38Refactored.svelte';

registerScene({
  id: 20
  , name: 'Robot Arm FK (3D)'
  , groupId: 'robot'
  , component: Slide20Refactored
});
registerScene({
  id: 22
  , name: 'Robot Arm FK (CGA)'
  , groupId: 'robot'
  , component: Slide22Refactored
});
registerScene({ id: 24, name: 'Robot Arm IK', groupId: 'robot', component: Slide24Refactored });
registerScene({ id: 28, name: 'Agile Eye 2-DOF', groupId: 'robot', component: Slide28Refactored });
registerScene({ id: 30, name: 'Agile Eye 3-DOF', groupId: 'robot', component: Slide30Refactored });
registerScene({ id: 35, name: 'Delta Robot FK', groupId: 'robot', component: Slide35Refactored });
registerScene({ id: 38, name: 'Delta Robot IK', groupId: 'robot', component: Slide38Refactored });

// ============================================================================
// Spidor Demos
// ============================================================================

import LegDemo from './spidor/demos/LegDemo.svelte';
import LegConfig from './spidor/config/LegConfig.svelte';
import { getSceneProps as getLegProps } from './spidor/state/legState.svelte';
import FootDemo from './spidor/demos/FootDemo.svelte';
import FootConfig from './spidor/config/FootConfig.svelte';
import { getSceneProps as getFootProps } from './spidor/state/footState.svelte';
import FeetDemo from './spidor/demos/FeetDemo.svelte';
import FeetConfig from './spidor/config/FeetConfig.svelte';
import { getStepProps } from './spidor/state/stepConfig.svelte';
import Full from './spidor/components/Full.svelte';
import FullConfig from './spidor/config/FullConfig.svelte';
import { getSceneProps as getFullProps } from './spidor/state/fullState.svelte';

registerScene({
  id: 100
  , name: 'Spidor Leg'
  , groupId: 'spidor'
  , component: LegDemo
  , getSceneProps: getLegProps
  , ConfigPanel: LegConfig
});
registerScene({
  id: 101
  , name: 'Spidor Foot'
  , groupId: 'spidor'
  , component: FootDemo
  , getSceneProps: getFootProps
  , ConfigPanel: FootConfig
});
registerScene({
  id: 102
  , name: 'Spidor Feet'
  , groupId: 'spidor'
  , component: FeetDemo
  , getSceneProps: getStepProps
  , ConfigPanel: FeetConfig
});
registerScene({
  id: 103
  , name: 'Spidor Full'
  , groupId: 'spidor'
  , component: Full
  , getSceneProps: getFullProps
  , ConfigPanel: FullConfig
});

// ============================================================================
// PGA Demos (includes SU2/Spinor demos)
// ============================================================================

import PgaDemo from './pga/PgaDemo.svelte';
import PgaDynamics from './pga/PgaDynamics.svelte';
import JimmyAnimation from './pga/JimmyAnimation.svelte';
import JimmyConfig from './pga/JimmyConfig.svelte';
import { getSceneProps as getJimmyProps } from './pga/jimmyState.svelte';
import Skinning from './pga/Skinning.svelte';
import SkinningConfig from './pga/SkinningConfig.svelte';
import { getSceneProps as getSkinningProps } from './pga/skinningState.svelte';
import Dandelion from './su2/Dandelion.svelte';
import DoubletsSU2 from './su2/DoubletsSU2.svelte';
import SpinorSU2 from './su2/SpinorSU2.svelte';
import SpinorConfig from './su2/SpinorConfig.svelte';

registerScene({ id: 99, name: 'PGA Demo', groupId: 'pga', component: PgaDemo });
registerScene({ id: 110, name: 'PGA Dynamics', groupId: 'pga', component: PgaDynamics });
registerScene({
  id: 50
  , name: 'Jimmy Animation'
  , groupId: 'pga'
  , component: JimmyAnimation
  , getSceneProps: getJimmyProps
  , ConfigPanel: JimmyConfig
});
registerScene({
  id: 51
  , name: 'Skinning (DQS)'
  , groupId: 'pga'
  , component: Skinning
  , getSceneProps: getSkinningProps
  , ConfigPanel: SkinningConfig
});
registerScene({
  id: 111
  , name: 'Spinor SU(2)'
  , groupId: 'pga'
  , component: SpinorSU2
  , ConfigPanel: SpinorConfig
  , defaultVisible: true
});
registerScene({ id: 112, name: 'Doublets SU(2)', groupId: 'pga', component: DoubletsSU2 });
registerScene({ id: 113, name: 'Dandelion SU(2)', groupId: 'pga', component: Dandelion });
