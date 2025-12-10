/**
 * Renderer - Connects a store to Three.js.
 *
 * Subscribes to store changes and manages Three.js objects.
 * Completely separate from the store - the store knows nothing about this.
 */

/**
 * Create a renderer that syncs store → Three.js.
 */
export function createRenderer(scene, store, handlers) {
  const handles = new Map(); // id → { mesh, update, dispose }

  function getEntity(id) {
    return store.get(id);
  }

  function create(id) {
    const entity = store.get(id);
    if (!entity) return;

    const handler = handlers[entity.type];
    if (!handler) return;

    const handle = handler.create(entity, getEntity, scene);
    if (handle?.mesh) {
      handle.mesh.userData.entityId = id;
      scene.add(handle.mesh);
    }
    handles.set(id, handle);
  }

  function update(id) {
    const handle = handles.get(id);
    if (handle?.update) {
      handle.update();
    }
  }

  function remove(id) {
    const handle = handles.get(id);
    if (handle) {
      if (handle.mesh) scene.remove(handle.mesh);
      handle.dispose?.();
      handles.delete(id);
    }
  }

  // Subscribe to store and hold onto unsubscribe function that gets returned
  const unsubscribe = store.subscribe(({ changeType, id }) => {
    if (changeType === "init") {
      // Create all existing entities
      for (const [entityId] of store.entities) {
        create(entityId);
      }
    } else if (changeType === "add") {
      create(id);
    } else if (changeType === "update") {
      update(id);
    } else if (changeType === "remove") {
      remove(id);
    }
  });

  return {
    /** Get mesh by entity ID (for raycasting) */
    getMesh(id) {
      return handles.get(id)?.mesh;
    }

    // /** Get all meshes for raycasting */
    // , getMeshes() {
    //   return [...handles.values()].map((h) => h.mesh).filter(Boolean);
    // }

    /** Get meshes by entity type */
    , getMeshesByType(type) {
      const result = [];
      for (const [id, handle] of handles) {
        const entity = store.get(id);
        if (entity?.type === type && handle.mesh) {
          result.push(handle.mesh);
        }
      }
      return result;
    }

    /** Stop listening and dispose all */
    , dispose() {
      unsubscribe();
      for (const id of [...handles.keys()]) {
        remove(id);
      }
    }

    , handles
  };
}
