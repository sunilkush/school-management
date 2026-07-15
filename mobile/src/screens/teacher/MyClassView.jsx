import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../hooks/useAuth';
import { useGetMyClassTeacherAssignmentQuery } from '../../store/api/apiSlice';

/** "Which class am I in charge of" summary + shortcuts — mirrors frontend's MyClassPage.jsx
 * exactly: a single-assignment info card (not a roster/subject dashboard, that's AssignedClasses)
 * plus 4 quick-navigation shortcuts to other Class Teacher destinations. Reads the
 * ClassTeacherAssignment collection (GET /class-teacher-assignments/my), a different, richer
 * model than Section.classTeacherId used by MyStudents. */
export function MyClassView({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();

  const { data: assignment, isLoading, isError, error, refetch } = useGetMyClassTeacherAssignmentQuery();

  const QUICK_ACTIONS = [
    { key: 'Attendance', label: 'Mark Attendance', icon: 'clipboard-check-outline' },
    { key: 'MyStudents', label: 'My Students', icon: 'account-group-outline' },
    { key: 'Timetable', label: 'Timetable', icon: 'calendar-clock-outline' },
    { key: 'GpsCheckInOut', label: 'GPS Check-In', icon: 'crosshairs-gps' },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="book-open-variant" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>My Class</Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!assignment}
        emptyIcon="book-off-outline"
        emptyLabel="No Class Assigned Yet — the school admin has not assigned you as a class teacher yet."
      >
        <View style={{ padding: spacing.lg, borderRadius: 16, backgroundColor: colors.primary, marginBottom: spacing.lg }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>
            {assignment?.schoolClassId?.name ?? assignment?.schoolClassId?.grade ?? 'Class'}
          </Text>
          {assignment?.sectionId?.name && (
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 4 }}>
              Section {assignment.sectionId.name}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md }}>
            <StatusPill label={`Class In-Charge: ${assignment?.teacherId?.name ?? user?.name ?? '—'}`} color="#ffffff" />
          </View>
          {assignment?.academicYearId?.name && (
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 }}>
              {assignment.academicYearId.name}
            </Text>
          )}
        </View>

        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>QUICK ACTIONS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.key}
              mode="outlined"
              icon={action.icon}
              style={{ flexBasis: '47%', flexGrow: 1 }}
              onPress={() => navigation?.navigate(action.key)}
            >
              {action.label}
            </Button>
          ))}
        </View>
      </QueryState>
    </ScreenContainer>
  );
}
