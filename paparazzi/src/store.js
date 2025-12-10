/**
 * Minimal store with dependency tracking.
 *
 * Algebra-agnostic: knows nothing about multivectors, CGA, PGA, or Three.js.
 * Just stores entities with arbitrary data and tracks dependencies.
 */

/**
 * Create a store.
 */
export function createStore() {
  const entities = new Map(); // id → entity
  const dependents = new Map(); // id → Set<ids that depend on this>
  const subscribers = new Set();

  let idCounter = 0;

  function notify(changeType, id) {
    const snapshot = { entities, changeType, id };
    for (const fn of subscribers) {
      try {
        fn(snapshot);
      } catch (e) {
        console.error(e);
      }
    }
  }

  function trackDeps(entity) {
    if (!entity.refs) return;
    for (const refId of entity.refs) {
      if (!dependents.has(refId)) dependents.set(refId, new Set());
      dependents.get(refId).add(entity.id);
    }
  }

  function untrackDeps(entity) {
    if (!entity.refs) return;
    for (const refId of entity.refs) {
      dependents.get(refId)?.delete(entity.id);
    }
  }

  return {
    /**
     * Subscribe to store changes.
     */
    subscribe(fn) {
      subscribers.add(fn);
      fn({ entities, changeType: "init", id: null });
      return () => subscribers.delete(fn);
    }

    /**
     * Add an entity. Auto-generates ID if missing.
     * @param {Object} entity - { type, ...data, refs?: string[] }
     */
    , add(entity) {
      if (!entity.id) {
        entity.id = `${entity.type ?? "store_item"}_${++idCounter}`;
      }
      entities.set(entity.id, entity);
      trackDeps(entity);
      notify("add", entity.id);
      return entity;
    }

    /**
     * Update an entity. Merges updates into existing entity.
     * Triggers dependent updates.
     */
    , update(id, updates) {
      const entity = entities.get(id);
      if (!entity) return null;

      Object.assign(entity, updates);
      notify("update", id);

      // Cascade to dependents
      const deps = dependents.get(id);
      if (deps) {
        for (const depId of deps) {
          notify("update", depId);
        }
      }
      return entity;
    }

    /**
     * Get an entity by ID.
     */
    , get(id) {
      return entities.get(id);
    }

    /**
     * Check if entity exists.
     */
    , has(id) {
      return entities.has(id);
    }

    /**
     * Remove an entity.
     */
    , remove(id) {
      const entity = entities.get(id);
      if (!entity) return false;

      untrackDeps(entity);
      entities.delete(id);
      dependents.delete(id);
      notify("remove", id);
      return true;
    }

    /**
     * Clear all entities.
     */
    , clear() {
      for (const id of [...entities.keys()]) {
        this.remove(id);
      }
    }

    /**
     * Iterate entities.
     */
    , get entities() {
      return entities;
    }

    /**
     * Get IDs that depend on given ID.
     */
    , getDependents(id) {
      return dependents.get(id) ?? new Set();
    }
  };
}
