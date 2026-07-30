import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, IconButton, Modal, Portal, Switch, Text, TextInput } from 'react-native-paper';
import { IconWell } from '../../components/ui/IconWell';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useSavePayrollSettingsMutation } from '../../store/api/apiSlice';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Statutory-default values — same as web's DEFAULTS, so a school that just wants "the standard
// India rules" can save without changing anything.
const DEFAULTS = {
  pfEnabled: true, pfPercent: '12', pfWageCeiling: '15000', pfAppliedOnCeiling: true,
  pfApplicableOn: 'basicPlusDa', pfCustomComponents: [], employerPfPercent: '12',
  epsPercent: '8.33', epfAdminChargesPercent: '0.5', edliPercent: '0.5',
  esiEnabled: true, esiPercent: '0.75', esiWageCeiling: '21000', esiApplicableOn: 'gross',
  esiCustomComponents: [], employerEsiPercent: '3.25', professionalTaxAmount: '0',
  paidLeavePerMonth: '1', roundingMode: 'nearest', overtimeRatePerHour: '0', notes: '',
};

const CUSTOM_COMPONENT_OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'hra', label: 'HRA' },
  { value: 'da', label: 'DA' },
  { value: 'specialAllowance', label: 'Special Allowance' },
];

function SectionHeader({ icon, color, title, subtitle }) {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm }}>
      <IconWell icon={icon} color={color} size={30} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[typography.caption, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onChange }) {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
      <Switch value={value} onValueChange={onChange} />
      <Text style={[typography.caption, { color: colors.textMuted, flex: 1 }]}>{label}</Text>
    </View>
  );
}

function ChipChoice({ label, options, value, onChange }) {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {options.map((opt) => (
          <Chip key={opt.value} compact selected={value === opt.value} onPress={() => onChange(opt.value)}>{opt.label}</Chip>
        ))}
      </View>
    </View>
  );
}

function MultiChipChoice({ label, options, value, onToggle }) {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {options.map((opt) => (
          <Chip key={opt.value} compact selected={value.includes(opt.value)} onPress={() => onToggle(opt.value)}>{opt.label}</Chip>
        ))}
      </View>
    </View>
  );
}

/** Every save creates a new effective-dated version (no in-place edit — see PayrollSettingsView's
 * own header comment for why). Pre-fills from `current` when one exists, else statutory defaults. */
