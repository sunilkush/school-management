import React from 'react';
import { RoleDirectoryView } from './superAdmin/RoleDirectoryView';

// Web's Transport.jsx filters roles "Driver" and "Transporter" — NOT "Transport Manager" despite
// the nav label — confirmed against the actual frontend page.
export function TransportUsersScreen() {
  return <RoleDirectoryView title="Transport Users" icon="bus" roleNames={['Driver', 'Transporter']} />;
}
