import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatusPill } from '../../components/ui/StatusPill';
import { CreateTeamSheet } from './CreateTeamSheet';
import { CreateSportsEventSheet } from './CreateSportsEventSheet';
import { CreateAchievementSheet } from './CreateAchievementSheet';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useGetSportsTeamsQuery,
  useDeleteSportsTeamMutation,
  useGetSportsEventsQuery,
  useGetAchievementsQuery,
  useDeleteAchievementMutation,
} from '../../store/api/apiSlice';

const RESULT_COLOR = { Won: '#22C55E', Lost: '#EF4444', Draw: '#F59E0B', Pending: '#94A3B8' };
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

function TeamsTab() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError, error, refetch } = useGetSportsTeamsQuery();
  const teams = data ?? [];
  const [deleteTeam, deleteState] = useDeleteSportsTeamMutation();

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)} compact>New Team</Button>
      </View>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} isEmpty={teams.length === 0} emptyIcon="account-group-outline" emptyLabel="No teams created yet">
        {teams.map((t) => (
          <AccentListCard
            key={t._id}
            accent={colors.primary}
            avatar={<IconWell icon="trophy-outline" color={colors.primary} size={40} />}
            title={t.name}
            subtitle={t.sportType || t.category}
            badge={<StatusPill label={`${t.members?.length ?? 0} members`} color={colors.primary} />}
            meta={[
              { label: 'Category', value: t.category },
              { label: 'Coach', value: t.coachId?.name || '—' },
            ]}
            expandable
            actions={<Button compact textColor={colors.danger} loading={deleteState.isLoading} disabled={deleteState.isLoading} onPress={() => deleteTeam(t._id)}>Delete</Button>}
          />
        ))}
      </QueryState>
      <CreateTeamSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </>
  );
}

function EventsTab() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError, error, refetch } = useGetSportsEventsQuery();
  const events = data ?? [];

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)} compact>New Event</Button>
      </View>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} isEmpty={events.length === 0} emptyIcon="tournament" emptyLabel="No sports events yet">
        {events.map((e) => (
          <AccentListCard
            key={e._id}
            accent={RESULT_COLOR[e.result] || colors.primary}
            avatar={<IconWell icon="tournament" color={RESULT_COLOR[e.result] || colors.primary} size={40} />}
            title={e.title}
            subtitle={[e.teamId?.name, e.eventType].filter(Boolean).join(' · ')}
            badge={<StatusPill label={e.result} color={RESULT_COLOR[e.result] || colors.textMuted} />}
            meta={[
              { label: 'Opponent', value: e.opponent || '—' },
              { label: 'Date', value: fmtDate(e.eventDate) },
              { label: 'Venue', value: e.venue || '—' },
              { label: 'Score', value: e.scoreDetails || '—' },
            ]}
            expandable
          />
        ))}
      </QueryState>
      <CreateSportsEventSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </>
  );
}

function AchievementsTab() {
  const { colors, spacing } = useAppTheme();
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError, error, refetch } = useGetAchievementsQuery();
  const achievements = data ?? [];
  const [deleteAchievement, deleteState] = useDeleteAchievementMutation();

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="plus" onPress={() => setCreating(true)} compact>New Achievement</Button>
      </View>
      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} isEmpty={achievements.length === 0} emptyIcon="medal-outline" emptyLabel="No achievements recorded yet">
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
              { label: 'Type', value: a.holderType },
            ]}
            expandable
            actions={<Button compact textColor={colors.danger} loading={deleteState.isLoading} disabled={deleteState.isLoading} onPress={() => deleteAchievement(a._id)}>Delete</Button>}
          />
        ))}
      </QueryState>
      <CreateAchievementSheet visible={creating} onDismiss={() => setCreating(false)} onCreated={() => setCreating(false)} />
    </>
  );
}

/** Reused across Sports Teacher, School Admin, Principal, Vice Principal — same SPORTS_ROLES gate
 * as web's sports.routes.js. Three grouped sub-lists in one screen (local tab state), matching
 * this app's own pattern for "one screen, several CRUD sub-lists" (e.g. SecuritySettings.jsx's
 * tab bar on the web side, mirrored here with Chips instead of a Tab.Navigator since none of the
 * three lists need their own header/back button). */
export function SportsView() {
  const { colors, typography, spacing } = useAppTheme();
  const [tab, setTab] = useState('teams');

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="trophy-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Sports</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Teams, events, and achievements
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
        <Chip selected={tab === 'teams'} onPress={() => setTab('teams')}>Teams</Chip>
        <Chip selected={tab === 'events'} onPress={() => setTab('events')}>Events</Chip>
        <Chip selected={tab === 'achievements'} onPress={() => setTab('achievements')}>Achievements</Chip>
      </View>

      {tab === 'teams' && <TeamsTab />}
      {tab === 'events' && <EventsTab />}
      {tab === 'achievements' && <AchievementsTab />}
    </ScreenContainer>
  );
}
