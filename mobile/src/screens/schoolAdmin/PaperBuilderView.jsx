import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, ProgressBar, Snackbar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { FormField } from '../../components/ui/FormField';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { Panel } from '../../components/ui/Panel';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetActiveAcademicYearQuery, useGetExamsQuery, useUpdateExamMutation } from '../../store/api/apiSlice';

const C = { primary: '#2563EB', accent: '#14B8A6', success: '#22C55E', warning: '#F59E0B', danger: '#EF4444', purple: '#8B5CF6' };

const DEFAULT_SECTIONS = [
  { key: 'A', section: 'Section A', questionType: 'Multiple Choice (MCQ)', questions: 0, marksEach: 1, color: C.primary },
  { key: 'B', section: 'Section B', questionType: 'Short Answer', questions: 0, marksEach: 3, color: C.accent },
  { key: 'C', section: 'Section C', questionType: 'Long Answer / Essay', questions: 0, marksEach: 5, color: C.purple },
];

const QUESTION_TYPES = [
  'Multiple Choice (MCQ)', 'True / False', 'Fill in the Blank',
  'Short Answer', 'Long Answer / Essay', 'Diagram / Practical', 'Case Study',
];
const SECTION_COLORS = [C.primary, C.accent, C.purple, C.warning, C.success, C.danger];

const sectionTotal = (s) => (Number(s.questions) || 0) * (Number(s.marksEach) || 0);
const uid = () => Math.random().toString(36).slice(2, 8);

