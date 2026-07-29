import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Chip, Snackbar, Switch, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { SearchField } from '../components/ui/SearchField';
import { StatusPill } from '../components/ui/StatusPill';
import { IconWell } from '../components/ui/IconWell';
import { Panel } from '../components/ui/Panel';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAuth } from '../hooks/useAuth';
import {
  useGetNotificationsQuery,
  useGetNotificationAnalyticsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useCreateNotificationMutation,
} from '../store/api/apiSlice';
import { timeAgo } from '../utils/format';
import { ROLE_NAMES } from '../constants/roles';

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
  inApp: { icon: 'bell-outline', label: 'In App', color: '#2563EB' },
  email: { icon: 'email-outline', label: 'Email', color: '#16A34A' },
  sms: { icon: 'message-text-outline', label: 'SMS', color: '#D97706' },
  whatsapp: { icon: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
};

// "All" here means "no filter", same overload the web app's own FILTER_OPTIONS uses — there's no
// way to isolate "Broadcast only" notifications, matching web's existing behavior exactly.
const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'role', label: 'Role' },
  { value: 'user-level', label: 'Level' },
  { value: 'user', label: 'User' },
];

// Same set web restricts the create form to (notification.controllers.js CREATE_ALLOWED_ROLES) —
// mobile never checked this at all because it never had a create form to check it for.
const CREATOR_ROLES = new Set(['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Exam Coordinator', 'Receptionist', 'IT Support']);

const ALL_ROLE_OPTIONS = Object.values(ROLE_NAMES);

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

function RolePicker({ selected, onToggle }) {
  const { spacing } = useAppTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, alignItems: 'center' }}>
      {ALL_ROLE_OPTIONS.map((role) => (
        <Chip key={role} compact selected={selected.includes(role)} onPress={() => onToggle(role)}>
          {role}
        </Chip>
      ))}
    </ScrollView>
  );
}

/** Compose/broadcast panel — mirrors web's "Create / Broadcast Notification" form (audience type,
 * conditional target fields, title/message, channel toggle, optional schedule, save-as-draft).
 * Mobile had the backend contract and RTK Query hooks (useCreateNotificationMutation,
 * useGetNotificationAnalyticsQuery) already wired up in apiSlice.js — this screen just never used
 * them, so admin-tier roles could read notifications on mobile but had no way to send one. */
function ComposePanel({ onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [level, setLevel] = useState('all');
  const [targetRoles, setTargetRoles] = useState([]);
  const [targetLevels, setTargetLevels] = useState('');
  const [targetUserIds, setTargetUserIds] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [channels, setChannels] = useState({ inApp: true, email: false, sms: false, whatsapp: false });
  const [scheduledAt, setScheduledAt] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [error, setError] = useState(null);

  const [createNotification, createState] = useCreateNotificationMutation();

  const toggleRole = (role) => {
    setTargetRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };
  const toggleChannel = (key) => setChannels((prev) => ({ ...prev, [key]: !prev[key] }));

  const handlePublish = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!message.trim()) { setError('Message is required'); return; }
    if ((level === 'role' || level === 'user-level') && targetRoles.length === 0) {
      setError('Select at least one target role');
      return;
    }
    if (level === 'user-level' && !targetLevels.trim()) { setError('Enter at least one user level'); return; }
    if (level === 'user' && !targetUserIds.trim()) { setError('Enter at least one target user'); return; }
    if (!Object.values(channels).some(Boolean)) { setError('Select at least one channel'); return; }

    try {
      await createNotification({
        title: title.trim(),
        message: message.trim(),
        level,
        targetRoles,
        targetLevels: targetLevels ? targetLevels.split(',').map((v) => v.trim()).filter(Boolean) : [],
        targetUserIds: targetUserIds ? targetUserIds.split(',').map((v) => v.trim()).filter(Boolean) : [],
        channels,
        scheduledAt: scheduledAt.trim() ? new Date(scheduledAt.trim()).toISOString() : null,
        status: saveAsDraft ? 'draft' : undefined,
      }).unwrap();
      setTitle(''); setMessage(''); setTargetRoles([]); setTargetLevels(''); setTargetUserIds('');
      setScheduledAt(''); setSaveAsDraft(false); setError(null);
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to create notification');
    }
  };

  return (
    <Panel>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="send-outline" color="#7C3AED" size={38} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Create / Broadcast Notification</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={2}>
            Compose an announcement, choose audience, and send now or schedule.
          </Text>
        </View>
      </View>

      <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm }]}>Audience</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
        {FILTER_OPTIONS.map((opt) => (
          <Chip key={opt.value} selected={level === opt.value} onPress={() => setLevel(opt.value)}>
            {opt.label === 'All' ? 'All Roles & Users' : opt.label}
          </Chip>
        ))}
      </ScrollView>

      {level === 'all' && (
        <View style={{ backgroundColor: `${colors.primary}12`, borderWidth: 1, borderColor: `${colors.primary}40`, borderRadius: radii.md, padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
          <MaterialCommunityIcons name="earth" size={18} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.primary, flex: 1 }]}>Broadcasting to everyone — visible to every role and user account.</Text>
        </View>
      )}
      {(level === 'role' || level === 'user-level') && (
        <View style={{ marginBottom: spacing.md }}>
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 6 }]}>Target roles</Text>
          <RolePicker selected={targetRoles} onToggle={toggleRole} />
        </View>
      )}
      {level === 'user-level' && (
        <TextInput
          mode="outlined"
          label="User levels (comma-separated, e.g. Class 10, Section A)"
          value={targetLevels}
          onChangeText={setTargetLevels}
          style={{ marginBottom: spacing.md }}
        />
      )}
      {level === 'user' && (
        <TextInput
          mode="outlined"
          label="Target users (emails/reg IDs, comma-separated)"
          value={targetUserIds}
          onChangeText={setTargetUserIds}
          style={{ marginBottom: spacing.md }}
        />
      )}

      <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm, marginTop: spacing.xs }]}>Content</Text>
      <TextInput mode="outlined" label="Title" value={title} onChangeText={setTitle} maxLength={160} style={{ marginBottom: spacing.sm }} />
      <TextInput mode="outlined" label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={3} maxLength={2000} style={{ marginBottom: spacing.md }} />

      <Text style={[typography.caption, { color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.sm }]}>Delivery</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {Object.entries(CHANNEL_META).map(([key, meta]) => {
          const active = channels[key];
          return (
            <Chip
              key={key}
              selected={active}
              onPress={() => toggleChannel(key)}
              icon={() => <MaterialCommunityIcons name={meta.icon} size={16} color={active ? meta.color : colors.textMuted} />}
            >
              {meta.label}
            </Chip>
          );
        })}
      </View>
      <TextInput
        mode="outlined"
        label="Schedule (optional, YYYY-MM-DD HH:mm)"
        placeholder="Leave empty to send immediately"
        value={scheduledAt}
        onChangeText={setScheduledAt}
        style={{ marginBottom: spacing.md }}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>Save as draft instead of publishing now</Text>
        <Switch value={saveAsDraft} onValueChange={setSaveAsDraft} />
      </View>

      {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

      <Button mode="contained" icon="send" onPress={handlePublish} loading={createState.isLoading} disabled={createState.isLoading}>
        Publish Notification
      </Button>
    </Panel>
  );
}

