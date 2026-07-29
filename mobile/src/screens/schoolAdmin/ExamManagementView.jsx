import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateExamSheet } from './CreateExamSheet';
import { formatDate } from '../../utils/format';
import { confirmDelete } from '../../utils/confirm';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useDeleteExamMutation,
  useGetClassDetailsQuery,
  useGetExamsQuery,
  usePublishExamMutation,
} from '../../store/api/apiSlice';

const STATUS_COLOR = { draft: '#94A3B8', published: '#2563EB', completed: '#22C55E' };

/** Exam creation + schedule — covers 3 web sidebar entries (Exams, Create Exam, Exam Schedule).
 * ExamSchedule.jsx on the web is confirmed to dispatch the exact same createExam/getExams thunks
 * as CreateExam.jsx, just presented as a calendar — this is the same single feature, presented as
 * a date-sorted agenda list instead of a calendar-grid component. Edit/Delete/Publish reuse the
 * same updateExam/deleteExam/publishExam endpoints web's own exam list wires up — mobile only had
 * Create before, so a mobile-created exam could never leave "draft" status once saved. */
export function ExamManagementView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const classesQuery = useGetClassDetailsQuery({ schoolId, academicYearId }, { skip: !schoolId });
  const classes = classesQuery.data ?? [];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetExamsQuery({ academicYearId }, { skip: !academicYearId });
  const exams = useMemo(() => [...(data?.exams ?? [])].sort((a, b) => new Date(a.examDate) - new Date(b.examDate)), [data]);

  const stats = useMemo(
    () => ({
      total: exams.length,
      draft: exams.filter((e) => e.status === 'draft').length,
      published: exams.filter((e) => e.status === 'published').length,
      completed: exams.filter((e) => e.status === 'completed').length,
    }),
    [exams]
  );

  const [deleteExam, deleteState] = useDeleteExamMutation();
  const [publishExam, publishState] = usePublishExamMutation();

  const openCreate = () => {
    setEditingExam(null);
    setSheetVisible(true);
  };
  const openEdit = (exam) => {
    setEditingExam(exam);
    setSheetVisible(true);
  };
  const closeSheet = () => {
    setSheetVisible(false);
    setEditingExam(null);
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="pencil-box-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Exam Management</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Create and schedule exams across classes
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Total" metric={{ value: stats.total, icon: 'pencil-box-outline', color: colors.primary }} />
          <StatCard label="Draft" metric={{ value: stats.draft, icon: 'file-edit-outline', color: STATUS_COLOR.draft }} />
          <StatCard label="Published" metric={{ value: stats.published, icon: 'send-check-outline', color: STATUS_COLOR.published }} />
          <StatCard label="Completed" metric={{ value: stats.completed, icon: 'check-circle-outline', color: STATUS_COLOR.completed }} />
        </StatGrid>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={openCreate}>
          New Exam
        </Button>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={exams.length === 0}
        emptyIcon="pencil-box-outline"
        emptyLabel="No exams scheduled yet"
      >
        {exams.map((exam) => (
          <AccentListCard
            key={exam._id}
            accent={STATUS_COLOR[exam.status] || colors.primary}
            avatar={<IconWell icon="pencil-box-outline" color={STATUS_COLOR[exam.status] || colors.primary} size={40} />}
            title={exam.title}
            subtitle={`${exam.schoolClassId?.name ?? ''}${exam.sectionId?.name ? ` ${exam.sectionId.name}` : ''} · ${exam.subjectId?.name ?? ''}`}
            badge={<StatusPill label={exam.status} color={STATUS_COLOR[exam.status] || colors.textMuted} />}
            meta={[
              { label: 'Date', value: formatDate(exam.examDate) },
              { label: 'Marks', value: `${exam.totalMarks} (pass ${exam.passingMarks})` },
              ...(exam.examType ? [{ label: 'Type', value: exam.examType }] : []),
              { label: 'Exam Code', value: exam.examCode || '—' },
            ]}
            expandable
            actions={
              <>
                {exam.status === 'draft' && (
                  <Button
                    mode="text"
                    compact
                    disabled={publishState.isLoading}
                    onPress={() => publishExam({ examId: exam._id, status: 'published' })}
                  >
                    Publish
                  </Button>
                )}
                {exam.status === 'published' && (
                  <Button
                    mode="text"
                    compact
                    disabled={publishState.isLoading}
                    onPress={() => publishExam({ examId: exam._id, status: 'draft' })}
                  >
                    Unpublish
                  </Button>
                )}
                <IconButton icon="pencil-outline" size={18} onPress={() => openEdit(exam)} />
                <IconButton
                  icon="trash-can-outline"
                  iconColor={colors.danger}
                  size={18}
                  disabled={deleteState.isLoading}
                  onPress={() => confirmDelete(() => deleteExam(exam._id), 'this exam')}
                />
              </>
            }
          />
        ))}
      </QueryState>

      <CreateExamSheet
        visible={sheetVisible}
        editing={editingExam}
        onDismiss={closeSheet}
        onCreated={closeSheet}
        classes={classes}
        academicYearId={academicYearId}
      />
    </ScreenContainer>
  );
}