export function PayrollSettingsFormSheet({ visible, current, onDismiss, onSaved }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [saveSettings, saveState] = useSavePayrollSettingsMutation();
  const [form, setForm] = useState(DEFAULTS);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      const base = current
        ? Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, current[k] != null ? String(current[k]) : DEFAULTS[k]]))
        : DEFAULTS;
      setForm({
        ...DEFAULTS,
        ...base,
        pfCustomComponents: current?.pfCustomComponents ?? [],
        esiCustomComponents: current?.esiCustomComponents ?? [],
        pfEnabled: current?.pfEnabled ?? true,
        esiEnabled: current?.esiEnabled ?? true,
        pfAppliedOnCeiling: current?.pfAppliedOnCeiling ?? true,
        notes: '',
      });
      setEffectiveFrom('');
      setError(null);
    }
  }, [visible, current]);

  const set = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));
  const toggleCustom = (key) => (val) => setForm((p) => ({
    ...p,
    [key]: p[key].includes(val) ? p[key].filter((v) => v !== val) : [...p[key], val],
  }));

  const handleSave = async () => {
    if (!DATE_PATTERN.test(effectiveFrom)) { setError('Enter a valid effective date (YYYY-MM-DD)'); return; }
    if (form.pfApplicableOn === 'custom' && form.pfCustomComponents.length === 0) {
      setError('Pick at least one PF wage component'); return;
    }
    if (form.esiApplicableOn === 'custom' && form.esiCustomComponents.length === 0) {
      setError('Pick at least one ESI wage component'); return;
    }
    try {
      await saveSettings({
        pfEnabled: form.pfEnabled,
        pfPercent: Number(form.pfPercent),
        pfWageCeiling: Number(form.pfWageCeiling),
        pfAppliedOnCeiling: form.pfAppliedOnCeiling,
        pfApplicableOn: form.pfApplicableOn,
        pfCustomComponents: form.pfCustomComponents,
        employerPfPercent: Number(form.employerPfPercent),
        epsPercent: Number(form.epsPercent),
        epfAdminChargesPercent: Number(form.epfAdminChargesPercent),
        edliPercent: Number(form.edliPercent),
        esiEnabled: form.esiEnabled,
        esiPercent: Number(form.esiPercent),
        esiWageCeiling: Number(form.esiWageCeiling),
        esiApplicableOn: form.esiApplicableOn,
        esiCustomComponents: form.esiCustomComponents,
        employerEsiPercent: Number(form.employerEsiPercent),
        professionalTaxAmount: Number(form.professionalTaxAmount),
        paidLeavePerMonth: Number(form.paidLeavePerMonth),
        roundingMode: form.roundingMode,
        overtimeRatePerHour: Number(form.overtimeRatePerHour),
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        notes: form.notes?.trim() || undefined,
      }).unwrap();
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Failed to save settings');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg, maxHeight: '90%' }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <Text style={[typography.h3, { color: colors.text }]}>New Payroll Settings Version</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <SectionHeader icon="shield-check-outline" color={colors.primary} title="EPF (Provident Fund)" subtitle="EPF & Misc Provisions Act, 1952" />
          <ToggleRow label="Enable PF for this school" value={form.pfEnabled} onChange={set('pfEnabled')} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput label="Employee PF %" value={form.pfPercent} onChangeText={set('pfPercent')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
            <TextInput label="Employer PF %" value={form.employerPfPercent} onChangeText={set('employerPfPercent')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput label="EPS %" value={form.epsPercent} onChangeText={set('epsPercent')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
            <TextInput label="PF Wage Ceiling (₹)" value={form.pfWageCeiling} onChangeText={set('pfWageCeiling')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput label="EPF Admin Charges %" value={form.epfAdminChargesPercent} onChangeText={set('epfAdminChargesPercent')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
            <TextInput label="EDLI %" value={form.edliPercent} onChangeText={set('edliPercent')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
          </View>
          <ToggleRow label="Cap PF wage at the ceiling above" value={form.pfAppliedOnCeiling} onChange={set('pfAppliedOnCeiling')} />
          <ChipChoice
            label="PF WAGE APPLICABLE ON"
            options={[{ value: 'basic', label: 'Basic only' }, { value: 'basicPlusDa', label: 'Basic + DA' }, { value: 'custom', label: 'Custom' }]}
            value={form.pfApplicableOn}
            onChange={set('pfApplicableOn')}
          />
          {form.pfApplicableOn === 'custom' && (
            <MultiChipChoice label="PF WAGE COMPONENTS" options={CUSTOM_COMPONENT_OPTIONS} value={form.pfCustomComponents} onToggle={toggleCustom('pfCustomComponents')} />
          )}

          <SectionHeader icon="heart-outline" color="#14B8A6" title="ESI (State Insurance)" subtitle="ESI Act, 1948 — 2019 revision rates" />
          <ToggleRow label="Enable ESI for this school" value={form.esiEnabled} onChange={set('esiEnabled')} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput label="Employee ESI %" value={form.esiPercent} onChangeText={set('esiPercent')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
            <TextInput label="Employer ESI %" value={form.employerEsiPercent} onChangeText={set('employerEsiPercent')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
          </View>
          <TextInput label="ESI Eligibility Ceiling (₹/month gross)" value={form.esiWageCeiling} onChangeText={set('esiWageCeiling')} mode="outlined" keyboardType="decimal-pad" style={{ marginBottom: spacing.sm }} />
          <ChipChoice
            label="ESI WAGE APPLICABLE ON"
            options={[{ value: 'gross', label: 'Gross wages' }, { value: 'custom', label: 'Custom' }]}
            value={form.esiApplicableOn}
            onChange={set('esiApplicableOn')}
          />
          {form.esiApplicableOn === 'custom' && (
            <MultiChipChoice label="ESI WAGE COMPONENTS" options={CUSTOM_COMPONENT_OPTIONS} value={form.esiCustomComponents} onToggle={toggleCustom('esiCustomComponents')} />
          )}

          <SectionHeader icon="cog-outline" color="#F59E0B" title="Other Rules" />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TextInput label="Professional Tax (₹/mo)" value={form.professionalTaxAmount} onChangeText={set('professionalTaxAmount')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
            <TextInput label="Paid Leaves/Month" value={form.paidLeavePerMonth} onChangeText={set('paidLeavePerMonth')} mode="outlined" keyboardType="decimal-pad" style={{ flex: 1, marginBottom: spacing.sm }} />
          </View>
          <TextInput label="Overtime Rate (₹/hour)" value={form.overtimeRatePerHour} onChangeText={set('overtimeRatePerHour')} mode="outlined" keyboardType="decimal-pad" style={{ marginBottom: spacing.sm }} />
          <ChipChoice
            label="ROUNDING MODE"
            options={[{ value: 'nearest', label: 'Nearest rupee' }, { value: 'up', label: 'Round up' }, { value: 'down', label: 'Round down' }]}
            value={form.roundingMode}
            onChange={set('roundingMode')}
          />

          <SectionHeader icon="calendar-outline" color={colors.primary} title="Effective From" />
          <TextInput
            label="Effective From (YYYY-MM-DD)"
            value={effectiveFrom}
            onChangeText={setEffectiveFrom}
            mode="outlined"
            style={{ marginBottom: spacing.sm }}
          />
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
            Payroll cycles generated on or after this date use these rates; earlier cycles keep the previous version.
          </Text>
          <TextInput label="Notes (optional)" value={form.notes} onChangeText={set('notes')} mode="outlined" style={{ marginBottom: spacing.md }} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={saveState.isLoading}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={saveState.isLoading} disabled={saveState.isLoading} style={{ flex: 1 }}>
              Save as New Version
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
