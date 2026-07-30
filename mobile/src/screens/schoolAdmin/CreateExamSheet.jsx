import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Switch, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateExamMutation, useUpdateExamMutation } from '../../store/api/apiSlice';

// Mirrors web's CreateExam.jsx exam-type Select options exactly (Exam.model.js's examType has no
// real enum constraint — this is just the same informal convention web already established).
const EXAM_TYPES = [
  { value: 'objective', label: 'Objective' },
  { value: 'subjective', label: 'Subjective' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'unit_test', label: 'Unit Test' },
  { value: 'class_test', label: 'Class Test' },
  { value: 'Mid_term', label: 'Mid-term' },
  { value: 'final_exam', label: 'Final Exam' },
  { value: 'online_exam', label: 'Online Exam' },
  { value: 'practical_exam', label: 'Practical Exam' },
  { value: 'oral_exam', label: 'Oral Exam' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'project', label: 'Project' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'board_exam', label: 'Board Exam' },
  { value: 'competitive_exam', label: 'Competitive Exam' },
  { value: 'remedial_exam', label: 'Remedial Exam' },
];
const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'completed', label: 'Completed' },
];
const QUESTION_ORDERS = [
  { value: 'random', label: 'Random' },
  { value: 'fixed', label: 'Fixed' },
];

