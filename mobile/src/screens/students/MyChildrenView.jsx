import React from 'react';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { avatarColorFor } from '../../theme/patterns';
import { useGetMyChildrenQuery } from '../../store/api/apiSlice';

/** Parent's "Students" tab is their own children, not the school-wide directory (which their role
 * can't call — GET /student/all's middleware doesn't include Parent). */
export function MyChildrenView({ navigation }) {
  const { data, isLoading, isError, error, refetch } = useGetMyChildrenQuery();
  const children = data ?? [];

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={children.length === 0}
        emptyIcon="account-child-outline"
        emptyLabel="No children linked to your account yet"
      >
        {children.map((child) => (
          <AccentListCard
            key={child._id}
            accent={avatarColorFor(child.name).color}
            avatar={<AvatarInitials name={child.name} size={44} />}
            title={child.name}
            subtitle={child.className ? `${child.className} · ${child.sectionName ?? ''}` : 'Class not assigned yet'}
            meta={child.registrationNumber ? [{ label: 'Registration', value: child.registrationNumber }] : []}
            onPress={() => navigation.navigate('StudentDetails', { studentId: child._id })}
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}
