import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Switch, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateNotificationMutation } from '../../store/api/apiSlice';
import { ROLE_NAMES } from '../../constants/roles';

const LEVELS = [
  { value: 'all', label: 'Everyone' },
  { value: 'role', label: 'By Role' },
  { value: 'user-level', label: 'By Class/Level' },
  { value: 'user', label: 'Specific Users' },
];
const ROLE_OPTIONS = Object.values(ROLE_NAMES);

// Same 4 delivery channels the backend model actually stores and dispatches
// (notification.controllers.js createNotification) — matches web's ChannelToggle exactly.
const CHANNEL_META = {
  inApp: { icon: 'bell-outline', label: 'In-App', color: '#2563EB' },
  email: { icon: 'email-outline', label: 'Email', color: '#16A34A' },
  sms: { icon: 'message-text-outline', label: 'SMS', color: '#D97706' },
  whatsapp: { icon: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
};

export function ComposeNotificationSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createNotification, createState] = useCreateNotificationMutation();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState('all');
  const [targetRoles, setTargetRoles] = useState([]);
  const [targetLevels, setTargetLevels] = useState('');
  const [targetUserIds, setTargetUserIds] = useState('');
  const [channels, setChannels] = useState({ inApp: true, email: false, sms: false, whatsapp: false });
  const [scheduledAt, setScheduledAt] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setMessage('');
      setLevel('all');
      setTargetRoles([]);
      setTargetLevels('');
      setTargetUserIds('');
      setChannels({ inApp: true, email: false, sms: false, whatsapp: false });
      setScheduledAt('');
      setSaveAsDraft(false);
      setError(null);
    }
  }, [visible]);

  const toggleRole = (role) => {
    setTargetRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };
  const toggleChannel = (key) => setChannels((prev) => ({ ...prev, [key]: !prev[key] }));

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
    if (level === 'user' && !targetUserIds.trim()) {
      setError('Enter at least one target user');
      return;
    }
    if (!Object.values(channels).some(Boolean)) {
      setError('Select at least one delivery channel');
      return;
    }
    try {
      await createNotification({
        title: title.trim(),
        message: message.trim(),
        level,
        targetRoles: level === 'role' ? targetRoles : [],
        targetLevels: level === 'user-level' ? targetLevels.split(',').map((t) => t.trim()).filter(Boolean) : [],
        targetUserIds: level === 'user' ? targetUserIds.split(',').map((t) => t.trim()).filter(Boolean) : [],
        channels,
        scheduledAt: scheduledAt.trim() ? new Date(scheduledAt.trim()).toISOString() : null,
        status: saveAsDraft ? 'draft' : undefined,
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {LEVELS.map((l) => (
              <Chip key={l.value} selected={level === l.value} onPress={() => setLevel(l.value)}>
                {l.label}
              </Chip>
            ))}
          </ScrollView>

          {level === 'role' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
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

          {level === 'user' && (
            <FormField
              label="Target users (emails/reg IDs, comma-separated)"
              value={targetUserIds}
              onChangeText={setTargetUserIds}
              disabled={createState.isLoading}
            />
          )}

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>DELIVERY CHANNELS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}>
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

          <FormField
            label="Schedule (optional, YYYY-MM-DD HH:mm)"
            placeholder="Leave empty to send immediately"
            value={scheduledAt}
            onChangeText={setScheduledAt}
            disabled={createState.isLoading}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }}>
            <Text style={[typography.body, { color: colors.text }]}>Save as draft instead of publishing now</Text>
            <Switch value={saveAsDraft} onValueChange={setSaveAsDraft} />
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
