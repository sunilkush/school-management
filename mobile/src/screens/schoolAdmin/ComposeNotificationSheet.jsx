import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateNotificationMutation } from '../../store/api/apiSlice';

const LEVELS = [
  { value: 'all', label: 'Everyone' },
  { value: 'role', label: 'By Role' },
  { value: 'user-level', label: 'By Class/Level' },
];
const ROLE_OPTIONS = ['Teacher', 'Student', 'Parent', 'Accountant', 'Librarian', 'Hostel Warden', 'Transport Manager', 'Receptionist'];

export function ComposeNotificationSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createNotification, createState] = useCreateNotificationMutation();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState('all');
  const [targetRoles, setTargetRoles] = useState([]);
  const [targetLevels, setTargetLevels] = useState('');
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setMessage('');
      setLevel('all');
      setTargetRoles([]);
      setTargetLevels('');
      setChannelInApp(true);
      setChannelEmail(false);
      setError(null);
    }
  }, [visible]);

  const toggleRole = (role) => {
    setTargetRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Title and message are both required');
      return;
    }
    if (level === 'role' && targetRoles.length === 0) {
      setError('Pick at least one role');
      return;
    }
    if (level === 'user-level' && !targetLevels.trim()) {
      setError('Enter at least one class/level tag');
      return;
    }
    try {
      await createNotification({
        title: title.trim(),
        message: message.trim(),
        level,
        targetRoles: level === 'role' ? targetRoles : [],
        targetLevels: level === 'user-level' ? targetLevels.split(',').map((t) => t.trim()).filter(Boolean) : [],
        channels: { inApp: channelInApp, email: channelEmail },
        status: 'sent',
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to send notification');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Broadcast Notification</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />
          <FormField label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={3} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>AUDIENCE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {LEVELS.map((l) => (
              <Chip key={l.value} selected={level === l.value} onPress={() => setLevel(l.value)}>
                {l.label}
              </Chip>
            ))}
          </ScrollView>

          {level === 'role' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
              {ROLE_OPTIONS.map((r) => (
                <Chip key={r} selected={targetRoles.includes(r)} onPress={() => toggleRole(r)}>
                  {r}
                </Chip>
              ))}
            </ScrollView>
          )}

          {level === 'user-level' && (
            <FormField
              label="Class/Level tags (comma-separated, e.g. Class 10)"
              value={targetLevels}
              onChangeText={setTargetLevels}
              disabled={createState.isLoading}
            />
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }}>
            <Text style={[typography.body, { color: colors.text }]}>In-App</Text>
            <Switch value={channelInApp} onValueChange={setChannelInApp} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs }}>
            <Text style={[typography.body, { color: colors.text }]}>Email</Text>
            <Switch value={channelEmail} onValueChange={setChannelEmail} />
          </View>

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSend} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Send
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
