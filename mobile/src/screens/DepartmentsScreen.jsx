import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateDepartmentSheet } from './superAdmin/CreateDepartmentSheet';
import { useAppTheme } from '../theme/ThemeProvider';
import { confirmDelete } from '../utils/confirm';
import { useDeleteDepartmentMutation, useGetDepartmentsQuery } from '../store/api/apiSlice';

const STATUS_COLOR = { active: '#22C55E', inactive: '#94A3B8' };

export function DepartmentsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetDepartmentsQuery();
  const departments = data ?? [];
  const [deleteDepartment, deleteState] = useDeleteDepartmentMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="office-building-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Departments</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Department
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={departments.length === 0}
        emptyIcon="office-building-outline"
        emptyLabel="No departments yet"
      >
        {departments.map((d) => (
          <AccentListCard
            key={d._id}
            accent={STATUS_COLOR[d.status] || colors.primary}
            avatar={<IconWell icon="office-building-outline" color={STATUS_COLOR[d.status] || colors.primary} size={40} />}
            title={d.name}
            subtitle={d.head ? `Head: ${d.head}` : ''}
            badge={<StatusPill label={d.status} color={STATUS_COLOR[d.status] || colors.textMuted} />}
            meta={[
              ...(d.code ? [{ label: 'Code', value: d.code }] : []),
              ...(d.description ? [{ label: 'Description', value: d.description }] : []),
            ]}
            expandable
            actions={
              <>
                <IconButton icon="pencil-outline" size={18} onPress={() => setEditingDept(d)} />
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteState.isLoading} onPress={() => confirmDelete(() => deleteDepartment(d._id), 'this department')} />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateDepartmentSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
      <CreateDepartmentSheet visible={!!editingDept} department={editingDept} onDismiss={() => setEditingDept(null)} onCreated={() => setEditingDept(null)} />
    </ScreenContainer>
  );
}
