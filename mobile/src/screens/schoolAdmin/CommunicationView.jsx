import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { Panel } from '../../components/ui/Panel';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { SearchField } from '../../components/ui/SearchField';
import { ComposeNotificationSheet } from './ComposeNotificationSheet';
import { formatDate, timeAgo } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetNotificationAnalyticsQuery, useGetNotificationsQuery } from '../../store/api/apiSlice';

const LEVEL_LABEL = { all: 'Everyone', role: 'By Role', 'user-level': 'By Class/Level', user: 'Specific Users' };
const STATUS_COLOR = { sent: '#22C55E', scheduled: '#F59E0B', draft: '#94A3B8', failed: '#DC2626' };
const CHANNEL_TAGS = [
  { key: 'inApp', label: 'In-App', color: '#2563EB' },
  { key: 'email', label: 'Email', color: '#16A34A' },
  { key: 'sms', label: 'SMS', color: '#D97706' },
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
];

/** School Admin's broadcast tool — the "Communication" sidebar item's Broadcast + History tabs
 * (frontend/src/pages/School_Admin/Communication/CommunicationHub.jsx). The web page's third tab,
 * 1:1 Messages, is deliberately not duplicated here — mobile already has that as its own nav
 * destination (MessagesScreen.jsx / messages/MessagesInbox.jsx), the standard mobile pattern of a
 * dedicated tab rather than a sub-tab of a hub page. */
export function CommunicationView() {
  const { colors, typography, spacing } = useAppTheme();
  const [composing, setComposing] = useState(false);
  const [tab, setTab] = useState('broadcast');
  const [historySearch, setHistorySearch] = useState('');
  const [historyChannel, setHistoryChannel] = useState('all');

  const analyticsQuery = useGetNotificationAnalyticsQuery();
  const stats = analyticsQuery.data ?? {};

  const { data, isLoading, isFetching, isError, error, refetch } = useGetNotificationsQuery();
  const notifications = data ?? [];

  const history = useMemo(() => notifications.filter((n) => n.status === 'sent'), [notifications]);
  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    return history.filter((item) => {
      const matchesChannel = historyChannel === 'all' || item.channels?.[historyChannel];
      const matchesSearch = !query || `${item.title} ${item.message}`.toLowerCase().includes(query);
      return matchesChannel && matchesSearch;
    });
  }, [history, historySearch, historyChannel]);

  const channelTotals = useMemo(
    () => ({
      inApp: history.filter((h) => h.channels?.inApp).length,
      sms: history.filter((h) => h.channels?.sms).length,
      email: history.filter((h) => h.channels?.email).length,
    }),
    [history]
  );

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="bullhorn-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Communication Centre</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={2}>
            Broadcast notifications and track delivery history
          </Text>
        </View>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Sent" metric={{ value: stats.sent ?? 0, icon: 'send-outline', color: colors.primary }} />
          <StatCard label="Opened" metric={{ value: stats.opened ?? 0, icon: 'email-open-outline', color: '#22C55E' }} />
          <StatCard label="Scheduled" metric={{ value: stats.scheduled ?? 0, icon: 'clock-outline', color: '#F59E0B' }} />
          <StatCard label="Drafts" metric={{ value: stats.draft ?? 0, icon: 'file-edit-outline', color: '#94A3B8' }} />
        </StatGrid>
      </View>

      <SegmentedButtons
        value={tab}
        onValueChange={setTab}
        style={{ marginBottom: spacing.lg }}
        buttons={[
          { value: 'broadcast', label: 'Broadcast' },
          { value: 'history', label: 'History' },
        ]}
      />

      {tab === 'broadcast' ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
            <Button mode="contained" icon="bullhorn-outline" onPress={() => setComposing(true)}>
              Broadcast
            </Button>
          </View>

          <QueryState
            isLoading={isLoading || isFetching}
            isError={isError}
            error={error}
            onRetry={refetch}
            isEmpty={notifications.length === 0}
            emptyIcon="bullhorn-outline"
            emptyLabel="No broadcasts sent yet"
          >
            {notifications.map((item) => (
              <AccentListCard
                key={item._id}
                accent={STATUS_COLOR[item.status] || colors.textMuted}
                avatar={<IconWell icon="bullhorn-outline" color={STATUS_COLOR[item.status] || colors.textMuted} size={40} />}
                title={item.title}
                subtitle={`${LEVEL_LABEL[item.level] ?? item.level} · ${timeAgo(item.createdAt)}`}
                badge={<StatusPill label={item.status} color={STATUS_COLOR[item.status] || colors.textMuted} />}
                meta={[
                  { label: 'Message', value: item.message },
                  { label: 'Sent', value: item.deliveryStats?.sent ?? 0 },
                  { label: 'Opened', value: item.deliveryStats?.opened ?? 0 },
                ]}
                expandable
              />
            ))}
          </QueryState>
        </>
      ) : (
        <>
          <View style={{ marginBottom: spacing.lg }}>
            <StatGrid>
              <StatCard label="In-App" metric={{ value: channelTotals.inApp, icon: 'bell-outline', color: '#2563EB' }} />
              <StatCard label="SMS" metric={{ value: channelTotals.sms, icon: 'message-text-outline', color: '#D97706' }} />
              <StatCard label="Email" metric={{ value: channelTotals.email, icon: 'email-outline', color: '#16A34A' }} />
              <StatCard label="Total" metric={{ value: history.length, icon: 'history', color: '#7C3AED' }} />
            </StatGrid>
          </View>

          <Panel>
            <SearchField value={historySearch} onChangeText={setHistorySearch} placeholder="Search title or message" style={{ marginBottom: spacing.sm }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {[{ key: 'all', label: 'All Channels' }, ...CHANNEL_TAGS].map((c) => (
                <Button
                  key={c.key}
                  mode={historyChannel === c.key ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setHistoryChannel(c.key)}
                >
                  {c.label}
                </Button>
              ))}
            </View>
          </Panel>

          <QueryState
            isLoading={isLoading || isFetching}
            isError={isError}
            error={error}
            onRetry={refetch}
            isEmpty={filteredHistory.length === 0}
            emptyIcon="history"
            emptyLabel="No history found"
          >
            {filteredHistory.map((item) => (
              <Panel key={item._id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                  <Text style={[typography.bodyStrong, { color: colors.text, flex: 1, marginRight: spacing.sm }]}>{item.title}</Text>
                  <StatusPill label={LEVEL_LABEL[item.level] ?? item.level} color={colors.primary} />
                </View>
                <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]} numberOfLines={2}>
                  {item.message}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm }}>
                  {CHANNEL_TAGS.filter((c) => item.channels?.[c.key]).map((c) => (
                    <StatusPill key={c.key} label={c.label} color={c.color} />
                  ))}
                </View>
                <Text style={[typography.caption, { color: colors.textMuted }]}>
                  By {item.createdBy || 'System'} · {formatDate(item.createdAt)}
                </Text>
              </Panel>
            ))}
          </QueryState>
        </>
      )}

      <ComposeNotificationSheet visible={composing} onDismiss={() => setComposing(false)} onCreated={() => setComposing(false)} />
    </ScreenContainer>
  );
}
