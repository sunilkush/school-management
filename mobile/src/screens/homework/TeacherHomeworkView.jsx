import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { SearchField } from '../../components/ui/SearchField';
import { Panel } from '../../components/ui/Panel';
import { CreateHomeworkSheet } from './CreateHomeworkSheet';
import { formatDate } from '../../utils/format';
import { confirmDelete } from '../../utils/confirm';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useDeleteTeacherHomeworkMutation, useGetActiveAcademicYearQuery, useGetAssignedClassesQuery, useGetTeacherHomeworkQuery } from '../../store/api/apiSlice';

const STATUS_COLOR = { active: '#22C55E', overdue: '#EF4444' };

/** Mirrors frontend/src/pages/Teacher/Assignments/Assignments.jsx: stat tiles, class/section
 * filters + search, a status tag computed the same way web does (dueDate vs today), and full
 * create/edit/delete — same reuse Sports Teacher/Class Teacher get on web (AssignmentsScreen.jsx's
 * comment: identical Teacher Assignments.jsx component, not a cut-down version). */
export function TeacherHomeworkView({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;
  const [creating, setCreating] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [search, setSearch] = useState('');

  const classesQuery = useGetAssignedClassesQuery(academicYearId, { skip: !academicYearId });
  const classes = classesQuery.data ?? [];
  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetTeacherHomeworkQuery(academicYearId, { skip: !academicYearId });
  const homework = data ?? [];
  const [deleteHomework, deleteState] = useDeleteTeacherHomeworkMutation();

  const withStatus = useMemo(
    () => homework.map((item) => ({ ...item, computedStatus: new Date(item.dueDate) < new Date() ? 'overdue' : 'active' })),
    [homework]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return withStatus.filter((item) => {
      const matchesClass = !classId || item.schoolClassId?._id === classId;
      const matchesSection = !sectionId || item.sectionId?._id === sectionId;
      const matchesSearch = !query || `${item.title} ${item.subjectId?.name ?? ''}`.toLowerCase().includes(query);
      return matchesClass && matchesSection && matchesSearch;
    });
  }, [withStatus, classId, sectionId, search]);

  const stats = useMemo(
    () => ({
      total: homework.length,
      active: withStatus.filter((i) => i.computedStatus === 'active').length,
      overdue: withStatus.filter((i) => i.computedStatus === 'overdue').length,
    }),
    [homework, withStatus]
  );

  const openEdit = (item) => {
    setEditingItem({
      _id: item._id,
      title: item.title,
      description: item.description,
      dueDate: item.dueDate,
      schoolClassId: item.schoolClassId?._id,
      sectionId: item.sectionId?._id,
      subjectId: item.subjectId?._id,
      class: item.schoolClassId?.name ?? '',
      section: item.sectionId?.name ?? '',
      subject: item.subjectId?.name ?? '',
    });
    setCreating(true);
  };
  const closeSheet = () => {
    setCreating(false);
    setEditingItem(null);
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="clipboard-text-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Homework</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Assign homework and track submissions
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Total" metric={{ value: stats.total, icon: 'clipboard-text-outline', color: '#14B8A6' }} />
          <StatCard label="Active" metric={{ value: stats.active, icon: 'clipboard-check-outline', color: STATUS_COLOR.active }} />
          <StatCard label="Overdue" metric={{ value: stats.overdue, icon: 'clipboard-alert-outline', color: STATUS_COLOR.overdue }} />
        </StatGrid>
      </View>

      <Panel>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
          <Chip selected={!classId} onPress={() => { setClassId(null); setSectionId(null); }}>All</Chip>
          {classes.map((c) => (
            <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); }}>
              {c.name}
            </Chip>
          ))}
        </ScrollView>

        {sections.length > 0 && (
          <>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SECTION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
              <Chip selected={!sectionId} onPress={() => setSectionId(null)}>All</Chip>
              {sections.map((s) => (
                <Chip key={s.sectionId._id} selected={s.sectionId._id === sectionId} onPress={() => setSectionId(s.sectionId._id)}>
                  {s.sectionId.name}
                </Chip>
              ))}
            </ScrollView>
          </>
        )}

        <SearchField value={search} onChangeText={setSearch} placeholder="Search assignment or subject" style={{ marginTop: spacing.sm }} />
      </Panel>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)} disabled={!classes.length}>
          New Homework
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="clipboard-text-outline"
        emptyLabel={homework.length === 0 ? 'No homework assigned yet' : 'No assignments match your filters'}
      >
        {filtered.map((item) => (
          <AccentListCard
            key={item._id}
            accent={STATUS_COLOR[item.computedStatus]}
            avatar={<IconWell icon="clipboard-text-outline" color={STATUS_COLOR[item.computedStatus]} size={40} />}
            title={item.title}
            subtitle={`${item.schoolClassId?.name ?? ''}${item.sectionId?.name ? ` · ${item.sectionId.name}` : ''} · Due ${formatDate(item.dueDate)}`}
            badge={<StatusPill label={item.computedStatus === 'overdue' ? 'Overdue' : 'Active'} color={STATUS_COLOR[item.computedStatus]} />}
            meta={[
              { label: 'Subject', value: item.subjectId?.name ?? '—' },
              { label: 'Description', value: item.description || '—' },
              { label: 'Submissions', value: item.submissionCount ?? 0 },
            ]}
            expandable
            actions={
              <>
                <IconButton
                  icon="account-group-outline"
                  iconColor={colors.primary}
                  size={18}
                  onPress={() => navigation.navigate('HomeworkSubmissions', { assignmentId: item._id, title: item.title })}
                />
                <IconButton icon="pencil-outline" size={18} onPress={() => openEdit(item)} />
                <IconButton
                  icon="trash-can-outline"
                  iconColor={colors.danger}
                  size={18}
                  disabled={deleteState.isLoading}
                  onPress={() => confirmDelete(() => deleteHomework(item._id), 'this assignment')}
                />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateHomeworkSheet
        visible={creating}
        editing={editingItem}
        onDismiss={closeSheet}
        onCreated={closeSheet}
        classes={classes}
        academicYearId={academicYearId}
      />
    </ScreenContainer>
  );
}
