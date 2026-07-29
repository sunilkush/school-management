import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { ACTION_OPTIONS, MODULE_OPTIONS, ROLE_NAME_OPTIONS } from '../../constants/permissions';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../hooks/useAuth';
import { useCreateRoleMutation, useGetAllSchoolsQuery } from '../../store/api/apiSlice';

function PermissionRow({ row, onChange, onRemove }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const toggleAction = (action) => {
    const actions = row.actions.includes(action) ? row.actions.filter((a) => a !== action) : [...row.actions, action];
    onChange({ ...row, actions });
  };

  return (
    <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>MODULE</Text>
        <IconButton icon="close" size={16} onPress={onRemove} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.xs, paddingBottom: spacing.xs, alignItems: 'center' }}>
        {MODULE_OPTIONS.map((m) => (
          <Chip key={m} compact selected={row.module === m} onPress={() => onChange({ ...row, module: m })}>
            {m}
          </Chip>
        ))}
      </ScrollView>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>ACTIONS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.xs, paddingTop: spacing.xs, alignItems: 'center' }}>
        {ACTION_OPTIONS.map((a) => (
          <Chip key={a} compact selected={row.actions.includes(a)} onPress={() => toggleAction(a)}>
            {a}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

export function CreateRoleSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { role: myRole } = useAuth();
  const isSuperAdmin = myRole?.name === 'Super Admin';
  const [createRole, createState] = useCreateRoleMutation();
  const schoolsQuery = useGetAllSchoolsQuery({}, { skip: !visible });
  const schools = schoolsQuery.data?.schools ?? [];

  const [name, setName] = useState(ROLE_NAME_OPTIONS[0]);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('custom');
  const [level, setLevel] = useState('4');
  const [schoolId, setSchoolId] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName(ROLE_NAME_OPTIONS[0]);
      setCode('');
      setDescription('');
      setType('custom');
      setLevel('4');
      setSchoolId(null);
      setPermissions([]);
      setError(null);
    }
  }, [visible]);

  const addPermissionRow = () => setPermissions((prev) => [...prev, { module: MODULE_OPTIONS[0], actions: [] }]);
  const updateRow = (index, row) => setPermissions((prev) => prev.map((r, i) => (i === index ? row : r)));
  const removeRow = (index) => setPermissions((prev) => prev.filter((_, i) => i !== index));

  const handleCreate = async () => {
    if (type === 'custom' && !schoolId) {
      setError('Custom roles need a school');
      return;
    }
    const validRows = permissions.filter((r) => r.module && r.actions.length > 0);
    try {
      await createRole({
        name,
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        type,
        level: Number(level) || 4,
        schoolId: type === 'custom' ? schoolId : undefined,
        permissions: validRows.length > 0 ? validRows : undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create role');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '90%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Role</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>ROLE NAME</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {ROLE_NAME_OPTIONS.map((n) => (
              <Chip key={n} selected={n === name} onPress={() => setName(n)}>
                {n}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Code (optional)" value={code} onChangeText={setCode} autoCapitalize="characters" disabled={createState.isLoading} />
          <FormField label="Description (optional)" value={description} onChangeText={setDescription} multiline numberOfLines={2} disabled={createState.isLoading} />
          <FormField label="Hierarchy Level" value={level} onChangeText={setLevel} keyboardType="numeric" disabled={createState.isLoading} />

          {isSuperAdmin && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>TYPE</Text>
              <SegmentedButtons
                value={type}
                onValueChange={setType}
                style={{ marginBottom: spacing.sm }}
                buttons={[
                  { value: 'custom', label: 'Custom (school-scoped)' },
                  { value: 'system', label: 'Global / Template' },
                ]}
              />
            </>
          )}

          {type === 'custom' && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SCHOOL</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {schools.map((s) => (
                  <Chip key={s._id} selected={s._id === schoolId} onPress={() => setSchoolId(s._id)}>
                    {s.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, marginBottom: spacing.sm }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              Permissions {permissions.length > 0 ? `(${permissions.length})` : '(using role defaults)'}
            </Text>
            <Button mode="text" compact onPress={addPermissionRow}>
              + Add
            </Button>
          </View>
          {permissions.length === 0 && (
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
              Leave empty to use this role name's default permission set, or add rows to set them explicitly.
            </Text>
          )}
          {permissions.map((row, i) => (
            <PermissionRow key={i} row={row} onChange={(r) => updateRow(i, r)} onRemove={() => removeRow(i)} />
          ))}

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Create
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
