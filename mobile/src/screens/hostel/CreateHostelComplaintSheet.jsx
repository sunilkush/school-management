import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateHostelComplaintMutation, useGetStudentsBySchoolQuery } from '../../store/api/apiSlice';

const TYPES = ['room', 'food', 'maintenance', 'safety', 'electricity', 'plumbing', 'furniture', 'cleanliness', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function CreateHostelComplaintSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [search, setSearch] = useState('');
  const studentsQuery = useGetStudentsBySchoolQuery({ search: search.trim() || undefined }, { skip: !visible });
  const students = studentsQuery.data ?? [];
  const [createComplaint, createState] = useCreateHostelComplaintMutation();

  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [type, setType] = useState('room');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [roomNumber, setRoomNumber] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setSearch('');
      setStudentId(null);
      setStudentName('');
      setType('room');
      setTitle('');
      setDescription('');
      setPriority('medium');
      setRoomNumber('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!studentId || !title.trim() || !description.trim()) {
      setError('Student, title and description are all required');
      return;
    }
    try {
      await createComplaint({
        studentId,
        type,
        title: title.trim(),
        description: description.trim(),
        priority,
        roomNumber: roomNumber.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create complaint');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Complaint</Text>

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

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />
          <FormField label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} disabled={createState.isLoading} />
          <FormField label="Room Number (optional)" value={roomNumber} onChangeText={setRoomNumber} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>PRIORITY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {PRIORITIES.map((p) => (
              <Chip key={p} selected={p === priority} onPress={() => setPriority(p)}>
                {p}
              </Chip>
            ))}
          </ScrollView>

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
