import React from 'react';
import { RoleDirectoryView } from './superAdmin/RoleDirectoryView';

export function AccountantsScreen() {
  return <RoleDirectoryView title="Accountants" icon="calculator-variant-outline" roleNames={['Accountant']} />;
}
