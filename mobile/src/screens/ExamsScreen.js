import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { IconWell } from '../components/ui/IconWell';
import { TeacherExamsView } from './exams/TeacherExamsView';
import { StudentExamsView } from './exams/StudentExamsView';
import { ParentExamsView } from './exams/ParentExamsView';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';

const HANDLED_ROLES = new Set(['Teacher', 'Student', 'Parent']);

/** Read-only exam list + published results across the 3 roles the mobile nav gives an Exams tab
 * to. School Admin/Principal exam management (create/schedule/paper-builder/admit-cards/seat-
 * plan) is a separate, much larger feature deferred entirely — see apiSlice.js's getExams. */
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
      {!HANDLED_ROLES.has(role?.name) && (
        <QueryState isLoading={false} isError={false} isEmpty emptyIcon="pencil-off-outline" emptyLabel="Exams view isn't available for this role yet" />
      )}
    </ScreenContainer>
  );
}
