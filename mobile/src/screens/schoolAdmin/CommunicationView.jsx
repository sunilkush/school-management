import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { IconWell } from '../../components/ui/IconWell';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { ComposeNotificationSheet } from './ComposeNotificationSheet';
import { timeAgo } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetNotificationAnalyticsQuery, useGetNotificationsQuery } from '../../store/api/apiSlice';

const LEVEL_LABEL = { all: 'Everyone', role: 'By Role', 'user-level': 'By Class/Level', user: 'Specific Users' };
const STATUS_COLOR = { sent: '#22C55E', scheduled: '#F59E0B', draft: '#94A3B8' };

/** School Admin's broadcast tool — the "Communication" sidebar item's Broadcast tab
 * (frontend/src/pages/School_Admin/Communication/CommunicationHub.jsx). The 1:1 Messages inbox is
 * a separate, already-built mobile screen; this is send-to-many via POST /notifications. */
export function CommunicationView() {
  const { colors, typography, spacing } = useAppTheme();
  const [composing, setComposing] = useState(false);

  const analyticsQuery = useGetNotificationAnalyticsQuery();
  const stats = analyticsQuery.data ?? {};

  const { data, isLoading, isFetching, isError, error, refetch } = useGetNotificationsQuery();
  const notifications = data ?? [];

  return (
    <ScreenContainer scrollable>
      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Sent" metric={{ label: 'Sent', icon: 'send-outline', color: colors.primary, value: stats.sent ?? 0 }} />
          <StatCard label="Opened" metric={{ label: 'Opened', icon: 'email-open-outline', color: '#22C55E', value: stats.opened ?? 0 }} />
          <StatCard label="Scheduled" metric={{ label: 'Scheduled', icon: 'clock-outline', color: '#F59E0B', value: stats.scheduled ?? 0 }} />
        </StatGrid>
      </View>

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

      <ComposeNotificationSheet visible={composing} onDismiss={() => setComposing(false)} onCreated={() => setComposing(false)} />
    </ScreenContainer>
  );
}
