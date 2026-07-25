import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Chip, ProgressBar, Snackbar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { FormField } from '../../components/ui/FormField';
import { IconWell } from '../../components/ui/IconWell';
import { formatDuration } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useAutosaveExamAnswerMutation, useGetExamAttemptByIdQuery, useSubmitExamAttemptMutation } from '../../store/api/apiSlice';

const resolveQuestionId = (ans) => ans?.questionId?._id || ans?.questionId;

function normalizeQuestion(ans) {
  const snap = ans?.questionSnapshot || {};
  return {
    _id: resolveQuestionId(ans),
    text: snap.statement || 'Untitled Question',
    type: snap.questionType || 'subjective',
    options: snap.options || [],
    marks: snap.marks ?? 0,
  };
}

const isAnswered = (val) => {
  if (val === null || val === undefined) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'string') return val.trim() !== '';
  return true;
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const getOptionValue = (opt, i) => (typeof opt === 'string' ? opt : opt?.value || opt?.text || opt?.label || `${i + 1}`);
const getOptionLabel = (opt, i) => (typeof opt === 'string' ? opt : opt?.label || opt?.text || opt?.value || `Option ${i + 1}`);
const getNormalizedOptions = (type, options) => {
  if (Array.isArray(options) && options.length) return options;
  if (type === 'true_false') return ['True', 'False'];
  return [];
};

function QuestionTakeCard({ question, index, answer, onChange }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const type = question.type;
  const options = getNormalizedOptions(type, question.options);
  const isSingle = ['mcq', 'mcq_single', 'true_false'].includes(type);
  const isMulti = type === 'mcq_multi';
  const isFill = type === 'fill_blank';
  const isText = !isSingle && !isMulti && !isFill;

  const handleSingle = (val) => onChange(question._id, answer === val ? null : val);
  const handleMulti = (val) => {
    const current = Array.isArray(answer) ? answer : [];
    onChange(question._id, current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
  };

  return (
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.textOnPrimary, fontWeight: '800', fontSize: 12 }}>{index + 1}</Text>
          </View>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>{(type || 'subjective').toUpperCase()}</Text>
        </View>
        <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700' }]}>
          {question.marks} mark{question.marks !== 1 ? 's' : ''}
        </Text>
      </View>

      <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.md, lineHeight: 20 }]}>{question.text}</Text>

      {isSingle && (
        <View style={{ gap: spacing.sm }}>
          {options.map((opt, i) => {
            const val = getOptionValue(opt, i);
            const selected = answer === val;
            return (
              <Chip key={val} selected={selected} onPress={() => handleSingle(val)} mode={selected ? 'flat' : 'outlined'} style={{ alignSelf: 'flex-start' }}>
                {OPTION_LETTERS[i] || i + 1}. {getOptionLabel(opt, i)}
              </Chip>
            );
          })}
        </View>
      )}

      {isMulti && (
        <View style={{ gap: spacing.sm }}>
          {options.map((opt, i) => {
            const val = getOptionValue(opt, i);
            const selArr = Array.isArray(answer) ? answer : [];
            const selected = selArr.includes(val);
            return (
              <Chip key={val} selected={selected} onPress={() => handleMulti(val)} mode={selected ? 'flat' : 'outlined'} style={{ alignSelf: 'flex-start' }}>
                {OPTION_LETTERS[i] || i + 1}. {getOptionLabel(opt, i)}
              </Chip>
            );
          })}
        </View>
      )}

      {isFill && <FormField label="Your answer" value={answer || ''} onChangeText={(v) => onChange(question._id, v)} />}

      {isText && <FormField label="Your answer" value={answer || ''} onChangeText={(v) => onChange(question._id, v)} multiline numberOfLines={4} />}
    </View>
  );
}

/** Mobile port of web's ExamLive.jsx — timed quiz engine: fetch attempt, hydrate saved answers,
 * debounced autosave per question, live countdown that auto-submits at zero, manual submit with
 * an unanswered-count warning. Back navigation is disabled on this route (see ExamsScreen.jsx)
 * so leaving mid-attempt is only possible via Submit, matching the web app's own exam-window
 * behavior (an abandoned attempt just sits in_progress until time runs out server-side too, since
 * autosaveAttemptAnswer/submitAttempt are the only two ways the ExamAttempt document changes). */
