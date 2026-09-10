import { useDispatch, useSelector } from 'react-redux';
import { login, logout } from '../store/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const { status, user, role, permissions, error } = useSelector((state) => state.auth);

  return {
    status,
    user,
    role,
    permissions,
    error,
    isAuthenticated: status === 'authenticated',
    isBooting: status === 'idle' || status === 'loading',
    signIn: (email, password) => dispatch(login({ email, password })),
    signOut: () => dispatch(logout()),
  };
}

/** True if the current role's permissions grant `action` on `module` (e.g. hasPermission('Attendance', 'create')). */
export function hasPermission(permissions, moduleName, action) {
  if (!permissions) return false;
  const entry = permissions.find((p) => p.module?.toLowerCase() === moduleName.toLowerCase());
  return Boolean(entry?.actions?.includes(action));
}
