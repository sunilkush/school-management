import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { AccentListCard } from '../components/ui/AccentListCard';
import { IconWell } from '../components/ui/IconWell';
import { StatusPill } from '../components/ui/StatusPill';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from '../store/api/apiSlice';
import { formatDate } from '../utils/format';

/**
 * There's no separate "Notices" concept backend-side — Notices and Notifications share one
 * Notification model/API (level: all/role/user-level/user, GET /notifications). One real screen
 * covers both rather than building two nearly-identical UIs against the same endpoint.
 */
export function NotificationsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation();

  const notifications = data ?? [];
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <Text style={[typography.h2, { color: colors.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <Button mode="text" onPress={markAllRead} loading={markAllState.isLoading} compact>
            Mark all read
          </Button>
        )}
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={notifications.length === 0}
        emptyIcon="bell-outline"
        emptyLabel="No notifications yet"
      >
        {notifications.map((item) => {
          const unread = !item.isRead;
          const accent = unread ? colors.primary : colors.border;
          return (
            <AccentListCard
              key={item._id}
              accent={accent}
              avatar={<IconWell icon={unread ? 'bell' : 'bell-outline'} color={unread ? colors.primary : colors.textMuted} size={38} />}
              title={item.title}
              subtitle={item.message}
              badge={unread ? <StatusPill label="New" color={colors.primary} /> : null}
              meta={[{ label: 'From', value: item.createdBy }, { label: 'Sent', value: formatDate(item.createdAt) }]}
              onPress={unread ? () => markRead(item._id) : undefined}
            />
          );
        })}
      </QueryState>
    </ScreenContainer>
  );
}