/**
 * There's no separate "Notices" concept backend-side — Notices and Notifications share one
 * Notification model/API (level: all/role/user-level/user, GET /notifications). One real screen
 * covers both rather than building two nearly-identical UIs against the same endpoint. Mirrors
 * web's Notification.jsx structure: page header with role badge, 4 stat cards fed by the real
 * analytics endpoint, a compose panel for CREATOR_ROLES, then the grouped list panel.
 */
export function NotificationsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { role } = useAuth();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetNotificationsQuery();
  const analyticsQuery = useGetNotificationAnalyticsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, markAllState] = useMarkAllNotificationsReadMutation();

  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [snackbar, setSnackbar] = useState('');

  const canCompose = CREATOR_ROLES.has(role?.name);

  const notifications = data ?? [];
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((item) => {
      const matchesLevel = filterLevel === 'all' || item.level === filterLevel;
      const matchesSearch = !query || `${item.title} ${item.message} ${item.createdBy || ''}`.toLowerCase().includes(query);
      return matchesLevel && matchesSearch;
    });
  }, [notifications, search, filterLevel]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const clearFilters = () => { setSearch(''); setFilterLevel('all'); };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="bell-ring-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Notifications</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={2}>
            Role-wise, user-level, and user-specific notification center
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg, flexWrap: 'wrap', gap: spacing.sm }}>
        <StatusPill label={role?.name || 'User'} color={colors.primary} />
        {unreadCount > 0 && (
          <Button mode="text" icon="check-circle-outline" onPress={markAllRead} loading={markAllState.isLoading} compact>
            Mark all read
          </Button>
        )}
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          <StatCard label="Visible" metric={{ value: notifications.length, icon: 'inbox-outline', color: '#14B8A6' }} />
          <StatCard label="Unread" metric={{ value: unreadCount, icon: 'bell-outline', color: colors.warning }} />
          <StatCard label="Scheduled" metric={{ value: analyticsQuery.data?.scheduled ?? 0, icon: 'calendar-clock-outline', color: colors.primary }} />
          <StatCard label="Opened" metric={{ value: analyticsQuery.data?.opened ?? 0, icon: 'eye-outline', color: colors.success }} />
        </StatGrid>
      </View>

      {!canCompose && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: `${colors.primary}12`, borderWidth: 1, borderColor: `${colors.primary}30`, borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg }}>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.text, flex: 1 }]}>
            You can view notifications assigned to your role, level, or user account.
          </Text>
        </View>
      )}

      {canCompose && (
        <View style={{ marginBottom: spacing.lg }}>
          <ComposePanel onCreated={() => setSnackbar('Notification published')} />
        </View>
      )}

      <Panel style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>My Notifications</Text>
            {unreadCount > 0 && (
              <View style={{ backgroundColor: colors.primary, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 1 }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <SearchField value={search} onChangeText={setSearch} placeholder="Search notifications" style={{ marginBottom: spacing.sm }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, alignItems: 'center' }}>
            {FILTER_OPTIONS.map((opt) => (
              <Chip key={opt.value} selected={filterLevel === opt.value} onPress={() => setFilterLevel(opt.value)} compact>
                {opt.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={{ padding: spacing.md }}>
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
          {filtered.length === 0 && (search || filterLevel !== 'all') && (
            <Button compact onPress={clearFilters} style={{ alignSelf: 'center', marginTop: spacing.sm }}>
              Clear filters
            </Button>
          )}
        </View>
      </Panel>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </ScreenContainer>
  );
}
