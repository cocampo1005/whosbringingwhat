import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { can, ROLES } from '../utils/permissions';

const RoleContext = createContext({ role: 'anonymous', perms: {}, loading: true, refreshRole: async () => {} });

export function RoleProvider({ children }) {
  const [role, setRole] = useState('anonymous');
  const [loading, setLoading] = useState(true);

  const readClaims = useCallback(async (user, force = false) => {
    if (!user) { setRole('anonymous'); setLoading(false); return; }
    if (force) await user.getIdToken(true);
    const token = await user.getIdTokenResult();
    setRole(token.claims.role || ROLES.COOK);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, (u) => readClaims(u, true));
    return unsub;
  }, [readClaims]);

  const refreshRole = useCallback(async () => {
    await readClaims(auth.currentUser, true);
  }, [readClaims]);

  const perms = useMemo(() => can(role), [role]);

  return <RoleContext.Provider value={{ role, perms, loading, refreshRole }}>{children}</RoleContext.Provider>;
}

export const useRoleState = () => useContext(RoleContext);
export const useRole = () => useContext(RoleContext).role;
export const usePerms = () => useContext(RoleContext).perms;