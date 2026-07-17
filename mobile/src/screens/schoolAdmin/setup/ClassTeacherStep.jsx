import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { QueryState } from '../../../components/ui/QueryState';
import { AccentListCard } from '../../../components/ui/AccentListCard';
import { SearchField } from '../../../components/ui/SearchField';
import { StatusPill } from '../../../components/ui/StatusPill';
import { useAuth } from '../../../hooks/useAuth';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useGetSchoolClassesQuery, useGetAllUsersQuery, useAssignClassTeacherMutation, useGetActiveAcademicYearQuery } from '../../../store/api/apiSlice';

function TeacherPickerSheet({ section, teachers, onDismiss }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [search, setSearch] = useState('');
  const [assignClassTeacher, assignState] = useAssignClassTeacherMutation();

  const filtered = teachers.filter((t) => t.name?.toLowerCase().includes(search.trim().toLowerCase()));

  const handlePick = async (teacherId) => {
    await assignClassTeacher({ sectionId: section._id, teacherId }).unwrap().catch(() => {});
    onDismiss?.();
  };

  return (
    <Portal>
      <Modal visible={!!section} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '75%' }}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
          {section?.className} - {section?.sectionName}
        </Text>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search teacher" style={{ marginBottom: spacing.sm }} />
        <ScrollView style={{ maxHeight: 320 }}>
          <Chip icon="close-circle-outline" onPress={() => handlePick(null)} disabled={assignState.isLoading} style={{ marginBottom: spacing.xs, alignSelf: 'flex-start' }}>
            Not Assigned
          </Chip>
          {filtered.map((t) => (
            <Chip key={t._id} icon="account-outline" onPress={() => handlePick(t._id)} disabled={assignState.isLoading} style={{ marginBottom: spacing.xs, alignSelf: 'flex-start' }}>
              {t.name}
            </Chip>
          ))}
        </ScrollView>
        <Button mode="outlined" onPress={onDismiss} style={{ marginTop: spacing.md }}>Close</Button>
      </Modal>
    </Portal>
  );
}

export function ClassTeacherStep() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear from login is always empty (User has no academicYearId field server-side —
  // see StudentPicker.jsx's own comment on this). Fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const classesQuery = useGetSchoolClassesQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });
  const teachersQuery = useGetAllUsersQuery({ roleName: 'Teacher' });
  const teachers = teachersQuery.data ?? [];

  const rows = (classesQuery.data ?? []).flatMap((cls) =>
    (cls.sections ?? []).map((sec) => ({
      _id: sec._id,
      className: cls.name,
      sectionName: sec.name,
      teacher: sec.teacher,
    }))
  );

  const [picking, setPicking] = useState(null);

  return (
    <QueryState
      isLoading={classesQuery.isLoading}
      isError={classesQuery.isError}
      error={classesQuery.error}
      onRetry={classesQuery.refetch}
      isEmpty={rows.length === 0}
      emptyIcon="account-outline"
      emptyLabel="No sections set up yet (Classes step)"
    >
      {rows.map((row) => (
        <AccentListCard
          key={row._id}
          accent={row.teacher ? colors.success : '#F59E0B'}
          title={`${row.className} - ${row.sectionName}`}
          badge={<StatusPill label={row.teacher?.name || 'Not assigned'} color={row.teacher ? colors.success : colors.textMuted} />}
          actions={<Button compact onPress={() => setPicking(row)}>Change</Button>}
        />
      ))}

      <TeacherPickerSheet section={picking} teachers={teachers} onDismiss={() => setPicking(null)} />
    </QueryState>
  );
}
