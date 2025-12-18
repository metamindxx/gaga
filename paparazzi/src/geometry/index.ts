/**
 * Geometry Components for Threlte
 *
 * Layers:
 * 1. Primitives - Low-level, position-based (Point, Circle, Sphere, Plane, Direction)
 * 2. Semantic - Collection semantics (Polyline, PointCloud, Trail, PointPair)
 */

// Primitives
export { default as Point } from './Point.svelte';
export { default as Circle } from './Circle.svelte';
export { default as Sphere } from './Sphere.svelte';
export { default as Plane } from './Plane.svelte';
export { default as Direction } from './Direction.svelte';
export { default as Line } from './Line.svelte';
export { default as LineSegments } from './LineSegments.svelte';

// Semantic geometry collections (accept MVs or positions)
export { default as Polyline } from './Polyline.svelte';
export { default as PointCloud } from './PointCloud.svelte';
export { default as Trail } from './Trail.svelte';
export { default as PointPair } from './PointPair.svelte';
