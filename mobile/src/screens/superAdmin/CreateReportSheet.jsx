import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateReportMutation, useGetAcademicYearsBySchoolQuery, useGetAllSchoolsQuery } from '../../store/api/apiSlice';

const TYPES = ['fees', 'students', 'attendance', 'performance', 'custom'];

/** A saved titled JSON/text blob with school/session/type metadata — confirmed nothing is
 * computed server-side, POST /report/create just stores exactly what's typed here. */
export function CreateReportSheet({ visible, onDismiss, onCreated }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createReport, createState] = useCreateReportMutation();
  const schoolsQuery = useGetAllSchoolsQuery({}, { skip: !visible });
  const schools = schoolsQuery.data?.schools ?? [];

  const [title, setTitle] = useState('');
  const [type, setType] = useState('custom');
  const [schoolId, setSchoolId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [dataText, setDataText] = useState('');
  const [error, setError] = useState(null);

  const yearsQuery = useGetAcademicYearsBySchoolQuery(schoolId, { skip: !schoolId });
  const years = yearsQuery.data ?? [];

  useEffect(() => {
    if (visible) {
      setTitle('');
      setType('custom');
      setSchoolId(null);
      setSessionId(null);
      setDataText('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    if (!title.trim() || !schoolId || !sessionId || !dataText.trim()) {
      setError('Title, school, session and data are all required');
      return;
    }
    try {
      await createReport({ title: title.trim(), type, school: schoolId, session: sessionId, data: dataText.trim() }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to create report');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '85%' }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>New Report</Text>

          <FormField label="Title" value={title} onChangeText={setTitle} disabled={createState.isLoading} />

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {TYPES.map((t) => (
              <Chip key={t} selected={t === type} onPress={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SCHOOL</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {schools.map((s) => (
              <Chip key={s._id} selected={s._id === schoolId} onPress={() => { setSchoolId(s._id); setSessionId(null); }}>
                {s.name}
              </Chip>
            ))}
          </ScrollView>

          {schoolId && years.length > 0 && (
            <>
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SESSION (ACADEMIC YEAR)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
                {years.map((y) => (
                  <Chip key={y._id} selected={y._id === sessionId} onPress={() => setSessionId(y._id)}>
                    {y.name}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          <FormField label="Data" value={dataText} onChangeText={setDataText} multiline numberOfLines={6} disabled={createState.isLoading} />

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