function SectionCard({ sec, totalMarks, onChange, onDelete }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const rowTotal = sectionTotal(sec);
  const pct = totalMarks > 0 ? Math.min(1, rowTotal / totalMarks) : 0;

  return (
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: sec.color, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <FormField
          value={sec.section}
          onChangeText={(v) => onChange({ ...sec, section: v })}
          style={{ flex: 1, marginBottom: 0 }}
          dense
        />
        <IconButton icon="trash-can-outline" iconColor={colors.danger} size={18} onPress={onDelete} />
      </View>

      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>QUESTION TYPE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
        {QUESTION_TYPES.map((t) => (
          <Chip key={t} selected={t === sec.questionType} onPress={() => onChange({ ...sec, questionType: t })} compact>
            {t}
          </Chip>
        ))}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <FormField
          label="Questions"
          value={String(sec.questions ?? 0)}
          onChangeText={(v) => onChange({ ...sec, questions: Number(v) || 0 })}
          keyboardType="numeric"
          style={{ flex: 1 }}
        />
        <FormField
          label="Marks Each"
          value={String(sec.marksEach ?? 0)}
          onChangeText={(v) => onChange({ ...sec, marksEach: Number(v) || 0 })}
          keyboardType="numeric"
          style={{ flex: 1 }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
        {totalMarks > 0 && (
          <ProgressBar progress={pct} color={sec.color} style={{ flex: 1, height: 6, borderRadius: 3 }} />
        )}
        <StatusPill label={`${rowTotal} marks`} color={sec.color} />
      </View>
    </View>
  );
}

/** Paper Builder — mirrors web's PageBuilder.jsx: pick an exam, design section-wise blueprint
 * (question type/count/marks per section), Save Draft or Publish. Both write through the same
 * PUT /exams/:id updateExam controller web uses, sending { paperBlueprint } (Save Draft) or
 * { status: 'published', paperBlueprint } (Publish). Print/Preview isn't ported — there's no
 * native print flow on mobile and it's not required to build or publish a paper. Uses
 * durationMinutes for the duration chip, not web's `.duration` (confirmed against Exam.model.js —
 * that field doesn't exist on the model, a pre-existing web-only display bug not replicated here). */
export function PaperBuilderView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear is never populated by the backend (User has no academicYearId field) —
  // fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;

  const [selectedExamId, setSelectedExamId] = useState(null);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [snackbar, setSnackbar] = useState(null);

  const examsQuery = useGetExamsQuery({ academicYearId }, { skip: !academicYearId });
  const exams = examsQuery.data?.exams ?? [];
  const [updateExam, updateState] = useUpdateExamMutation();

  const selectedExam = useMemo(() => exams.find((e) => e._id === selectedExamId), [exams, selectedExamId]);
  const totalMarks = Number(selectedExam?.totalMarks || 0);
  const blueprintTotal = sections.reduce((sum, s) => sum + sectionTotal(s), 0);
  const totalQuestions = sections.reduce((sum, s) => sum + (Number(s.questions) || 0), 0);
  const remaining = totalMarks - blueprintTotal;
  const isBalanced = totalMarks > 0 && remaining === 0;
  const isOver = remaining < 0;

  const handleSelectExam = (exam) => {
    setSelectedExamId(exam._id);
    setSections(exam.paperBlueprint?.length ? exam.paperBlueprint : DEFAULT_SECTIONS.map((s) => ({ ...s, questions: 0 })));
  };

  const handleAddSection = () => {
    const color = SECTION_COLORS[sections.length % SECTION_COLORS.length];
    setSections((prev) => [
      ...prev,
      { key: uid(), section: `Section ${String.fromCharCode(65 + prev.length)}`, questionType: 'Short Answer', questions: 0, marksEach: 2, color },
    ]);
  };

  const save = async (extra) => {
    if (!selectedExamId) return;
    try {
      await updateExam({ examId: selectedExamId, payload: { paperBlueprint: sections, ...extra } }).unwrap();
      setSnackbar({ message: extra?.status === 'published' ? 'Paper published successfully!' : 'Draft saved', isError: false });
    } catch (err) {
      setSnackbar({ message: err?.data?.message || err?.message || 'Failed to save', isError: true });
    }
  };

  const handleSaveDraft = () => save();
  const handlePublish = () => {
    if (totalQuestions === 0) return setSnackbar({ message: 'Add at least one question to any section', isError: true });
    if (isOver) return setSnackbar({ message: `Blueprint exceeds total marks by ${Math.abs(remaining)}`, isError: true });
    save({ status: 'published' });
  };

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SELECT EXAM</Text>
      <QueryState
        isLoading={examsQuery.isLoading}
        isError={examsQuery.isError}
        error={examsQuery.error}
        onRetry={examsQuery.refetch}
        isEmpty={exams.length === 0}
        emptyIcon="pencil-box-outline"
        emptyLabel="No exams available — create one first from Exams"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}>
          {exams.map((e) => (
            <Chip key={e._id} selected={e._id === selectedExamId} onPress={() => handleSelectExam(e)}>
              {e.title}
            </Chip>
          ))}
        </ScrollView>

        {!selectedExam ? (
          <QueryState isLoading={false} isError={false} isEmpty emptyIcon="file-document-outline" emptyLabel="Select an exam above to start building the paper blueprint" />
        ) : (
          <>
            <View style={{ marginBottom: spacing.lg }}>
              <StatGrid>
                <StatCard label="Total Marks" metric={{ icon: 'trophy-outline', color: C.primary, value: totalMarks }} />
                <StatCard label="Subject" metric={{ icon: 'book-outline', color: C.accent, value: selectedExam.subjectId?.name || '—' }} />
                <StatCard label="Duration" metric={{ icon: 'clock-outline', color: C.purple, value: selectedExam.durationMinutes ? `${selectedExam.durationMinutes} min` : '—' }} />
                <StatCard label="Status" metric={{ icon: 'chart-bar', color: C.warning, value: String(selectedExam.status || 'draft').toUpperCase() }} />
              </StatGrid>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <Text style={[typography.h3, { color: colors.text }]}>Paper Sections</Text>
              <Button mode="outlined" compact icon="plus" onPress={handleAddSection}>
                Add Section
              </Button>
            </View>

            {sections.length === 0 ? (
              <QueryState isLoading={false} isError={false} isEmpty emptyIcon="file-document-outline" emptyLabel="No sections. Tap 'Add Section' to start." />
            ) : (
              sections.map((sec, idx) => (
                <SectionCard
                  key={sec.key}
                  sec={sec}
                  totalMarks={totalMarks}
                  onChange={(updated) => setSections((prev) => prev.map((s, i) => (i === idx ? updated : s)))}
                  onDelete={() => setSections((prev) => prev.filter((_, i) => i !== idx))}
                />
              ))
            )}

            <Panel>
              <Text style={[typography.caption, { color: colors.text, fontWeight: '700', marginBottom: spacing.sm }]}>BLUEPRINT SUMMARY</Text>
              {[
                { label: 'Total Marks', value: totalMarks, color: C.primary },
                { label: 'Allocated', value: blueprintTotal, color: isOver ? C.danger : C.accent },
                { label: 'Remaining', value: Math.abs(remaining), color: isOver ? C.danger : C.success, suffix: isOver ? ' (over)' : remaining === 0 ? ' ✓' : '' },
                { label: 'Total Questions', value: totalQuestions, color: C.purple },
              ].map(({ label, value, color, suffix }) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.borderMuted }}>
                  <Text style={[typography.body, { color: colors.textSecondary }]}>{label}</Text>
                  <Text style={[typography.bodyStrong, { color }]}>{value}{suffix}</Text>
                </View>
              ))}

              {totalMarks > 0 && (
                <ProgressBar
                  progress={Math.min(1, blueprintTotal / totalMarks)}
                  color={isOver ? C.danger : isBalanced ? C.success : C.primary}
                  style={{ height: 8, borderRadius: 4, marginTop: spacing.md }}
                />
              )}

              <View style={{ marginTop: spacing.md }}>
                {isOver ? (
                  <Text style={[typography.caption, { color: C.danger }]}>⚠ Blueprint exceeds total marks by {Math.abs(remaining)}</Text>
                ) : isBalanced ? (
                  <Text style={[typography.caption, { color: colors.success }]}>✓ Blueprint is perfectly balanced</Text>
                ) : (
                  <Text style={[typography.caption, { color: C.warning }]}>{remaining} marks unallocated</Text>
                )}
              </View>
            </Panel>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
              <Button mode="outlined" onPress={handleSaveDraft} loading={updateState.isLoading} disabled={updateState.isLoading} style={{ flex: 1 }}>
                Save Draft
              </Button>
              <Button
                mode="contained"
                onPress={handlePublish}
                loading={updateState.isLoading}
                disabled={updateState.isLoading || totalQuestions === 0 || isOver}
                style={{ flex: 1 }}
              >
                Publish Paper
              </Button>
            </View>
          </>
        )}
      </QueryState>

      <Snackbar visible={Boolean(snackbar)} onDismiss={() => setSnackbar(null)} duration={3500} style={snackbar?.isError ? { backgroundColor: colors.danger } : undefined}>
        {snackbar?.message}
      </Snackbar>
    </ScreenContainer>
  );
}
