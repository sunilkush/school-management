import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { FormField } from '../../components/ui/FormField';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { formatDate } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMessageThreadQuery, useMarkMessageReadMutation, useSendMessageMutation } from '../../store/api/apiSlice';

export function MessageThreadScreen({ route }) {
  const { messageId, subject } = route.params ?? {};
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const [reply, setReply] = useState('');
  const [error, setError] = useState(null);

  const { data, isLoading, isFetching, isError, error: queryError, refetch } = useGetMessageThreadQuery(messageId, { skip: !messageId });
  const [markRead] = useMarkMessageReadMutation();
  const [sendMessage, sendState] = useSendMessageMutation();
  const thread = data ?? [];

  useEffect(() => {
    thread.forEach((m) => {
      if (!m.isRead) markRead(m._id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.length]);

  const handleReply = async () => {
    if (!reply.trim()) {
      setError('Enter a reply');
      return;
    }
    const root = thread[0];
    const recipientIds = [...new Set([root?.senderId?._id, ...(root?.recipientIds ?? []).map((r) => r._id)])].filter((id) => id && id !== user?._id);
    try {
      await sendMessage({ subject: subject ?? root?.subject, body: reply.trim(), recipientIds, priority: 'normal', parentMessageId: messageId }).unwrap();
      setReply('');
      setError(null);
    } catch (err) {
      setError(err?.message || 'Failed to send reply');
    }
  };

  return (
    <ScreenContainer scrollable>
      <QueryState
        isLoading={isLoading || isFetching}
        isError={isError}
        error={queryError}
        onRetry={refetch}
        isEmpty={thread.length === 0}
        emptyIcon="email-off-outline"
        emptyLabel="Message not found"
      >
        {thread.map((m) => {
          const isMine = String(m.senderId?._id) === String(user?._id);
          return (
            <View
              key={m._id}
              style={{
                flexDirection: 'row',
                gap: spacing.sm,
                marginBottom: spacing.md,
                alignSelf: isMine ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {!isMine && <AvatarInitials name={m.senderId?.name} size={32} />}
              <View
                style={{
                  backgroundColor: isMine ? colors.primary : colors.surface,
                  borderWidth: isMine ? 0 : 1,
                  borderColor: colors.border,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                }}
              >
                {!isMine && (
                  <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 2 }]}>{m.senderId?.name}</Text>
                )}
                <Text style={[typography.body, { color: isMine ? colors.textOnPrimary : colors.text }]}>{m.body}</Text>
                <Text style={[typography.caption, { color: isMine ? colors.textOnPrimary : colors.textMuted, marginTop: spacing.xs, opacity: 0.8 }]}>
                  {formatDate(m.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}
      </QueryState>

      <View style={{ marginTop: spacing.lg }}>
        <FormField label="Reply" value={reply} onChangeText={setReply} multiline numberOfLines={3} disabled={sendState.isLoading} />
        {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}
        <Button mode="contained" onPress={handleReply} loading={sendState.isLoading} disabled={sendState.isLoading}>
          Send Reply
        </Button>
      </View>
    </ScreenContainer>
  );
}
