import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { IconWell } from '../../components/ui/IconWell';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetAcademicYearsBySchoolQuery, useGetActiveAcademicYearQuery, useGetSchoolBoardsQuery, useGetSchoolClassesQuery } from '../../store/api/apiSlice';
import { AcademicYearStep } from './setup/AcademicYearStep';
import { BoardStep } from './setup/BoardStep';
import { ClassSectionStep } from './setup/ClassSectionStep';
import { SubjectMappingStep } from './setup/SubjectMappingStep';
import { ClassTeacherStep } from './setup/ClassTeacherStep';

const STEPS = [
  { key: 'year', title: 'Academic Year', icon: 'calendar-outline' },
  { key: 'board', title: 'Boards', icon: 'apps' },
  { key: 'classes', title: 'Classes', icon: 'view-grid-outline' },
  { key: 'subjects', title: 'Subjects', icon: 'book-open-variant' },
  { key: 'teachers', title: 'Teachers', icon: 'account-outline' },
];

/**
 * Same 5 steps as web's SchoolSetup.jsx, but built to match this app's own established tab-list
 * pattern (see SportsView.jsx / CanteenView.jsx: header → horizontal Chip row → content directly
 * below, no extra wrapping card) rather than literally porting web's desktop-wizard chrome
 * (stepper + progress bar + a second "active step" header row) — on a phone that reads as
 * cluttered/redundant, since the selected chip already shows which step you're on.
 *
 * Deliberate deviation from web: steps aren't gated behind completing the previous one — this
 * screen is realistically revisited long after initial setup (a new academic year, a new section
 * mid-year), so there's no value in re-locking steps 2-5 behind step 1 every time it's opened.
 */
export function SchoolSetupView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id ?? user?.schoolId;
  // user.academicYear from login is always empty (User has no academicYearId field server-side —
  // see StudentPicker.jsx's own comment on this). Fetch the real active year instead.
  const activeYearQuery = useGetActiveAcademicYearQuery(schoolId, { skip: !schoolId });
  const academicYearId = activeYearQuery.data?._id;
  const [activeKey, setActiveKey] = useState('year');

  // Presence-based "is this step done" for the chip checkmarks — not a manually-advanced wizard
  // state, since steps aren't gated here (see header comment).
  const yearsQuery = useGetAcademicYearsBySchoolQuery(schoolId, { skip: !schoolId });
  const boardsQuery = useGetSchoolBoardsQuery(schoolId, { skip: !schoolId });
  const classesQuery = useGetSchoolClassesQuery({ schoolId, academicYearId }, { skip: !schoolId || !academicYearId });

  const doneMap = {
    year: (yearsQuery.data?.length ?? 0) > 0,
    board: (boardsQuery.data?.length ?? 0) > 0,
    classes: (classesQuery.data?.length ?? 0) > 0,
    subjects: (classesQuery.data ?? []).some((c) => (c.sections ?? []).some((s) => (s.subjects ?? []).length > 0)),
    teachers: (classesQuery.data ?? []).some((c) => (c.sections ?? []).some((s) => s.teacher)),
  };
  const doneCount = Object.values(doneMap).filter(Boolean).length;

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="domain" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>School Setup</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {doneCount}/{STEPS.length} steps configured
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' }}
      >
        {STEPS.map((step) => (
          <Chip
            key={step.key}
            selected={activeKey === step.key}
            onPress={() => setActiveKey(step.key)}
            icon={doneMap[step.key] ? 'check-circle' : step.icon}
          >
            {step.title}
          </Chip>
        ))}
      </ScrollView>

      {activeKey === 'year' && <AcademicYearStep />}
      {activeKey === 'board' && <BoardStep />}
      {activeKey === 'classes' && <ClassSectionStep />}
      {activeKey === 'subjects' && <SubjectMappingStep />}
      {activeKey === 'teachers' && <ClassTeacherStep />}
    </ScreenContainer>
  );
}
