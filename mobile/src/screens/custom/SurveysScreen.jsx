import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button, Chip, Divider, HelperText, List, Text, TextInput } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppHeaderOptions } from '../../navigation/headerOptions';
import { useAppTheme } from '../../theme/ThemeProvider';
import { formatDate } from '../../utils/format';
import { useGetMySurveysQuery, useSubmitSurveyResponseMutation } from '../../store/api/apiSlice';

const RATINGS = [1, 2, 3, 4, 5];

/** Empty for validation purposes — `false` and `0` are real answers, not blanks. */
function isBlank(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function Question({ question, value, onChange, error }) {
  const { colors, typography, spacing } = useAppTheme();

  const body = () => {
    switch (question.type) {
      case 'rating':
        return (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {RATINGS.map((n) => (
              <Chip key={n} selected={value === n} showSelectedCheck={false} onPress={() => onChange(n)} compact>
                {String(n)}
              </Chip>
            ))}
          </View>
        );

      case 'yes_no':
        return (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[
              { label: 'Yes', v: true },
              { label: 'No', v: false },
            ].map((option) => (
              <Chip
                key={option.label}
                // `value === option.v` and not a truthiness check — "No" is an answer, and a
                // truthy test would render a submitted "No" as unanswered.
                selected={value === option.v}
                showSelectedCheck={false}
                onPress={() => onChange(option.v)}
                compact
              >
                {option.label}
              </Chip>
            ))}
          </View>
        );

      case 'single_choice':
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {question.options.map((option) => (
              <Chip key={option} selected={value === option} showSelectedCheck={false} onPress={() => onChange(option)} compact>
                {option}
              </Chip>
            ))}
          </View>
        );

      case 'multi_choice': {
        const picked = Array.isArray(value) ? value : [];
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {question.options.map((option) => (
              <Chip
                key={option}
                selected={picked.includes(option)}
                showSelectedCheck={false}
                onPress={() =>
                  onChange(picked.includes(option) ? picked.filter((o) => o !== option) : [...picked, option])
                }
                compact
              >
                {option}
              </Chip>
            ))}
          </View>
        );
      }

      case 'number':
        return (
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={value == null ? '' : String(value)}
            onChangeText={(text) => onChange(text === '' ? null : Number(text))}
          />
        );

      default:
        return (
          <TextInput
            mode="outlined"
            multiline={question.type === 'long_text'}
            numberOfLines={question.type === 'long_text' ? 4 : 1}
            value={value ?? ''}
            onChangeText={onChange}
          />
        );
    }
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.bodyStrong, { color: colors.text }]}>
        {question.text}
        {question.required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      {question.helpText ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
          {question.helpText}
        </Text>
      ) : null}
      <View style={{ marginTop: spacing.xs }}>{body()}</View>
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  );
}

function SurveyList({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isError, error, refetch, isFetching } = useGetMySurveysQuery();
  const surveys = Array.isArray(data) ? data : [];

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={surveys.length === 0}
        emptyIcon="clipboard-text-outline"
        emptyLabel="No surveys are waiting for you"
      >
        <>
          {surveys.map((survey) => (
            <View key={survey._id}>
              <List.Item
                title={survey.title}
                titleStyle={[survey.hasResponded ? typography.body : typography.bodyStrong, { color: colors.text }]}
                description={
                  survey.closesAt ? `Closes ${formatDate(survey.closesAt)}` : survey.description || undefined
                }
                left={(props) => (
                  <List.Icon {...props} icon={survey.isAnonymous ? 'incognito' : 'clipboard-text-outline'} />
                )}
                right={() => (
                  <View style={{ justifyContent: 'center' }}>
                    <StatusPill
                      label={survey.hasResponded ? 'answered' : 'awaiting you'}
                      color={survey.hasResponded ? '#15803D' : '#B45309'}
                    />
                  </View>
                )}
                onPress={() => navigation.navigate('SurveyRespond', { survey })}
              />
              <Divider style={{ backgroundColor: colors.borderMuted }} />
            </View>
          ))}
          {isFetching ? (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md }]}>Refreshing…</Text>
          ) : null}
        </>
      </QueryState>
    </ScreenContainer>
  );
}

function SurveyRespond({ route, navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const survey = route.params?.survey ?? {};
  const questions = survey.questions ?? [];

  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submit, { isLoading }] = useSubmitSurveyResponseMutation();

  const alreadyAnswered = Boolean(survey.hasResponded);

  const onSubmit = () => {
    const found = {};
    for (const question of questions) {
      if (question.required && isBlank(answers[question.key])) {
        found[question.key] = 'This one is required';
      }
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    submit({
      id: survey._id,
      // Unanswered optional questions are left out entirely rather than sent as nulls — the
      // backend treats a missing key and an empty value the same, and omitting keeps the stored
      // response honest about what was actually answered.
      answers: questions
        .filter((question) => !isBlank(answers[question.key]))
        .map((question) => ({ questionKey: question.key, value: answers[question.key] })),
    })
      .unwrap()
      .then(() => navigation.goBack())
      // errorMiddleware.js already alerts on a rejected mutation.
      .catch(() => {});
  };

  const anonymityNote = useMemo(
    () =>
      survey.isAnonymous
        ? 'Your answers are anonymous — they are stored separately from the record that you replied, so nobody can trace them back to you. That also means they cannot be changed once sent.'
        : 'Your name is recorded with your answers.',
    [survey.isAnonymous]
  );

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.h3, { color: colors.text }]}>{survey.title}</Text>
      {survey.description ? (
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {survey.description}
        </Text>
      ) : null}

      {/* Said before they answer, not after — anonymity is the whole reason someone answers
          honestly, and irreversibility is the price of it. */}
      <Text
        style={[
          typography.caption,
          { color: survey.isAnonymous ? colors.primary : colors.textMuted, marginTop: spacing.md, marginBottom: spacing.lg },
        ]}
      >
        {anonymityNote}
      </Text>

      {alreadyAnswered ? (
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          You have already answered this survey.
        </Text>
      ) : (
        <>
          {questions.map((question) => (
            <Question
              key={question.key}
              question={question}
              value={answers[question.key]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, [question.key]: value }))}
              error={errors[question.key]}
            />
          ))}

          <Button mode="contained" onPress={onSubmit} loading={isLoading} disabled={isLoading}>
            Send my answers
          </Button>
        </>
      )}
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

/**
 * Surveys — answering one.
 *
 * Bespoke rather than a registry descriptor because the form is built from the survey's own
 * questions at runtime: seven question types (rating, yes/no, single and multi choice, number,
 * short and long text), each with its own control. The generic FormSheet takes a fixed field list
 * declared up front, which cannot express that.
 *
 * Only the respondent's side. Building surveys, and reading who has and has not replied, is staff
 * work with its own screens.
 */
export function SurveysScreen() {
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="SurveyList" component={SurveyList} options={{ title: 'Surveys' }} />
      <Stack.Screen name="SurveyRespond" component={SurveyRespond} options={{ title: 'Survey' }} />
    </Stack.Navigator>
  );
}

SurveysScreen.selfHeadered = true;
