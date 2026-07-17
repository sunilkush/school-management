import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMyAchievementsQuery } from '../../store/api/apiSlice';

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Student and Parent self-service — same "no ChildPicker" reasoning as MyCertificatesView: GET
 * /sports/achievements/my is parameterless and pre-aggregates across all of a Parent's children
 * server-side via resolveMyStudentIds. */
export function MyAchievementsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetMyAchievementsQuery();
  const achievements = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="medal-outline" color="#F59E0B" size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Achievements</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Sports & co-curricular recognitions
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={achievements.length === 0}
        emptyIcon="medal-outline"
        emptyLabel="No achievements recorded yet"
        loadingLabel={isFetching ? 'Refreshing…' : 'Loading…'}
      >
        {achievements.map((a) => (
          <AccentListCard
            key={a._id}
            accent="#F59E0B"
            avatar={<IconWell icon="medal-outline" color="#F59E0B" size={40} />}
            title={a.title}
            subtitle={a.holderName}
            badge={<StatusPill label={a.level} color="#F59E0B" />}
            meta={[
              { label: 'Position', value: a.position || '—' },
              { label: 'Event', value: a.eventName || '—' },
              { label: 'Date', value: fmtDate(a.achievementDate) },
            ]}
            expandable
          />
        ))}
      </QueryState>
    </ScreenContainer>
  );
}
