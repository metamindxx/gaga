/**
 * Scene Registry - Scene self-registration and visibility management
 */

import type { Component } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

// Types
export interface SceneGroup {
  id: string;
  name: string;
  icon: string;
  order: number;
}
export interface SceneRegistration {
  id: number;
  name: string;
  groupId: string;
  component: Component<Record<string, unknown>>;
  getSceneProps?: () => Record<string, unknown>;
  ConfigPanel?: Component<Record<string, never>>;
  defaultVisible?: boolean;
}

// State (SvelteMap is inherently reactive, no $state needed)
const groups = new SvelteMap<string, SceneGroup>();
const scenes = new SvelteMap<number, SceneRegistration>();
const visibility = new SvelteMap<number, boolean>();

// Groups
export function registerGroup(group: SceneGroup) {
  groups.set(group.id, group);
}
export function getGroups() {
  return [...groups.values()].sort((a, b) => a.order - b.order);
}
export function getGroup(id: string) {
  return groups.get(id);
}

// Scenes
export function registerScene(scene: SceneRegistration) {
  scenes.set(scene.id, scene);
  if (!visibility.has(scene.id)) visibility.set(scene.id, scene.defaultVisible ?? false);
}
export function getScenes() {
  return [...scenes.values()];
}
export function getScenesForGroup(groupId: string) {
  return [...scenes.values()].filter((s) => s.groupId === groupId);
}
export function getScene(id: number) {
  return scenes.get(id);
}
export function getVisibleScenes() {
  return [...scenes.values()].filter((s) => visibility.get(s.id));
}

// Visibility
export function isVisible(id: number) {
  return visibility.get(id) ?? false;
}
export function setVisible(id: number, visible: boolean) {
  visibility.set(id, visible);
}
export function toggleVisible(id: number) {
  visibility.set(id, !visibility.get(id));
}
export function showOnly(id: number) {
  for (const sid of scenes.keys()) visibility.set(sid, sid === id);
}

export function showGroup(groupId: string) {
  for (const s of scenes.values()) if (s.groupId === groupId) visibility.set(s.id, true);
}
export function hideGroup(groupId: string) {
  for (const s of scenes.values()) if (s.groupId === groupId) visibility.set(s.id, false);
}
export function isGroupPartiallyVisible(groupId: string) {
  return [...scenes.values()].some((s) => s.groupId === groupId && visibility.get(s.id));
}
export function isGroupFullyVisible(groupId: string) {
  const gs = getScenesForGroup(groupId);
  return gs.length > 0 && gs.every((s) => visibility.get(s.id));
}

// Reactive exports
export const registry = {
  get groups() {
    return getGroups();
  }
  , get scenes() {
    return getScenes();
  }
  , get visibleScenes() {
    return getVisibleScenes();
  }
};
