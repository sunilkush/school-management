import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { FormField } from '../components/ui/FormField';
import { IconWell } from '../components/ui/IconWell';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetLibrarySettingsQuery, useUpdateLibrarySettingsMutation } from '../store/api/apiSlice';

const NUMERIC_FIELDS = [
  { key: 'maxBooksPerStudent', label: 'Max Books — Student' },
  { key: 'maxBooksPerTeacher', label: 'Max Books — Teacher' },
  { key: 'maxBooksPerStaff', label: 'Max Books — Staff' },
  { key: 'maxDaysToReturnStudent', label: 'Return Period (days) — Student' },
  { key: 'maxDaysToReturnTeacher', label: 'Return Period (days) — Teacher' },
  { key: 'gracePeriodDays', label: 'Grace Period (days)' },
  { key: 'finePerDay', label: 'Fine Per Day' },
  { key: 'maxFinePerBook', label: 'Max Fine Per Book' },
  { key: 'lostBookFine', label: 'Lost Book Fine' },
  { key: 'damagedBookFine', label: 'Damaged Book Fine' },
];
const TOGGLE_FIELDS = [
  { key: 'allowReservation', label: 'Allow Reservations' },
  { key: 'autoMarkOverdue', label: 'Auto-Mark Overdue' },
  { key: 'autoSendReminders', label: 'Auto-Send Reminders' },
];

/** School-wide library config — one doc per school, mirrors
 * frontend/src/pages/Librarian/LibrarySettings.jsx's Issue Limits / Return Period / Fine Rules
 * sections. */
export function LibrarySettingsScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetLibrarySettingsQuery();
  const [updateSettings, updateState] = useUpdateLibrarySettingsMutation();

  const [values, setValues] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setValues(data);
    }
  }, [data]);

  const setField = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const payload = {};
    NUMERIC_FIELDS.forEach(({ key }) => {
      payload[key] = Number(values[key]) || 0;
    });
    TOGGLE_FIELDS.forEach(({ key }) => {
      payload[key] = Boolean(values[key]);
    });
    await updateSettings(payload).unwrap();
    setSaved(true);
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="cog-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Library Settings</Text>
        </View>
      </View>

      <QueryState isLoading={isLoading || isFetching} isError={isError} error={error} onRetry={refetch} isEmpty={false}>
        {NUMERIC_FIELDS.map(({ key, label }) => (
          <FormField
            key={key}
            label={label}
            value={String(values[key] ?? '')}
            onChangeText={(v) => setField(key, v)}
            keyboardType="numeric"
            disabled={updateState.isLoading}
          />
        ))}

        {TOGGLE_FIELDS.map(({ key, label }) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
            <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
            <Switch value={Boolean(values[key])} onValueChange={(v) => setField(key, v)} disabled={updateState.isLoading} />
          </View>
        ))}

        <Button mode="contained" onPress={handleSave} loading={updateState.isLoading} disabled={updateState.isLoading} style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
          Save Settings
        </Button>
        {saved && <Text style={[typography.caption, { color: colors.success, textAlign: 'center' }]}>Saved</Text>}
      </QueryState>
    </ScreenContainer>
  );
}
