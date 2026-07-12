import React from 'react';
import { RoleDirectoryView } from './superAdmin/RoleDirectoryView';

export function LibrariansScreen() {
  return <RoleDirectoryView title="Librarians" icon="bookshelf" roleNames={['Librarian']} />;
}
