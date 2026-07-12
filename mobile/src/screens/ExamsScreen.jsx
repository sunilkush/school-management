import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { TeacherExamsView } from './exams/TeacherExamsView';
import { StudentExamsView } from './exams/StudentExamsView';
import { ParentExamsView } from './exams/ParentExamsView';
import { ExamManagementView } from './schoolAdmin/ExamManagementView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';

const HANDLED_ROLES = new Set(['Teacher', 'Student', 'Parent']);
// These roles are all in the backend's EXAM_MANAGE_ROLES (exam.routes.js) — same full
// create/schedule capability as School Admin, not a read-only view. Subject Coordinator's web
// sidebar labels this destination "Assessments" rather than "Exams", but it's the exact same
// ExamPage.jsx component and backend contract — reused verbatim via the 'Assessments' nav key.
const MANAGE_ROLES = new Set(['School Admin', 'Principal', 'Vice Principal', 'Subject Coordinator']);

export function ExamsScreen() {
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
      {role?.name === 'Student' && <StudentExamsView />}
      {role?.name === 'Parent' && <ParentExamsView />}
      {MANAGE_ROLES.has(role?.name) && <ExamManagementView />}
      {!HANDLED_ROLES.has(role?.name) && !MANAGE_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="pencil-off-outline" emptyLabel="Exams view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}