function toHHMM(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function toYMD(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Create AND edit — mirrors web's CreateExam.jsx field-for-field (same Exam schema: examCode,
 * class-scoped subject list, exam type, schedule, question order/shuffle/negative-marking/max-
 * attempts/partial-scoring under "settings", marks, and status). Question attachment is
 * deliberately not included — web itself only allows it in edit mode via a full question picker
 * with per-question marks, the same "disproportionate for a first pass" scope QuestionBankView's
 * own header comment already draws the line at for this app. */
export function CreateExamSheet({ visible, onDismiss, onCreated, classes, academicYearId, editing }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createExam, createState] = useCreateExamMutation();
  const [updateExam, updateState] = useUpdateExamMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [title, setTitle] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examType, setExamType] = useState('unit_test');
  const [status, setStatus] = useState('draft');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [passingMarks, setPassingMarks] = useState('');
  const [questionOrder, setQuestionOrder] = useState('random');
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState('0');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [allowPartialScoring, setAllowPartialScoring] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      const cls = editing.schoolClassId?._id ?? editing.schoolClassId;
      setClassId(cls ?? null);
      setSectionId(editing.sectionId?._id ?? editing.sectionId ?? null);
      setSubjectId(editing.subjectId?._id ?? editing.subjectId ?? null);
      setTitle(editing.title ?? '');
      setExamCode(editing.examCode ?? '');
      setExamType(editing.examType || 'unit_test');
      setStatus(editing.status || 'draft');
      setExamDate(editing.examDate ? toYMD(editing.examDate) : '');
      setStartTime(editing.startTime ? toHHMM(editing.startTime) : '');
      setEndTime(editing.endTime ? toHHMM(editing.endTime) : '');
      setDurationMinutes(editing.durationMinutes != null ? String(editing.durationMinutes) : '');
      setTotalMarks(editing.totalMarks != null ? String(editing.totalMarks) : '');
      setPassingMarks(editing.passingMarks != null ? String(editing.passingMarks) : '');
      setQuestionOrder(editing.questionOrder || 'random');
      setShuffleOptions(editing.shuffleOptions ?? true);
      setNegativeMarking(String(editing.settings?.negativeMarking ?? 0));
      setMaxAttempts(String(editing.settings?.maxAttempts ?? 1));
      setAllowPartialScoring(Boolean(editing.settings?.allowPartialScoring));
    } else {
      setClassId(null);
      setSectionId(null);
      setSubjectId(null);
      setTitle('');
      setExamCode('');
      setExamType('unit_test');
      setStatus('draft');
      setExamDate('');
      setStartTime('');
      setEndTime('');
      setDurationMinutes('');
      setTotalMarks('');
      setPassingMarks('');
      setQuestionOrder('random');
      setShuffleOptions(true);
      setNegativeMarking('0');
      setMaxAttempts('1');
      setAllowPartialScoring(false);
    }
    setError(null);
  }, [visible, editing]);

  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];
  // Subjects scoped to whatever's actually taught in the selected class's sections — mirrors web's
  // handleClassChange (dedupe subjects across every section of the class), not a flat "all
  // subjects in the school" list which would let an admin attach a subject nobody teaches here.
  const subjects = useMemo(() => {
    const map = new Map();
    sections.forEach((sec) => (sec.subjects ?? []).forEach((sub) => { if (sub?._id) map.set(sub._id, sub); }));
    return Array.from(map.values());
  }, [sections]);

  // Auto-fills duration from start/end — only on direct user edits to those fields (mirrors web's
  // TimePicker onChange={calculateDuration}), not as a blanket effect, so pre-filling an edit
  // doesn't silently overwrite a durationMinutes the backend never actually requires to match the
  // start/end window exactly.
  const recalcDuration = (nextStart, nextEnd) => {
    if (!/^\d{2}:\d{2}$/.test(nextStart) || !/^\d{2}:\d{2}$/.test(nextEnd)) return;
    const [sh, sm] = nextStart.split(':').map(Number);
    const [eh, em] = nextEnd.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) setDurationMinutes(String(diff));
  };
  const handleStartTimeChange = (v) => { setStartTime(v); recalcDuration(v, endTime); };
  const handleEndTimeChange = (v) => { setEndTime(v); recalcDuration(startTime, v); };

  const handleSave = async () => {
    if (!classId || !subjectId || !title.trim() || !examDate.trim() || !startTime.trim() || !endTime.trim() || !durationMinutes.trim() || !totalMarks.trim() || !passingMarks.trim()) {
      setError('Class, subject, title, date, start/end time, duration and marks are all required');
      return;
    }
    const startISO = `${examDate.trim()}T${startTime.trim()}:00`;
    const endISO = `${examDate.trim()}T${endTime.trim()}:00`;
    if (Number.isNaN(new Date(startISO).getTime()) || Number.isNaN(new Date(endISO).getTime())) {
      setError('Date must be YYYY-MM-DD and times must be HH:mm');
      return;
    }
    if (new Date(endISO) <= new Date(startISO)) {
      setError('End time must be after start time');
      return;
    }
    if (Number(passingMarks) > Number(totalMarks)) {
      setError('Passing marks cannot exceed total marks');
      return;
    }

    const payload = {
      academicYearId,
      schoolClassId: classId,
      sectionId: sectionId || undefined,
      subjectId,
      title: title.trim(),
      examCode: examCode.trim() || undefined,
      examType,
      status,
      examDate: examDate.trim(),
      startTime: startISO,
      endTime: endISO,
      durationMinutes: Number(durationMinutes),
      totalMarks: Number(totalMarks),
      passingMarks: Number(passingMarks),
      questionOrder,
      shuffleOptions,
      settings: {
        negativeMarking: Number(negativeMarking) || 0,
        maxAttempts: Number(maxAttempts) || 1,
        allowPartialScoring,
      },
    };

    try {
      if (editing) {
        await updateExam({ examId: editing._id, payload }).unwrap();
      } else {
        await createExam(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || `Failed to ${editing ? 'update' : 'create'} exam`);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>
            {editing ? 'Edit Exam' : 'New Exam'}
          </Text>

          <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.xs }]}>Basic Info</Text>
          <FormField label="Title" value={title} onChangeText={setTitle} disabled={saving} />
          <FormField label="Exam Code (optional, auto-generated if left blank)" value={examCode} onChangeText={setExamCode} disabled={saving} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {classes.map((c) => (
              <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); setSubjectId(null); }}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>

          {sections.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SECTION (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {sections.map((s) => (
                  <Chip key={s._id} selected={s._id === sectionId} onPress={() => setSectionId(s._id === sectionId ? null : s._id)}>
                    {s.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {subjects.length === 0 ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>{classId ? 'No subjects set up for this class yet' : 'Pick a class first'}</Text>
            ) : (
              subjects.map((s) => (
                <Chip key={s._id} selected={s._id === subjectId} onPress={() => setSubjectId(s._id)}>
                  {s.name}
                </Chip>
              ))
            )}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>EXAM TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {EXAM_TYPES.map((t) => (
              <Chip key={t.value} selected={t.value === examType} onPress={() => setExamType(t.value)}>
                {t.label}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.sm, marginBottom: spacing.xs }]}>Schedule</Text>
          <FormField label="Exam Date (YYYY-MM-DD)" value={examDate} onChangeText={setExamDate} disabled={saving} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FormField label="Start (HH:mm)" value={startTime} onChangeText={handleStartTimeChange} style={{ flex: 1 }} disabled={saving} />
            <FormField label="End (HH:mm)" value={endTime} onChangeText={handleEndTimeChange} style={{ flex: 1 }} disabled={saving} />
          </View>
          <FormField label="Duration (minutes)" value={durationMinutes} onChangeText={setDurationMinutes} keyboardType="numeric" disabled={saving} />

          <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.sm, marginBottom: spacing.xs }]}>Exam Experience</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>QUESTION ORDER</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {QUESTION_ORDERS.map((o) => (
              <Chip key={o.value} selected={o.value === questionOrder} onPress={() => setQuestionOrder(o.value)}>
                {o.label}
              </Chip>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={[typography.body, { color: colors.text }]}>Shuffle Options</Text>
            <Switch value={shuffleOptions} onValueChange={setShuffleOptions} disabled={saving} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FormField label="Negative Marking" value={negativeMarking} onChangeText={setNegativeMarking} keyboardType="numeric" style={{ flex: 1 }} disabled={saving} />
            <FormField label="Max Attempts" value={maxAttempts} onChangeText={setMaxAttempts} keyboardType="numeric" style={{ flex: 1 }} disabled={saving} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <Text style={[typography.body, { color: colors.text }]}>Allow Partial Scoring</Text>
            <Switch value={allowPartialScoring} onValueChange={setAllowPartialScoring} disabled={saving} />
          </View>

          <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.sm, marginBottom: spacing.xs }]}>Marks</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FormField label="Total Marks" value={totalMarks} onChangeText={setTotalMarks} keyboardType="numeric" style={{ flex: 1 }} disabled={saving} />
            <FormField label="Passing Marks" value={passingMarks} onChangeText={setPassingMarks} keyboardType="numeric" style={{ flex: 1 }} disabled={saving} />
          </View>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {STATUSES.map((s) => (
              <Chip key={s.value} selected={s.value === status} onPress={() => setStatus(s.value)}>
                {s.label}
              </Chip>
            ))}
          </ScrollView>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saving}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ flex: 1 }}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
