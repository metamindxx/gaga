<script lang="ts">
  /**
   * RenderMv - Render multivector(s) as geometry
   *
   * Classifies the multivector using its attached algebra's helpers
   * and dispatches to the appropriate geometry component (Point, Circle, Sphere, etc.)
   *
   * The MV must come from an algebra with helpers attached (e.g., CGA with bs.helpers = cga)
   *
   * Usage:
   *   Single MV:
   *     <RenderMv mv={somePoint} />
   *     <RenderMv mv={circle} color={0xff0000} />
   *
   *   Array of 2 MVs (segment):
   *     <RenderMv mv={[point1, point2]} />
   *
   *   Array of MVs (polyline):
   *     <RenderMv mv={[p1, p2, p3, p4]} />
   *
   *   Closed polygon:
   *     <RenderMv mv={[p1, p2, p3, p4]} closed />
   *
   *   Draggable point (two-way binding):
   *     <RenderMv bind:mv={point} draggable />
   */

  //   import { Point, Circle, Sphere, Segment } from './index.js';
  import Point from './Point.svelte';
  import Circle from './Circle.svelte';
  import Sphere from './Sphere.svelte';
  import Segment from './Segment.svelte';
  import Plane from './Plane.svelte';
  import Line from './Line.svelte';
  import { useThrelte } from '@threlte/core';
  import { startDrag } from '../stores/dragManager.svelte';
  import type { GeoPrimitive, Coords3D, Point3D } from './primitives.js';
  import {
    pinHoverInfo
    , setHoverInfo
    , clearHoverInfo
    , triggerHoverUpdate
    , isPinnedId
    , type HoverInfo
    , type EditableField
    , type ActionButton
  } from '../stores/hoverInfo.svelte';

  // MV type - any multivector with a classify() method
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type MV = any;

  interface Props {
    /** The multivector(s) to render - single MV or array of MVs */
    mv: MV | MV[];
    /** Override color */
    color?: number | string;
    /** Override opacity */
    opacity?: number;
    /** Point/sphere radius (for point primitives) */
    radius?: number;
    /** Line width (for circles, segments) */
    lineWidth?: number;
    /** If true and mv is an array, close the polygon by connecting last to first */
    closed?: boolean;
    /** Optional label text rendered in 3D space */
    label?: string;
    /** Label shown only in hover box (not in 3D) - if set, overrides label for hover */
    hoverLabel?: string;
    /** Editable fields to show in the infobox when pinned */
    editableFields?: EditableField[];
    /** Action buttons to show in the infobox when pinned */
    actions?: ActionButton[];
    /** Pointer down handler for drag initiation */
    onpointerdown?: (event: { stopPropagation: () => void }) => void;
    /** Enable dragging for points */
    draggable?: boolean;
    /** Constraint plane for dragging: [normal, pointOnPlane] - locks drag to this plane */
    constraintPlane?: [Coords3D, Coords3D] | MV | null;
    /** Called when drag starts */
    ondragstart?: () => void;
    /** Called when drag ends */
    ondragend?: () => void;
    /** Called during drag with new coordinates - handle state update yourself */
    ondrag?: (coords: Coords3D) => void;
    /** Disable hover/click interactions (no hover info box) */
    disableHover?: boolean;
  }

  let {
    mv = $bindable()
    , color = 0x000000
    , opacity = 1
    , radius
    , lineWidth = 0.02
    , closed = false
    , label
    , hoverLabel
    , editableFields
    , actions
    , onpointerdown
    , draggable = true
    , constraintPlane
    , ondragstart
    , ondragend
    , ondrag
    , disableHover = false
  }: Props = $props();

  // Unique ID for this RenderMv instance
  const instanceId = Symbol();

  // Check if mv is an array of MVs
  const isArray = $derived(Array.isArray(mv));

  // For single MV: classify it
  const primitive = $derived<GeoPrimitive | null>(!isArray ? (mv?.classify?.() ?? null) : null);

  // For array of MVs: extract point coordinates from each
  const polylinePoints = $derived.by<Coords3D[]>(() => {
    if (!isArray) return [];
    const points: Coords3D[] = [];
    for (const m of mv as MV[]) {
      const prim = m?.classify?.();
      if (prim?.type === 'point') {
        points.push((prim as Point3D).coords);
      }
    }
    return points;
  });

  // Get coordinates from current MV for drag plane positioning
  function getPosition(): Coords3D {
    if (primitive?.type === 'point') {
      return primitive.coords;
    }
    return [0, 0, 0];
  }

  // Create new MV from coordinates using the algebra's helper
  function createMvFromCoords(coords: Coords3D): MV {
    // Use the algebra's point() helper if available
    const helpers = mv?.bs?.helpers;
    if (helpers?.point) {
      return helpers.point(coords);
    }
    // Fallback: try to find point function on the MV's basisSet
    return null;
  }

  // Drag handler - creates new MV and updates via binding
  function handleDragCoords(coords: Coords3D) {
    // If ondrag callback is provided, let it handle the update
    if (ondrag) {
      ondrag(coords);
      return;
    }
    // Default: create MV and update via binding
    const newMv = createMvFromCoords(coords);
    if (newMv) {
      mv = newMv;
    }
  }

  // Get Threlte context for drag manager
  const { camera, renderer } = useThrelte();

  // Combined pointer down handler
  function handlePointerDown(event: { stopPropagation: () => void }) {
    if (draggable) {
      startDrag({
        camera: camera.current
        , renderer: renderer
        , getPosition
        , onDrag: handleDragCoords
        , constraintPlane
        , onDragStart: ondragstart
        , onDragEnd: () => {
          // Trigger hover update when drag ends (if this element is pinned)
          if (isPinnedId(instanceId)) {
            triggerHoverUpdate();
          }
          ondragend?.();
        }
      });
      event.stopPropagation();
    }
    onpointerdown?.(event);
  }

  // Generate hover info from the multivector
  function getHoverInfo(): HoverInfo {
    const info: HoverInfo = {
      label: hoverLabel ?? label
      , type: primitive?.type ?? (isArray ? 'polyline' : 'unknown')
      , properties: {}
    };

    // Add MV string representation if available
    if (!isArray && mv?.toString) {
      try {
        info.mvString = mv.toStr();
      } catch {
        // Ignore toString errors
      }
    }

    // Add primitive-specific properties
    if (primitive) {
      switch (primitive.type) {
        case 'point':
          info.properties = {
            x: primitive.coords[0].toFixed(3)
            , y: primitive.coords[1].toFixed(3)
            , z: primitive.coords[2].toFixed(3)
          };
          break;
        case 'circle':
          info.properties = {
            cx: primitive.center[0].toFixed(3)
            , cy: primitive.center[1].toFixed(3)
            , cz: primitive.center[2].toFixed(3)
            , radius: primitive.radius.toFixed(3)
          };
          break;
        case 'sphere':
          info.properties = {
            cx: primitive.center[0].toFixed(3)
            , cy: primitive.center[1].toFixed(3)
            , cz: primitive.center[2].toFixed(3)
            , radius: primitive.radius.toFixed(3)
          };
          break;
        case 'pointPair':
          info.properties = {
            p1: `(${primitive.point1.map((v) => v.toFixed(2)).join(', ')})`
            , p2: `(${primitive.point2.map((v) => v.toFixed(2)).join(', ')})`
            , real: primitive.isReal ? 'yes' : 'no'
          };
          break;
        case 'line':
          info.properties = {
            point: `(${primitive.point.map((v) => v.toFixed(2)).join(', ')})`
            , dir: `(${primitive.direction.map((v) => v.toFixed(2)).join(', ')})`
          };
          break;
        case 'plane':
          info.properties = {
            point: `(${primitive.point.map((v) => v.toFixed(2)).join(', ')})`
            , normal: `(${primitive.normal.map((v) => v.toFixed(2)).join(', ')})`
          };
          break;
      }
    } else if (isArray) {
      // Show each point in the polyline
      const pts = polylinePoints;
      info.properties = {
        count: pts.length
        , closed: closed ? 'yes' : 'no'
      };
      // Add each point as p0, p1, p2, etc.
      pts.forEach((pt, i) => {
        info.properties![`p${i}`] =
          `(${pt[0].toFixed(2)}, ${pt[1].toFixed(2)}, ${pt[2].toFixed(2)})`;
      });
    }

    // Add editable fields if provided
    if (editableFields && editableFields.length > 0) {
      info.editableFields = editableFields;
    }

    // Add action buttons if provided
    if (actions && actions.length > 0) {
      info.actions = actions;
    }

    return info;
  }

  // No $effect needed here anymore - hover info is updated:
  // 1. On click (pinHoverInfo sets the value)
  // 2. On drag end (triggerHoverUpdate refreshes from getter)
  // 3. On hover enter/leave (setHoverInfo/clearHoverInfo)

  function handleClick(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    pinHoverInfo(instanceId, getHoverInfo);
  }

  function handlePointerEnter() {
    setHoverInfo(getHoverInfo);
  }

  function handlePointerLeave() {
    clearHoverInfo();
  }
