import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { resolveRoleNav } from './resolveRoleNav';
import { TabShell } from './TabShell';

/**
 * Every role gets the same bottom-tab shell — a curated nav (constants/roles.js) for the 11 roles
 * named in the brief, or a permissions-derived fallback for any other role (custom roles, or ones
 * like "HR" the backend doesn't reliably seed permissions for). See resolveRoleNav.js for how
 * items are chosen, filtered, and split into quick tabs vs the "More" overflow tab.
 */
export function AppShell() {
  const { role, permissions } = useAuth();

  const nav = useMemo(() => resolveRoleNav(role?.name, permissions), [role?.name, permissions]);

  return <TabShell quickItems={nav.quickItems} moreItems={nav.moreItems} />;
}
