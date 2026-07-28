import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { CreateDesignationSheet } from './superAdmin/CreateDesignationSheet';
import { useAppTheme } from '../theme/ThemeProvider';
import { confirmDelete } from '../utils/confirm';
import { useDeleteDesignationMutation, useGetDesignationsQuery } from '../store/api/apiSlice';

const LEVEL_COLOR = { Senior: '#7C3AED', Mid: '#2563EB', Junior: '#22C55E' };

export function DesignationsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetDesignationsQuery();
  const designations = data ?? [];
  const [deleteDesignation, deleteState] = useDeleteDesignationMutation();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="badge-account-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Designations</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)}>
          New Designation
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={designations.length === 0}
        emptyIcon="badge-account-outline"
        emptyLabel="No designations yet"
      >
        {designations.map((d) => (
          <AccentListCard
            key={d._id}
            accent={LEVEL_COLOR[d.level] || colors.primary}
            avatar={<IconWell icon="badge-account-outline" color={LEVEL_COLOR[d.level] || colors.primary} size={40} />}
            title={d.title}
            subtitle={d.departmentId?.name ?? ''}
            badge={<StatusPill label={d.level} color={LEVEL_COLOR[d.level] || colors.textMuted} />}
            meta={[...(d.description ? [{ label: 'Description', value: d.description }] : [])]}
            expandable
            actions={
              <>
                <IconButton icon="pencil-outline" size={18} onPress={() => setEditingDesignation(d)} />
                <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} disabled={deleteState.isLoading} onPress={() => confirmDelete(() => deleteDesignation(d._id), 'this designation')} />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateDesignationSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
      <CreateDesignationSheet visible={!!editingDesignation} designation={editingDesignation} onDismiss={() => setEditingDesignation(null)} onCreated={() => setEditingDesignation(null)} />
    </ScreenContainer>
  );
}