</script>

{#if isArray}
  <!-- Array mode: render as polyline/polygon -->
  {#each polylinePoints as point, i}
    {#if i < polylinePoints.length - 1}
      <Segment
        start={point}
        end={polylinePoints[i + 1]}
        {color}
        {lineWidth}
        {opacity}
        onclick={disableHover ? undefined : handleClick}
        onpointerenter={disableHover ? undefined : handlePointerEnter}
        onpointerleave={disableHover ? undefined : handlePointerLeave}
      />
    {/if}
  {/each}
  <!-- Close the polygon if requested -->
  {#if closed && polylinePoints.length > 2}
    <Segment
      start={polylinePoints[polylinePoints.length - 1]}
      end={polylinePoints[0]}
      {color}
      {lineWidth}
      {opacity}
      onclick={disableHover ? undefined : handleClick}
      onpointerenter={disableHover ? undefined : handlePointerEnter}
      onpointerleave={disableHover ? undefined : handlePointerLeave}
    />
  {/if}
{:else if primitive}
  {#if primitive.type === 'point'}
    <Point
      position={primitive.coords}
      radius={radius ?? 0.05}
      {color}
      {opacity}
      {label}
      onpointerdown={draggable ? handlePointerDown : onpointerdown}
      onclick={disableHover ? undefined : handleClick}
      onpointerenter={disableHover ? undefined : handlePointerEnter}
      onpointerleave={disableHover ? undefined : handlePointerLeave}
    />
  {:else if primitive.type === 'direction'}
    <!-- Direction: render as a line from origin -->
    <Segment
      start={[0, 0, 0]}
      end={primitive.vector}
      {color}
      {lineWidth}
      {opacity}
      {label}
      onclick={disableHover ? undefined : handleClick}
      onpointerenter={disableHover ? undefined : handlePointerEnter}
      onpointerleave={disableHover ? undefined : handlePointerLeave}
    />
  {:else if primitive.type === 'pointPair'}
    <!-- Point pair: render both points -->
    <Point
      position={primitive.point1}
      radius={radius ?? 0.05}
      {color}
      opacity={primitive.isReal ? opacity : opacity * 0.5}
      {label}
      onclick={disableHover ? undefined : handleClick}
      onpointerenter={disableHover ? undefined : handlePointerEnter}
      onpointerleave={disableHover ? undefined : handlePointerLeave}
    />
    <Point
      position={primitive.point2}
      radius={radius ?? 0.05}
      {color}
      opacity={primitive.isReal ? opacity : opacity * 0.5}
      onclick={disableHover ? undefined : handleClick}
      onpointerenter={disableHover ? undefined : handlePointerEnter}
      onpointerleave={disableHover ? undefined : handlePointerLeave}
    />
    <!-- Connect with a segment if distinct -->
    {#if primitive.point1[0] !== primitive.point2[0] || primitive.point1[1] !== primitive.point2[1] || primitive.point1[2] !== primitive.point2[2]}
      <Segment
        start={primitive.point1}
        end={primitive.point2}
        {color}
        {lineWidth}
        opacity={opacity * 0.5}
        onclick={disableHover ? undefined : handleClick}
        onpointerenter={disableHover ? undefined : handlePointerEnter}
        onpointerleave={disableHover ? undefined : handlePointerLeave}
      />
    {/if}
  {:else if primitive.type === 'circle'}
    <Circle
      center={primitive.center}
      radius={primitive.radius}
      normal={primitive.normal}
      {color}
      {lineWidth}
      {opacity}
      {label}
      onclick={disableHover ? undefined : handleClick}
      onpointerenter={disableHover ? undefined : handlePointerEnter}
      onpointerleave={disableHover ? undefined : handlePointerLeave}
    />
  {:else if primitive.type === 'line'}
    <Line
      point={primitive.point}
      direction={primitive.direction}
      extent={10}
      {color}
      {lineWidth}
      {opacity}
      {label}
      onclick={disableHover ? undefined : handleClick}
      onpointerenter={disableHover ? undefined : handlePointerEnter}
      onpointerleave={disableHover ? undefined : handlePointerLeave}
    />
  {:else if primitive.type === 'sphere'}
    <Sphere
      center={primitive.center}
      radius={radius ?? primitive.radius}
      {color}
      {opacity}
      {label}
      onclick={disableHover ? undefined : handleClick}
      onpointerenter={disableHover ? undefined : handlePointerEnter}
      onpointerleave={disableHover ? undefined : handlePointerLeave}
    />
  {:else if primitive.type === 'plane'}
    <Plane
      normal={primitive.normal}
      distance={primitive.distance ?? 0}
      size={5}
      {color}
      {opacity}
      onclick={disableHover ? undefined : handleClick}
      onpointerenter={disableHover ? undefined : handlePointerEnter}
      onpointerleave={disableHover ? undefined : handlePointerLeave}
    />
  {/if}
{/if}
