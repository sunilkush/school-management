import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateQuestionMutation, useUpdateQuestionMutation } from '../../store/api/apiSlice';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const QUESTION_TYPES = [
  { value: 'mcq_single', label: 'MCQ (Single Answer)' },
  { value: 'true_false', label: 'True / False' },
];

/** Doubles as the edit sheet — pass `question` to pre-fill the form and save via PUT instead of
 * POST. Scoped to MCQ Single + True/False only: mcq_multi, fill_blank and match each need a
 * materially different answer-editor UI (see Questions.model.js's pre-validate rules), left for a
 * future pass rather than half-built here. */
export function CreateQuestionSheet({ visible, onDismiss, onCreated, classes, academicYearId, question }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createQuestion, createState] = useCreateQuestionMutation();
  const [updateQuestion, updateState] = useUpdateQuestionMutation();
  const isEditing = Boolean(question);
  const saving = isEditing ? updateState.isLoading : createState.isLoading;

  const [classId, setClassId] = useState(null);
  const [subjectId, setSubjectId] = useState(null);
  const [questionType, setQuestionType] = useState('mcq_single');
  const [statement, setStatement] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [marks, setMarks] = useState('1');
  const [negativeMarks, setNegativeMarks] = useState('0');
  const [options, setOptions] = useState(['', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState('true');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    const qClassId = question?.schoolClassId?._id ?? question?.schoolClassId ?? null;
    const qSubjectId = question?.subjectId?._id ?? question?.subjectId ?? null;
    setClassId(qClassId);
    setSubjectId(qSubjectId);
    setQuestionType(question?.questionType === 'true_false' ? 'true_false' : 'mcq_single');
    setStatement(question?.statement ?? '');
    setDifficulty(question?.difficulty ?? 'medium');
    setMarks(String(question?.marks ?? 1));
    setNegativeMarks(String(question?.negativeMarks ?? 0));
    if (question?.questionType === 'true_false') {
      setTrueFalseAnswer((question?.correctAnswers?.[0] ?? 'true').toLowerCase());
      setOptions(['', '']);
      setCorrectIndex(0);
    } else if (question?.options?.length) {
      const texts = question.options.map((o) => o.text);
      const idx = question.options.findIndex((o) => question.correctAnswers?.includes(o.key));
      setOptions(texts);
      setCorrectIndex(idx >= 0 ? idx : 0);
      setTrueFalseAnswer('true');
    } else {
      setOptions(['', '']);
      setCorrectIndex(0);
      setTrueFalseAnswer('true');
    }
    setError(null);
  }, [visible, question]);

  const selectedClass = classes.find((c) => c._id === classId);
  const subjects = selectedClass?.subjects ?? [];

  const addOption = () => {
    if (options.length >= OPTION_KEYS.length) return;
    setOptions((prev) => [...prev, '']);
  };
  const removeOption = (index) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    if (correctIndex >= index && correctIndex > 0) setCorrectIndex((prev) => prev - 1);
  };
  const updateOptionText = (index, text) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? text : o)));
  };

  const handleSave = async () => {
    if (!classId || !subjectId || !statement.trim()) {
      setError('Class, subject and question text are all required');
      return;
    }

    let payload = {
      academicYearId,
      schoolClassId: classId,
      subjectId,
      questionType,
      statement: statement.trim(),
      difficulty,
      marks: Number(marks) || 0,
      negativeMarks: Number(negativeMarks) || 0,
    };

    if (questionType === 'true_false') {
      payload = { ...payload, options: [], correctAnswers: [trueFalseAnswer] };
    } else {
      const trimmed = options.map((o) => o.trim());
      if (trimmed.some((o) => !o)) {
        setError('Every option needs text');
        return;
      }
      const optionDocs = trimmed.map((text, i) => ({ key: OPTION_KEYS[i], text }));
      payload = { ...payload, options: optionDocs, correctAnswers: [OPTION_KEYS[correctIndex]] };
    }

    try {
      if (isEditing) {
        await updateQuestion({ id: question._id, ...payload }).unwrap();
      } else {
        await createQuestion(payload).unwrap();
      }
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to save question');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '88%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{isEditing ? 'Edit Question' : 'New Question'}</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {classes.map((c) => (
              <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSubjectId(null); }}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SUBJECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {subjects.map((s) => (
              <Chip key={s.subjectId._id} selected={s.subjectId._id === subjectId} onPress={() => setSubjectId(s.subjectId._id)}>
                {s.subjectId.name}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>TYPE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {QUESTION_TYPES.map((t) => (
              <Chip key={t.value} selected={t.value === questionType} onPress={() => setQuestionType(t.value)} disabled={isEditing}>
                {t.label}
              </Chip>
            ))}
          </View>

          <FormField label="Question" value={statement} onChangeText={setStatement} multiline numberOfLines={2} disabled={saving} />

          {questionType === 'true_false' ? (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>CORRECT ANSWER</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                <Chip selected={trueFalseAnswer === 'true'} onPress={() => setTrueFalseAnswer('true')}>True</Chip>
                <Chip selected={trueFalseAnswer === 'false'} onPress={() => setTrueFalseAnswer('false')}>False</Chip>
              </View>
            </>
          ) : (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>OPTIONS (tap the circle to mark correct)</Text>
              {options.map((text, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <IconButton
                    icon={correctIndex === i ? 'check-circle' : 'circle-outline'}
                    iconColor={correctIndex === i ? colors.success : colors.textMuted}
                    size={22}
                    onPress={() => setCorrectIndex(i)}
                  />
                  <FormField
                    label={`Option ${OPTION_KEYS[i]}`}
                    value={text}
                    onChangeText={(v) => updateOptionText(i, v)}
                    disabled={saving}
                    style={{ flex: 1 }}
                  />
                  {options.length > 2 && (
                    <IconButton icon="close" size={18} iconColor={colors.textMuted} onPress={() => removeOption(i)} />
                  )}
                </View>
              ))}
              {options.length < OPTION_KEYS.length && (
                <Button mode="text" compact onPress={addOption} style={{ alignSelf: 'flex-start' }}>
                  + Add Option
                </Button>
              )}
            </>
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>DIFFICULTY</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            {DIFFICULTIES.map((d) => (
              <Chip key={d} selected={d === difficulty} onPress={() => setDifficulty(d)}>
                {d}
              </Chip>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <FormField label="Marks" value={marks} onChangeText={setMarks} keyboardType="numeric" disabled={saving} style={{ flex: 1 }} />
            <FormField label="Negative Marks" value={negativeMarks} onChangeText={setNegativeMarks} keyboardType="numeric" disabled={saving} style={{ flex: 1 }} />
          </View>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saving}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