export function ExamTakeScreen({ route, navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const attemptId = route.params?.attemptId;
  const { data: attempt, isLoading, isFetching, isError, error, refetch } = useGetExamAttemptByIdQuery(attemptId, { skip: !attemptId });
  const [autosave] = useAutosaveExamAnswerMutation();
  const [submitAttempt, submitState] = useSubmitExamAttemptMutation();

  const [answers, setAnswers] = useState({});
  const [snackbar, setSnackbar] = useState(null);
  const [displaySeconds, setDisplaySeconds] = useState(null);
  const hydratedRef = useRef(false);
  const endAtRef = useRef(null);
  const autosaveTimersRef = useRef({});
  const submittingRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const questions = useMemo(() => (attempt?.answers ?? []).map(normalizeQuestion), [attempt]);
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  useEffect(() => {
    if (attempt?.answers?.length && !hydratedRef.current) {
      const mapped = {};
      attempt.answers.forEach((a) => {
        const qid = resolveQuestionId(a);
        if (qid) mapped[qid] = a.response ?? null;
      });
      setAnswers(mapped);
      hydratedRef.current = true;
    }
  }, [attempt]);

  const doSubmit = async () => {
    if (submittingRef.current || !attemptId) return;
    submittingRef.current = true;
    try {
      const payload = questionsRef.current.map((q) => ({ questionId: q._id, response: answersRef.current[q._id] ?? null }));
      await submitAttempt({ attemptId, answers: payload }).unwrap();
      navigation.replace('ExamAttemptReview', { attemptId });
    } catch (err) {
      submittingRef.current = false;
      setSnackbar(err?.data?.message || err?.message || 'Submission failed');
    }
  };
  const doSubmitRef = useRef(doSubmit);
  doSubmitRef.current = doSubmit;

  // Countdown — computed once from an absolute end timestamp (not a decrementing ref) so the
  // interval never drifts and never needs to be torn down/recreated every tick.
  useEffect(() => {
    if (!attempt || endAtRef.current !== null) return undefined;
    const totalSec = (attempt.examId?.durationMinutes || 30) * 60;
    const startedAt = attempt.startedAt ? new Date(attempt.startedAt).getTime() : Date.now();
    endAtRef.current = startedAt + totalSec * 1000;
    setDisplaySeconds(Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000)));

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setDisplaySeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        doSubmitRef.current();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt]);

  useEffect(() => {
    const timers = autosaveTimersRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (autosaveTimersRef.current[questionId]) clearTimeout(autosaveTimersRef.current[questionId]);
    autosaveTimersRef.current[questionId] = setTimeout(() => {
      autosave({ attemptId, questionId, answer: value }).catch(() => {});
    }, 350);
  };

  const handleSubmitPress = () => {
    const answeredCount = questions.filter((q) => isAnswered(answers[q._id])).length;
    const unanswered = questions.length - answeredCount;
    Alert.alert(
      'Submit Exam?',
      unanswered > 0 ? `You have ${unanswered} unanswered question(s). Are you sure you want to submit?` : 'All questions answered. Ready to submit?',
      [
        { text: 'Continue Exam', style: 'cancel' },
        { text: 'Submit', style: 'destructive', onPress: doSubmit },
      ]
    );
  };

  if (!attemptId) {
    return (
      <ScreenContainer>
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="alert-circle-outline" emptyLabel="No attempt selected" />
      </ScreenContainer>
    );
  }

  const answeredCount = questions.filter((q) => isAnswered(answers[q._id])).length;
  const isLowTime = displaySeconds !== null && displaySeconds <= 60;

  return (
    <ScreenContainer scrollable>
      <QueryState isLoading={isLoading || isFetching} isError={isError} error={error} onRetry={refetch} isEmpty={!attempt}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 }}>
            <IconWell icon="clock-outline" color={colors.primary} size={38} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
                {attempt?.examId?.title || 'Live Exam'}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {answeredCount} / {questions.length} answered
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: isLowTime ? colors.danger : colors.primary }}>
            {displaySeconds !== null ? formatDuration(displaySeconds) : '--:--'}
          </Text>
        </View>

        <ProgressBar
          progress={questions.length ? answeredCount / questions.length : 0}
          color={colors.primary}
          style={{ height: 6, borderRadius: 3, marginBottom: spacing.lg }}
        />

        {questions.length === 0 ? (
          <QueryState isLoading={false} isError={false} isEmpty emptyIcon="file-question-outline" emptyLabel="No questions available for this attempt" />
        ) : (
          questions.map((question, i) => (
            <QuestionTakeCard key={question._id || i} question={question} index={i} answer={answers[question._id]} onChange={handleAnswerChange} />
          ))
        )}

        <Button mode="contained" icon="send" loading={submitState.isLoading} disabled={submitState.isLoading || questions.length === 0} onPress={handleSubmitPress} style={{ marginTop: spacing.sm }}>
          Submit Exam
        </Button>
      </QueryState>

      <Snackbar visible={Boolean(snackbar)} onDismiss={() => setSnackbar(null)} duration={4000} style={{ backgroundColor: colors.danger }}>
        {snackbar}
      </Snackbar>
    </ScreenContainer>
  );
}
