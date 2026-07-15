import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { avatarColorFor } from '../../theme/patterns';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetStudentDetailsQuery } from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';
import { studentStatusColor } from '../../utils/studentStatus';

/**
 * Reached by tapping a row in the Student List (Teacher/Admin roles, passing the real Student._id
 * — see GET /student/all's `studentId` field) or a child card in My Children (Parent, using
 * child._id which already is a Student._id). Backend role-scopes the lookup itself (see the
 * getStudentById fix — Student always gets their own profile regardless of the id passed).
 */
export function StudentDetailsScreen({ route }) {
  const { colors, typography, spacing } = useAppTheme();
  const { studentId } = route.params ?? {};
  const { data: student, isLoading, isError, error, refetch } = useGetStudentDetailsQuery(studentId, { skip: !studentId });

  const user = student?.userId;
  const statusColor = studentStatusColor(student?.status, colors.textMuted);

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={!student}
        emptyIcon="account-off-outline"
        emptyLabel="Student profile not found"
      >
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <AvatarInitials name={user?.name} size={72} />
          <Text style={[typography.h2, { color: colors.text, marginTop: spacing.md }]}>{user?.name}</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>{user?.email}</Text>
          {student?.status ? (
            <View style={{ marginTop: spacing.sm }}>
              <StatusPill label={student.status} color={statusColor} />
            </View>
          ) : null}
        </View>

        <AccentListCard
          accent={avatarColorFor(user?.name).color}
          title="Personal Information"
          avatar={null}
          meta={[
            { label: 'Date of Birth', value: student?.dateOfBirth ? formatDate(student.dateOfBirth) : null },
            { label: 'Gender', value: student?.gender },
            { label: 'Blood Group', value: student?.bloodGroup },
            { label: 'Religion', value: student?.religion },
          ]}
        />

        <AccentListCard
          accent={colors.info}
          title="Contact"
          avatar={null}
          meta={[{ label: 'Phone', value: user?.phone }, { label: 'Address', value: student?.address }]}
        />

        {(student?.fatherInfo?.name || student?.fatherId?.name) && (
          <AccentListCard
            accent={colors.accent}
            title="Father"
            avatar={null}
            meta={[
              { label: 'Name', value: student?.fatherInfo?.name || student?.fatherId?.name },
              { label: 'Mobile', value: student?.fatherInfo?.mobile },
              { label: 'Email', value: student?.fatherInfo?.email || student?.fatherId?.email },
            ]}
          />
        )}

        {(student?.motherInfo?.name || student?.motherId?.name) && (
          <AccentListCard
            accent={colors.accent}
            title="Mother"
            avatar={null}
            meta={[
              { label: 'Name', value: student?.motherInfo?.name || student?.motherId?.name },
              { label: 'Mobile', value: student?.motherInfo?.mobile },
              { label: 'Email', value: student?.motherInfo?.email || student?.motherId?.email },
            ]}
          />
        )}

        {student?.notes ? (
          <AccentListCard accent={colors.warning} title="Notes" avatar={null} subtitle={student.notes} />
        ) : null}
      </QueryState>
    </ScreenContainer>
  );
}
