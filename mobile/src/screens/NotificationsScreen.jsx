import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { StatusPill } from '../components/ui/StatusPill';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from '../store/api/apiSlice';
import { timeAgo } from '../utils/format';

// Mirrors the web app's Notification.jsx LEVEL_META — same 4 audience types the backend model
// actually stores (level: all/role/user-level/user), just with mobile-friendly icon names.
const LEVEL_META = {
  all: { label: 'Broadcast', icon: 'earth', color: '#2563EB' },
  role: { label: 'Role', icon: 'account-multiple-outline', color: '#7C3AED' },
  'user-level': { label: 'Level', icon: 'account-switch-outline', color: '#D97706' },
  user: { label: 'User', icon: 'account-outline', color: '#16A34A' },
};

const STATUS_COLORS = { scheduled: '#D97706', draft: '#94A3B8', failed: '#DC2626', sent: '#16A34A' };

const CHANNEL_META = {
  inApp: { icon: 'bell-outline', color: '#2563EB' },
  email: { icon: 'email-outline', color: '#16A34A' },
  sms: { icon: 'message-text-outline', color: '#D97706' },
  whatsapp: { icon: 'whatsapp', color: '#25D366' },
};

// "All" here means "no filter", same overload the web app's own FILTER_OPTIONS uses — there's no
// way to isolate "Broadcast only" notifications, matching web's existing behavior exactly.
const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'role', label: 'Role' },
  { value: 'user-level', label: 'Level' },
  { value: 'user', label: 'User' },
];

function startOfDay(daysAgo = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function groupByDate(items) {
  const groups = { Today: [], Yesterday: [], 'This Week': [], Older: [] };
  const today = startOfDay(0);
  const yesterday = startOfDay(1);
  const weekAgo = startOfDay(7);

  items.forEach((item) => {
    const created = new Date(item.createdAt);
    if (created >= today) groups.Today.push(item);
    else if (created >= yesterday) groups.Yesterday.push(item);
    else if (created >= weekAgo) groups['This Week'].push(item);
    else groups.Older.push(item);
  });

  return Object.entries(groups).filter(([, list]) => list.length > 0);
}

function StatBlock({ label, value, color }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, borderTopWidth: 3, borderTopColor: color, padding: spacing.sm, alignItems: 'center' }}>
      <Text style={[typography.h2, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function NotificationCard({ item, onPress }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const level = LEVEL_META[item.level] || LEVEL_META.all;
  const statusColor = STATUS_COLORS[item.status] || colors.textMuted;
  const channels = item.channels ? Object.entries(CHANNEL_META).filter(([key]) => item.channels[key]) : [];
  const unread = !item.isRead;

  return (
    <Pressable
      onPress={unread ? onPress : undefined}
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: unread ? `${level.color}50` : colors.border,
        borderLeftWidth: 4,
        borderLeftColor: unread ? level.color : colors.border,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: `${level.color}18`, borderWidth: 1, borderColor: `${level.color}30`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <MaterialCommunityIcons name={level.icon} size={17} color={level.color} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 }}>
          {unread && <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: level.color }} />}
          <Text style={[typography.bodyStrong, { color: colors.text, flex: 1 }]} numberOfLines={1}>{item.title}</Text>
        </View>

        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.xs }]} numberOfLines={3}>
          {item.message}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <StatusPill label={level.label} color={level.color} />
            <StatusPill label={item.status} color={statusColor} />
          </View>
          {channels.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {channels.map(([key, meta]) => (
                <MaterialCommunityIcons key={key} name={meta.icon} size={13} color={meta.color} />
              ))}
            </View>
          )}
        </View>

        <Text style={[typography.caption, { color: colors.textMuted }]}>
          By {item.createdBy || 'System'} · {timeAgo(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

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

  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const notifications = data ?? [];
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);
  const todayCount = useMemo(() => {
    const today = startOfDay(0);
    return notifications.filter((n) => new Date(n.createdAt) >= today).length;
  }, [notifications]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesLevel = filterLevel === 'all' || item.level === filterLevel;
      const matchesSearch = !query || `${item.title} ${item.message} ${item.createdBy || ''}`.toLowerCase().includes(query);
      return matchesLevel && matchesSearch;
    });
  }, [notifications, search, filterLevel]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

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

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <StatBlock label="Total" value={notifications.length} color={colors.accent} />
        <StatBlock label="Unread" value={unreadCount} color={colors.warning} />
        <StatBlock label="Today" value={todayCount} color={colors.primary} />
      </View>

      <SearchField value={search} onChangeText={setSearch} placeholder="Search notifications" style={{ marginBottom: spacing.sm }} />

      <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg, flexWrap: 'wrap' }}>
        {FILTER_OPTIONS.map((opt) => (
          <Chip key={opt.value} selected={filterLevel === opt.value} onPress={() => setFilterLevel(opt.value)} compact>
            {opt.label}
          </Chip>
        ))}
      </View>

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={filtered.length === 0}
        emptyIcon="bell-outline"
        emptyLabel={search || filterLevel !== 'all' ? 'No matching notifications' : "You're all caught up!"}
      >
        {grouped.map(([label, items]) => (
          <View key={label} style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }]}>
                {label}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={[typography.caption, { color: colors.textMuted }]}>{items.length}</Text>
            </View>
            {items.map((item) => (
              <NotificationCard key={item._id} item={item} onPress={() => markRead(item._id)} />
            ))}
          </View>
        ))}
      </QueryState>
    </ScreenContainer>
  );
}
