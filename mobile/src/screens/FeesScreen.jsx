import React from 'react';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { useAuth } from '../hooks/useAuth';
import { StudentFeesView } from './fees/StudentFeesView';
import { ParentFeesView } from './fees/ParentFeesView';
import { AccountantFeesView } from './fees/AccountantFeesView';

const HANDLED_ROLES = new Set(['Student', 'Parent', 'Accountant']);

export function FeesScreen() {
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      {role?.name === 'Student' && <StudentFeesView />}
      {role?.name === 'Parent' && <ParentFeesView />}
      {role?.name === 'Accountant' && <AccountantFeesView />}
      {!HANDLED_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="cash-remove" emptyLabel="Fees view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}
