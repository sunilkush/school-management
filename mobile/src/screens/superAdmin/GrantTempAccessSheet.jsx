import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateTempAccessGrantMutation, useGetAllRolesQuery, useGetAllUsersQuery } from '../../store/api/apiSlice';

const SCOPE_OPTIONS = [
  { value: 'global', label: 'Global' },
  { value: 'school', label: 'School Level' },
  { value: 'exam-week', label: 'Exam Week' },
  { value: 'event', label: 'Event Only' },
];

export function GrantTempAccessSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createGrant, createState] = useCreateTempAccessGrantMutation();
  const [search, setSearch] = useState('');
  const usersQuery = useGetAllUsersQuery({}, { skip: !visible });
  const users = (usersQuery.data ?? []).filter((u) => {
    const q = search.trim().toLowerCase();
    return !q || [u.name, u.email].some((f) => f?.toLowerCase?.().includes(q));
  });
  const rolesQuery = useGetAllRolesQuery(undefined, { skip: !visible });
  const roles = rolesQuery.data ?? [];

  const [userId, setUserId] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [scope, setScope] = useState('global');
  const [validTill, setValidTill] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setUserId(null);
      setRoleId(null);
      setScope('global');
      setValidTill('');
      setReason('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!userId || !roleId || !validTill.trim() || !reason.trim()) {
      setError('User, role, valid-till date and reason are all required');
      return;
    }
    try {
      await createGrant({ userId, roleId, scope, validTill: validTill.trim(), reason: reason.trim() }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to grant access');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Grant Temporary Access</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>USER</Text>
          <FormField label="Search user" value={search} onChangeText={setSearch} style={{ marginBottom: spacing.xs }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {users.slice(0, 30).map((u) => (
              <Chip key={u._id} selected={u._id === userId} onPress={() => setUserId(u._id)}>
                {u.name}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>ROLE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {roles.map((r) => (
              <Chip key={r._id} selected={r._id === roleId} onPress={() => setRoleId(r._id)}>
                {r.name}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SCOPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {SCOPE_OPTIONS.map((s) => (
              <Chip key={s.value} selected={s.value === scope} onPress={() => setScope(s.value)}>
                {s.label}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Valid Till (YYYY-MM-DD)" value={validTill} onChangeText={setValidTill} disabled={createState.isLoading} />
          <FormField label="Reason" value={reason} onChangeText={setReason} multiline numberOfLines={2} disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Grant
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
