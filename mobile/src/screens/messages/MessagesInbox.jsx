import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, SegmentedButtons, Text } from 'react-native-paper';
import { QueryState } from '../../components/ui/QueryState';
import { SearchField } from '../../components/ui/SearchField';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { StatusPill } from '../../components/ui/StatusPill';
import { avatarColorFor } from '../../theme/patterns';
import { MESSAGE_PRIORITY_META, otherParty } from '../../utils/messages';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMessagesQuery } from '../../store/api/apiSlice';

export function MessagesInbox({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const [mailbox, setMailbox] = useState('inbox');
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, isError, error, refetch } = useGetMessagesQuery({ mailbox, search: search.trim() || undefined });
  const messages = data ?? [];

  const stats = useMemo(
    () => [
      { key: 'total', label: 'Total', icon: 'email-outline', color: colors.primary, value: messages.length },
      { key: 'unread', label: 'Unread', icon: 'email-alert-outline', color: '#F59E0B', value: messages.filter((m) => !m.isRead).length },
      { key: 'urgent', label: 'High Priority', icon: 'alert-outline', color: '#EF4444', value: messages.filter((m) => m.priority === 'high' || m.priority === 'urgent').length },
    ],
    [messages, colors.primary]
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md }}>
        <Button mode="contained" icon="pencil-outline" onPress={() => navigation.navigate('ComposeMessage')}>
          Compose
        </Button>
      </View>

      <View style={{ marginBottom: spacing.lg }}>
        <StatGrid>
          {stats.map((s) => (
            <StatCard key={s.key} label={s.label} metric={s} />
          ))}
        </StatGrid>
      </View>

      <SegmentedButtons
        value={mailbox}
        onValueChange={setMailbox}
        style={{ marginBottom: spacing.sm }}
        buttons={[
          { value: 'inbox', label: 'Inbox' },
          { value: 'sent', label: 'Sent' },
          { value: 'archive', label: 'Archive' },
        ]}
      />

      <SearchField value={search} onChangeText={setSearch} placeholder="Search subject or body" style={{ marginBottom: spacing.sm }} />

      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={error}
        onRetry={refetch}
        isEmpty={messages.length === 0}
        emptyIcon="email-off-outline"
        emptyLabel={search ? 'No messages match your search' : 'No messages here yet'}
      >
        {messages.map((m) => {
          const priority = MESSAGE_PRIORITY_META[m.priority] ?? MESSAGE_PRIORITY_META.normal;
          const party = otherParty(m, user?._id);
          return (
            <AccentListCard
              key={m._id}
              accent={m.isRead ? colors.border : priority.color}
              avatar={<AvatarInitials name={party} size={40} />}
              title={party}
              subtitle={m.subject}
              badge={m.priority !== 'normal' ? <StatusPill label={priority.label} color={priority.color} /> : null}
              meta={[{ label: 'Sent', value: formatDate(m.createdAt) }]}
              onPress={() => navigation.navigate('MessageThread', { messageId: m._id, subject: m.subject })}
            />
          );
        })}
      </QueryState>
    </View>
  );
}
