import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateVisitorEntryMutation, useGetStudentsBySchoolQuery } from '../../store/api/apiSlice';

const RELATIONS = ['father', 'mother', 'guardian', 'sibling', 'relative', 'friend', 'other'];

export function CreateVisitorEntrySheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [search, setSearch] = useState('');
  const studentsQuery = useGetStudentsBySchoolQuery({ search: search.trim() || undefined }, { skip: !visible });
  const students = studentsQuery.data ?? [];
  const [createVisitor, createState] = useCreateVisitorEntryMutation();

  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [relation, setRelation] = useState('father');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setStudentId(null);
      setStudentName('');
      setVisitorName('');
      setVisitorPhone('');
      setRelation('father');
      setPurpose('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!studentId || !visitorName.trim() || !visitorPhone.trim() || !purpose.trim()) {
      setError('Student, visitor name, phone and purpose are all required');
      return;
    }
    try {
      await createVisitor({
        studentId,
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim(),
        relation,
        purpose: purpose.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to log visitor');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Visitor Entry</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>STUDENT</Text>
          <FormField label="Search student" value={search} onChangeText={setSearch} style={{ marginBottom: spacing.xs }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {students.map((row) => (
              <Chip
                key={row.user?._id}
                selected={row.user?._id === studentId}
                onPress={() => {
                  setStudentId(row.user?._id);
                  setStudentName(row.user?.name ?? '');
                }}
              >
                {row.user?.name}
              </Chip>
            ))}
          </ScrollView>
          {studentName ? <Text style={[typography.caption, { color: colors.primary, marginBottom: spacing.sm }]}>Selected: {studentName}</Text> : null}

          <FormField label="Visitor Name" value={visitorName} onChangeText={setVisitorName} disabled={createState.isLoading} />
          <FormField label="Visitor Phone" value={visitorPhone} onChangeText={setVisitorPhone} keyboardType="phone-pad" disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>RELATION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {RELATIONS.map((r) => (
              <Chip key={r} selected={r === relation} onPress={() => setRelation(r)}>
                {r}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Purpose" value={purpose} onChangeText={setPurpose} multiline numberOfLines={2} disabled={createState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreate} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
              Log Entry
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
