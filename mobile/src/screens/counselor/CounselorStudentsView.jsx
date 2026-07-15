import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { IconWell } from '../../components/ui/IconWell';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetCounselingSessionsQuery } from '../../store/api/apiSlice';

/** No dedicated student-profile backend exists for this role — mirrors frontend's
 * CounselorStudents (pages/Counselor/CounselorPages.jsx), which derives a synthetic per-student
 * list by grouping ALL counseling-session/appointment records client-side. Deliberately not the
 * generic student directory: Counselor isn't in that endpoint's role allow-list, and the web page
 * itself never calls it either. */
export function CounselorStudentsView() {
  const { colors, typography, spacing } = useAppTheme();

  const { data, isLoading, isFetching, isError, error, refetch } = useGetCounselingSessionsQuery({});
  const sessions = data?.sessions ?? [];

  const students = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      const key = s.studentId || s.studentName || 'Unknown';
      if (!map.has(key)) {
        map.set(key, { key, name: s.studentName || '—', className: s.studentClass || '—', sessionCount: 0, lastSeen: s.sessionDate, issue: s.issue });
      }
      const entry = map.get(key);
      entry.sessionCount += 1;
      if (new Date(s.sessionDate) > new Date(entry.lastSeen)) {
        entry.lastSeen = s.sessionDate;
        entry.issue = s.issue;
      }
    });
    return [...map.values()].sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
  }, [sessions]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-heart-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Student Profiles</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Students seen in counseling sessions or appointments
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={students.length === 0}
        emptyIcon="account-heart-outline"
        emptyLabel="No counseling sessions found. Add sessions to see students here."
      >
        {students.map((st) => (
          <AccentListCard
            key={st.key}
            accent={colors.primary}
            avatar={<AvatarInitials name={st.name} size={40} />}
            title={st.name}
            subtitle={st.className}
            meta={[
              { label: 'Sessions', value: st.sessionCount },
              { label: 'Last Seen', value: formatDate(st.lastSeen) },
              { label: 'Last Issue', value: st.issue },
            ]}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}
