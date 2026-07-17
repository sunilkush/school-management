import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { QueryState } from '../../../components/ui/QueryState';
import { AccentListCard } from '../../../components/ui/AccentListCard';
import { StatusPill } from '../../../components/ui/StatusPill';
import { useAuth } from '../../../hooks/useAuth';
import { useAppTheme } from '../../../theme/ThemeProvider';
import {
  useGetAcademicYearsBySchoolQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
  useActivateAcademicYearMutation,
  useArchiveAcademicYearMutation,
  useDeleteAcademicYearMutation,
} from '../../../store/api/apiSlice';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

function YearFormSheet({ visible, initial, onDismiss, onSaved }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  const [createYear, createState] = useCreateAcademicYearMutation();
  const [updateYear, updateState] = useUpdateAcademicYearMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setStartDate(initial?.startDate ? initial.startDate.slice(0, 10) : '');
      setEndDate(initial?.endDate ? initial.endDate.slice(0, 10) : '');
      setError(null);
    }
  }, [visible, initial]);

  const handleSave = async () => {
    if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
      setError('Enter valid dates (YYYY-MM-DD)');
      return;
    }
    try {
      const startISO = new Date(startDate).toISOString();
      const endISO = new Date(endDate).toISOString();
      if (initial) {
        await updateYear({ id: initial._id, startDate: startISO, endDate: endISO }).unwrap();
      } else {
        await createYear({ schoolId, startDate: startISO, endDate: endISO }).unwrap();
      }
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Failed to save');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
          {initial ? 'Edit Academic Year' : 'Create Academic Year'}
        </Text>
        <TextInput label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} mode="outlined" style={{ marginBottom: spacing.sm }} />
        <TextInput label="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} mode="outlined" style={{ marginBottom: spacing.sm }} />
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
          The year name (e.g. 2025-2026) is auto-generated from the selected dates.
        </Text>
        {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saving}>Cancel</Button>
          <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ flex: 1 }}>Save</Button>
        </View>
      </Modal>
    </Portal>
  );
}

export function AcademicYearStep() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;

  const { data, isLoading, isError, error, refetch } = useGetAcademicYearsBySchoolQuery(schoolId, { skip: !schoolId });
  const years = [...(data ?? [])].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const [activateYear, activateState] = useActivateAcademicYearMutation();
  const [archiveYear, archiveState] = useArchiveAcademicYearMutation();
  const [deleteYear, deleteState] = useDeleteAcademicYearMutation();
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" compact onPress={() => { setEditing(null); setFormVisible(true); }}>
          New Year
        </Button>
      </View>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} isEmpty={years.length === 0} emptyIcon="calendar-outline" emptyLabel="No academic years yet — create one above">
        {years.map((yr) => {
          const isArchived = yr.status === 'archived';
          const badgeColor = yr.isActive ? colors.success : isArchived ? colors.textMuted : '#F59E0B';
          const badgeLabel = yr.isActive ? 'Active' : isArchived ? 'Archived' : 'Inactive';
          return (
            <AccentListCard
              key={yr._id}
              accent={badgeColor}
              title={yr.name}
              subtitle={`${fmtDate(yr.startDate)} → ${fmtDate(yr.endDate)}`}
              badge={<StatusPill label={badgeLabel} color={badgeColor} />}
              expandable
              meta={[{ label: 'Code', value: yr.code || '—' }]}
              actions={
                <>
                  {!yr.isActive && !isArchived && (
                    <Button compact loading={activateState.isLoading} disabled={activateState.isLoading} onPress={() => activateYear(yr._id)}>
                      Set Active
                    </Button>
                  )}
                  {!isArchived && (
                    <Button compact onPress={() => { setEditing(yr); setFormVisible(true); }}>Edit</Button>
                  )}
                  {!isArchived && !yr.isActive && (
                    <Button compact textColor="#F59E0B" loading={archiveState.isLoading} disabled={archiveState.isLoading} onPress={() => archiveYear(yr._id)}>
                      Archive
                    </Button>
                  )}
                  {!yr.isActive && (
                    <Button compact textColor={colors.danger} loading={deleteState.isLoading} disabled={deleteState.isLoading} onPress={() => deleteYear(yr._id)}>
                      Delete
                    </Button>
                  )}
                </>
              }
            />
          );
        })}
      </QueryState>

      <YearFormSheet visible={formVisible} initial={editing} onDismiss={() => setFormVisible(false)} onSaved={() => setFormVisible(false)} />
    </View>
  );
}
