import reducer, { sessionExpired } from './authSlice';

const initialState = { status: 'idle', user: null, role: null, permissions: [], error: null };

const ROLE = { name: 'Teacher', permissions: ['ATTENDANCE_VIEW'] };
const USER = { _id: 'u1', name: 'Asha Verma', role: ROLE };

describe('authSlice reducer', () => {
  it('returns the initial state for an unknown action', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('marks status loading while login is pending', () => {
    const state = reducer(initialState, { type: 'auth/login/pending' });
    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('stores the user, role and permissions when login succeeds', () => {
    const state = reducer(initialState, { type: 'auth/login/fulfilled', payload: USER });
    expect(state.status).toBe('authenticated');
    expect(state.user).toEqual(USER);
    expect(state.role).toEqual(ROLE);
    expect(state.permissions).toEqual(ROLE.permissions);
  });

  it('surfaces the rejection message and clears auth on login failure', () => {
    const state = reducer(initialState, { type: 'auth/login/rejected', payload: 'Invalid credentials' });
    expect(state.status).toBe('unauthenticated');
    expect(state.error).toBe('Invalid credentials');
  });

  it('clears user/role/permissions on logout', () => {
    const authenticated = reducer(initialState, { type: 'auth/login/fulfilled', payload: USER });
    const state = reducer(authenticated, { type: 'auth/logout/fulfilled' });
    expect(state).toEqual({ ...initialState, status: 'unauthenticated' });
  });

  it('drops back to unauthenticated when bootstrapSession finds no valid session', () => {
    const state = reducer(initialState, { type: 'auth/bootstrap/rejected' });
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
  });

  it('sessionExpired() clears the session without touching status-unrelated fields like error', () => {
    const authenticated = reducer(initialState, { type: 'auth/login/fulfilled', payload: USER });
    const state = reducer(authenticated, sessionExpired());
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
    expect(state.permissions).toEqual([]);
  });

  it('updateProfile.fulfilled refreshes the user without resetting status', () => {
    const authenticated = reducer(initialState, { type: 'auth/login/fulfilled', payload: USER });
    const updated = { ...USER, name: 'Asha V. Verma' };
    const state = reducer(authenticated, { type: 'auth/updateProfile/fulfilled', payload: updated });
    expect(state.status).toBe('authenticated');
    expect(state.user.name).toBe('Asha V. Verma');
  });
});
