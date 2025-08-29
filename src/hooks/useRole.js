import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export function useRole() {
  const [role, setRole] = useState('anonymous');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setRole('anonymous');
      // force refresh to pick up any newly set custom claims
      const token = await user.getIdTokenResult(true);
      // debuging 
      await auth.currentUser?.getIdToken(true);           // force refresh
      const t = await auth.currentUser.getIdTokenResult();
      // console.log('claims:', t.claims); // debug only
      // console.log('role:', token.claims.role); // debug only
      setRole(token.claims.role || 'cook'); // default to cook
    });
    return unsub;
  }, []);

  return role;
}