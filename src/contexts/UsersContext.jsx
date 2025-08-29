import React, { createContext, useContext, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { db } from "../firebase"
import { doc, onSnapshot } from "firebase/firestore"

/**
 * 	
 * Keeps a global Map<userId, userData> cache.
 * Tracks subscriptions with a ref-count; multiple components can subscribe to the same userId without duplicating Firestore listeners.
 * Unsubscribes automatically when nobody needs that user anymore.
 */


const UsersContext = createContext(null);

export function UsersProvider({ children }) {
  // Map<userId, userData>
  const [users, setUsers] = useState(() => new Map());

  // Internal: Map<userId, { unsub: Function, count: number }>
  const listenersRef = useRef(new Map());

  // --- Internal helpers ---

  const upsertUser = (userId, dataOrNull) => {
    setUsers((prev) => {
      const next = new Map(prev);
      const current = next.get(userId);
        const same =
          (current === undefined && dataOrNull === undefined) ||
          (current === null && dataOrNull === null) ||
          (current && dataOrNull && JSON.stringify(current) === JSON.stringify(dataOrNull));
        if (same) return prev; // no-op (prevents pointless re-renders)
        if (dataOrNull == null) next.delete(userId);
        else next.set(userId, dataOrNull);
      return next;
    });
  };

  const startListenerIfNeeded = (userId) => {
    if (!userId) return;

    const listeners = listenersRef.current;
    const existing = listeners.get(userId);

    if (existing?.unsub) {
      // already listening
      existing.count += 1;
      return;
    }

    // create new listener
    const ref = doc(db, "users", userId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          upsertUser(userId, { id: snap.id, ...snap.data() });
        } else {
          // user doc deleted or not found
          upsertUser(userId, null);
        }
      },
      (err) => {
        console.error("[UsersStore] onSnapshot error for", userId, err);
      }
    );

    listeners.set(userId, { unsub, count: 1 });
  };

  const addRefs = (ids) => {
    const setIds = new Set(ids.filter(Boolean));
    setIds.forEach((id) => startListenerIfNeeded(id));
  };

  const releaseRefs = (ids) => {
    const listeners = listenersRef.current;
    ids.filter(Boolean).forEach((id) => {
      const entry = listeners.get(id);
      if (!entry) return;
      entry.count -= 1;
      if (entry.count <= 0) {
        try {
          entry.unsub?.();
        } finally {
          listeners.delete(id);
        }
      }
    });
  };

  // optional: clean up all listeners if the provider unmounts
  useEffect(() => {
    return () => {
      const listeners = listenersRef.current;
      for (const [, { unsub }] of listeners) {
        try { unsub?.(); } catch {}
      }
      listeners.clear();
    };
  }, []);

 // stable methods (don’t change identity on every users change)
  const getUser = useCallback((id) => users.get(id), [users]);
  const getUsers = useCallback((ids = []) => ids.map((id) => users.get(id)), [users]);
  const acquire = useCallback((ids = []) => addRefs(ids), []);
  const release = useCallback((ids = []) => releaseRefs(ids), []);
   const value = useMemo(
    () => ({ getUser, getUsers, acquire, release }),
    [getUser, getUsers, acquire, release]
  );
  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsersStore() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsersStore must be used within <UsersProvider>");
  return ctx;
}

/**
 * Subscribes to one userId and returns { user, status }
 * status: "loading" (no value yet), "ready" (has user or null)
 */
export function useUser(userId) {
  const { getUser, acquire, release } = useUsersStore();

  useEffect(() => {
    if (!userId) return;
    acquire([userId]);
    return () => release([userId]);
  }, [userId]);

  const user = getUser(userId);
  const status = user === undefined ? "loading" : "ready";
  return { user, status };
}

/**
 * Subscribes to multiple userIds and returns { users, status }
 * users: array aligned to the input ids (each element can be object | null | undefined)
 * status: "loading" if any are undefined; otherwise "ready"
 */
export function useUsers(userIds = []) {
  const { getUsers, acquire, release } = useUsersStore();
  const idsKey = JSON.stringify(userIds?.filter(Boolean) || []);

  useEffect(() => {
    const ids = userIds?.filter(Boolean) || [];
    if (ids.length === 0) return;
    acquire(ids);
    return () => release(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const list = getUsers(userIds || []);
  const status = list.some((u) => u === undefined) ? "loading" : "ready";
  return { users: list, status };
}
