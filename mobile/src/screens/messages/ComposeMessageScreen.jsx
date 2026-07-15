import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { FormField } from '../../components/ui/FormField';
import { SearchField } from '../../components/ui/SearchField';
import { MESSAGE_PRIORITIES, MESSAGE_PRIORITY_META } from '../../utils/messages';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetMessageRecipientsQuery, useSendMessageMutation } from '../../store/api/apiSlice';

export function ComposeMessageScreen({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const { data: recipients = [] } = useGetMessageRecipientsQuery();
  const [sendMessage, sendState] = useSendMessageMutation();

  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [error, setError] = useState(null);

  const filteredRecipients = useMemo(() => {
    const q = recipientSearch.trim().toLowerCase();
    if (!q) return recipients.slice(0, 20);
    return recipients.filter((r) => r.name?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q));
  }, [recipients, recipientSearch]);

  const toggleRecipient = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSend = async () => {
    if (!selectedIds.length || !subject.trim() || !body.trim()) {
      setError('Select at least one recipient, and fill in subject and message');
      return;
    }
    try {
      await sendMessage({ subject: subject.trim(), body: body.trim(), recipientIds: selectedIds, priority }).unwrap();
      navigation.goBack();
    } catch (err) {
      setError(err?.message || 'Failed to send message');
    }
  };

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
        TO {selectedIds.length > 0 ? `(${selectedIds.length} selected)` : ''}
      </Text>
      <SearchField value={recipientSearch} onChangeText={setRecipientSearch} placeholder="Search by name or role" style={{ marginBottom: spacing.sm }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {filteredRecipients.map((r) => (
          <Chip key={r._id} selected={selectedIds.includes(r._id)} onPress={() => toggleRecipient(r._id)}>
            {r.name} ({r.role})
          </Chip>
        ))}
      </View>

      <FormField label="Subject" value={subject} onChangeText={setSubject} disabled={sendState.isLoading} />
      <FormField label="Message" value={body} onChangeText={setBody} multiline numberOfLines={5} disabled={sendState.isLoading} />

      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>PRIORITY</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {MESSAGE_PRIORITIES.map((p) => (
          <Chip key={p} selected={p === priority} onPress={() => setPriority(p)}>
            {MESSAGE_PRIORITY_META[p].label}
          </Chip>
        ))}
      </View>

      {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

      <Button mode="contained" onPress={handleSend} loading={sendState.isLoading} disabled={sendState.isLoading}>
        Send Message
      </Button>
    </ScreenContainer>
  );
}
