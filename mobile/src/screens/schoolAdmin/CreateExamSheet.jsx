import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateExamMutation, useGetSubjectsQuery } from '../../store/api/apiSlice';

const EXAM_TYPES = ['Unit Test', 'Mid Term', 'Final', 'Quiz'];

export function CreateExamSheet({ visible, onDismiss, onCreated, classes, academicYearId }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createExam, createState] = useCreateExamMutation();
  const subjectsQuery = useGetSubjectsQuery(undefined, { skip: !visible });
  const subjects = subjectsQuery.data ?? [];

  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('Unit Test');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [passingMarks, setPassingMarks] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setClassId(null);
      setSectionId(null);
      setSubjectId(null);
      setTitle('');
      setExamType('Unit Test');
      setExamDate('');
      setStartTime('');
      setEndTime('');
      setDurationMinutes('');
      setTotalMarks('');
      setPassingMarks('');
      setError(null);
    }
  }, [visible]);

  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  const handleCreate = async () => {
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
    try {
      await createExam({
        academicYearId,
        schoolClassId: classId,
        sectionId: sectionId || undefined,
        subjectId,
        title: title.trim(),
        examType,
        examDate: examDate.trim(),
        startTime: startISO,
        endTime: endISO,
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create exam');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Exam</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>EXAM TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {EXAM_TYPES.map((t) => (
              <Chip key={t} selected={t === examType} onPress={() => setExamType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {classes.map((c) => (
              <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); }}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>

          {sections.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SECTION (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {sections.map((s) => (
                  <Chip key={s._id} selected={s._id === sectionId} onPress={() => setSectionId(s._id === sectionId ? null : s._id)}>
                    {s.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {subjects.map((s) => (
              <Chip key={s._id} selected={s._id === subjectId} onPress={() => setSubjectId(s._id)}>
                {s.name}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Exam Date (YYYY-MM-DD)" value={examDate} onChangeText={setExamDate} style={{ marginTop: spacing.sm }} disabled={createState.isLoading} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FormField label="Start (HH:mm)" value={startTime} onChangeText={setStartTime} style={{ flex: 1 }} disabled={createState.isLoading} />
            <FormField label="End (HH:mm)" value={endTime} onChangeText={setEndTime} style={{ flex: 1 }} disabled={createState.isLoading} />
          </View>
          <FormField label="Duration (minutes)" value={durationMinutes} onChangeText={setDurationMinutes} keyboardType="numeric" disabled={createState.isLoading} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FormField label="Total Marks" value={totalMarks} onChangeText={setTotalMarks} keyboardType="numeric" style={{ flex: 1 }} disabled={createState.isLoading} />
            <FormField label="Passing Marks" value={passingMarks} onChangeText={setPassingMarks} keyboardType="numeric" style={{ flex: 1 }} disabled={createState.isLoading} />
          </View>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Create
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
