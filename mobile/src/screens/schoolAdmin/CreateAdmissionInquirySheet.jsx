import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateAdmissionInquiryMutation } from '../../store/api/apiSlice';

const RELATIONSHIPS = ['father', 'mother', 'guardian'];
const SOURCES = ['walk-in', 'phone', 'website', 'referral', 'social_media', 'other'];

export function CreateAdmissionInquirySheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createInquiry, createState] = useCreateAdmissionInquiryMutation();

  const [studentName, setStudentName] = useState('');
  const [applyingClass, setApplyingClass] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [relationship, setRelationship] = useState('father');
  const [source, setSource] = useState('walk-in');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setStudentName('');
      setApplyingClass('');
      setParentName('');
      setParentPhone('');
      setParentEmail('');
      setRelationship('father');
      setSource('walk-in');
      setNotes('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!studentName.trim() || !applyingClass.trim() || !parentName.trim() || !parentPhone.trim()) {
      setError('Student name, applying class, parent name and phone are all required');
      return;
    }
    try {
      await createInquiry({
        studentName: studentName.trim(),
        applyingClass: applyingClass.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail.trim() || undefined,
        relationship,
        source,
        notes: notes.trim() || undefined,
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create inquiry');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Admission Inquiry</Text>

          <FormField label="Student Name" value={studentName} onChangeText={setStudentName} disabled={createState.isLoading} />
          <FormField label="Applying Class" value={applyingClass} onChangeText={setApplyingClass} disabled={createState.isLoading} />
          <FormField label="Parent Name" value={parentName} onChangeText={setParentName} disabled={createState.isLoading} />
          <FormField label="Parent Phone" value={parentPhone} onChangeText={setParentPhone} keyboardType="phone-pad" disabled={createState.isLoading} />
          <FormField label="Parent Email (optional)" value={parentEmail} onChangeText={setParentEmail} autoCapitalize="none" keyboardType="email-address" disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>RELATIONSHIP</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {RELATIONSHIPS.map((r) => (
              <Chip key={r} selected={r === relationship} onPress={() => setRelationship(r)}>
                {r}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>SOURCE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {SOURCES.map((s) => (
              <Chip key={s} selected={s === source} onPress={() => setSource(s)}>
                {s.replace('_', ' ')}
              </Chip>
            ))}
          </ScrollView>

          <FormField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline numberOfLines={2} disabled={createState.isLoading} />

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
