import { useMemo } from 'react';
import { useAuth, hasPermission } from '../hooks/useAuth';

/**
 * The signed-in caller, in the shape every descriptor callback receives.
 *
 * `can()` reads the role's granular permissions array, but several backend routes are gated by
 * role NAME instead (leave approval, notification broadcast, the student roster), and for those
 * the permissions array may hold no entry at all even for a fully-allowed role. So descriptors
 * gate on `is()` where the backend gates on role name, and on `can()` only where the backend
 * genuinely checks permissions — mirroring the server rather than guessing.
 */
export function useModuleContext() {
  const { user, role, permissions } = useAuth();

  return useMemo(() => {
    const roleName = role?.name ?? null;
    return {
      user,
      role,
      roleName,
      permissions,
      can: (moduleName, action) => hasPermission(permissions, moduleName, action),
      is: (...names) => names.includes(roleName),
    };
  }, [user, role, permissions]);
}
