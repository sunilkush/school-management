import React from 'react';
import { RoleDirectoryView } from './superAdmin/RoleDirectoryView';

export function SchoolAdminsScreen() {
  return <RoleDirectoryView title="School Admins" icon="account-tie-outline" roleNames={['School Admin']} />;
}
