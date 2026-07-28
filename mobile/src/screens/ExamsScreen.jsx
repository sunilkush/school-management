import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { TeacherExamsView } from './exams/TeacherExamsView';
import { StudentExamsView } from './exams/StudentExamsView';
import { ParentExamsView } from './exams/ParentExamsView';
import { ExamManagementView } from './schoolAdmin/ExamManagementView';
import { ExamTakeScreen } from './exams/ExamTakeScreen';
import { AttemptReviewScreen } from './exams/AttemptReviewScreen';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAppHeaderOptions } from '../navigation/headerOptions';

const HANDLED_ROLES = new Set(['Teacher', 'Student', 'Parent']);
// These roles are all in the backend's EXAM_MANAGE_ROLES (exam.routes.js) — same full
// create/schedule capability as School Admin, not a read-only view. Subject Coordinator's web
// sidebar labels this destination "Assessments" rather than "Exams", but it's the exact same
// ExamPage.jsx component and backend contract — reused verbatim via the 'Assessments' nav key.
// Exam Coordinator was missing here entirely — their own NAV_CONFIG references 'Exams' directly
// (the "Exam Operations" group), so this role's actual core feature was showing "Exams view
// isn't available for this role yet" despite the backend's EXAM_MANAGE_ROLES already granting it
// full create/schedule access.
const MANAGE_ROLES = new Set(['School Admin', 'Principal', 'Vice Principal', 'Subject Coordinator', 'Exam Coordinator']);

function ExamsMain({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="pencil-box-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Exams</Text>
        </View>
      </View>

      {role?.name === 'Teacher' && <TeacherExamsView />}
      {role?.name === 'Student' && <StudentExamsView navigation={navigation} />}
      {role?.name === 'Parent' && <ParentExamsView />}
      {MANAGE_ROLES.has(role?.name) && <ExamManagementView />}
      {!HANDLED_ROLES.has(role?.name) && !MANAGE_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="pencil-off-outline" emptyLabel="Exams view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

// Nested stack (Exams home → live exam-taking → attempt review, Student only) — see
// SELF_HEADERED_KEYS in screenForModule.js. Teacher/Parent/Admin branches never navigate past the
// home route, so this is a no-op restructuring for them beyond the header now coming from this
// screen's own Stack.Navigator instead of the parent tab.
export function ExamsScreen() {
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="ExamsMain" component={ExamsMain} options={{ title: 'Exams' }} />
      <Stack.Screen
        name="ExamTake"
        component={ExamTakeScreen}
        options={{ title: 'Exam', headerBackVisible: false, gestureEnabled: false }}
      />
      <Stack.Screen name="ExamAttemptReview" component={AttemptReviewScreen} options={{ title: 'Attempt Review' }} />
    </Stack.Navigator>
  );
}
