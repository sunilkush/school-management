import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Switch, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { FormField } from '../components/ui/FormField';
import { IconWell } from '../components/ui/IconWell';
import { useAppTheme } from '../theme/ThemeProvider';
import { useGetGlobalConfigQuery, useUpdateGlobalConfigMutation } from '../store/api/apiSlice';

const TEXT_FIELDS = [
  { key: 'platformName', label: 'Platform Name' },
  { key: 'currency', label: 'Currency Code' },
  { key: 'currencySymbol', label: 'Currency Symbol' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'supportEmail', label: 'Support Email' },
  { key: 'supportPhone', label: 'Support Phone' },
  { key: 'maxSchools', label: 'Max Schools (0 = unlimited)' },
];
const TOGGLE_FIELDS = [
  { key: 'maintenanceMode', label: 'Maintenance Mode' },
  { key: 'allowRegistration', label: 'Allow New School Registration' },
];

/** Platform-wide identity/localisation/support/toggle settings — the SMTP/SMS/payment-gateway
 * secrets sections of the web page are intentionally not built here (secrets-heavy admin plumbing,
 * rarely touched from mobile); logo upload also deferred (needs a native image-picker dependency). */
export function GlobalConfigScreen() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isFetching, isError, error, refetch } = useGetGlobalConfigQuery();
  const [updateConfig, updateState] = useUpdateGlobalConfigMutation();

  const [values, setValues] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setValues(data);
  }, [data]);

  const setField = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const payload = {};
    TEXT_FIELDS.forEach(({ key }) => {
      payload[key] = key === 'maxSchools' ? Number(values[key]) || 0 : values[key] ?? '';
    });
    TOGGLE_FIELDS.forEach(({ key }) => {
      payload[key] = Boolean(values[key]);
    });
    await updateConfig(payload).unwrap();
    setSaved(true);
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="earth" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Global Config</Text>
        </View>
      </View>

      <QueryState isLoading={isLoading || isFetching} isError={isError} error={error} onRetry={refetch} isEmpty={false}>
        {TEXT_FIELDS.map(({ key, label }) => (
          <FormField
            key={key}
            label={label}
            value={String(values[key] ?? '')}
            onChangeText={(v) => setField(key, v)}
            keyboardType={key === 'maxSchools' ? 'numeric' : 'default'}
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
