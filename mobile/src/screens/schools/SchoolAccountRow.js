import React from 'react';
import { IconButton } from 'react-native-paper';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { STATUS_SEMANTICS } from '../../theme/patterns';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useActivateSchoolAccountMutation,
  useDeactivateSchoolAccountMutation,
  useDeleteSchoolAccountMutation,
} from '../../store/api/apiSlice';

export function SchoolAccountRow({ school }) {
  const { colors } = useAppTheme();
  const [activateSchool, activateState] = useActivateSchoolAccountMutation();
  const [deactivateSchool, deactivateState] = useDeactivateSchoolAccountMutation();
  const [deleteSchool, deleteState] = useDeleteSchoolAccountMutation();
  const busy = activateState.isLoading || deactivateState.isLoading || deleteState.isLoading;

  return (
    <AccentListCard
      accent={school.isActive ? STATUS_SEMANTICS.active.dot : STATUS_SEMANTICS.inactive.dot}
      avatar={<IconWell icon="domain" color={colors.primary} size={40} />}
      title={school.name}
      subtitle={school.email}
      badge={
        <StatusPill
          label={school.isActive ? 'Active' : 'Inactive'}
          color={school.isActive ? STATUS_SEMANTICS.active.dot : STATUS_SEMANTICS.inactive.dot}
        />
      }
      meta={[
        { label: 'Phone', value: school.phone },
        { label: 'Address', value: school.address },
        { label: 'Boards', value: (school.boards ?? []).map((b) => b.name).join(', ') },
        { label: 'Plan', value: school.subscriptionPlan?.name },
      ]}
      expandable
      actions={
        <>
          <IconButton
            icon={school.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
            iconColor={school.isActive ? '#F59E0B' : '#22C55E'}
            size={20}
            disabled={busy}
            onPress={() => (school.isActive ? deactivateSchool(school._id) : activateSchool(school._id))}
          />
          <IconButton
            icon="trash-can-outline"
            iconColor={colors.danger}
            size={18}
            disabled={busy}
            onPress={() => deleteSchool(school._id)}
          />
        </>
      }
    />
  );
}
