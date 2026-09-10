import React, { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useModuleContext } from '../../modules/useModuleContext';
import { formatDate, formatDateOnly } from '../../utils/format';

function SelectField({ field, value, onChange, error }) {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>{field.label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {field.options.map((option) => (
          <Chip
            key={option.value}
            selected={value === option.value}
            showSelectedCheck={false}
            onPress={() => onChange(option.value)}
            compact
          >
            {option.label}
          </Chip>
        ))}
      </View>
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  );
}

function DateField({ field, value, onChange, error }) {
  const { colors, typography, spacing } = useAppTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>{field.label}</Text>
      <Button mode="outlined" icon="calendar" onPress={() => setOpen(true)} contentStyle={{ justifyContent: 'flex-start' }}>
        {value ? formatDate(value) : 'Select a date'}
      </Button>
      {open ? (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          // iOS keeps the picker mounted inline; Android's is a modal that dismisses itself.
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, picked) => {
            if (Platform.OS !== 'ios') setOpen(false);
            if (event.type === 'dismissed' || !picked) return;
            // Store as YYYY-MM-DD in LOCAL time — toISOString() would shift the day for anyone
            // east/west of UTC late in the evening, silently booking the wrong leave date.
            onChange(formatDateOnly(picked));
          }}
        />
      ) : null}
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  );
}

/**
 * Renders a module descriptor's `create.fields` as a form, validates the required ones, and
 * submits through the descriptor's own mutation. No module writes its own form screen.
 */
export function createFormScreen(descriptor) {
  const form = descriptor.create;

  return function ModuleFormScreen({ navigation }) {
    const { colors, typography, spacing } = useAppTheme();
    const ctx = useModuleContext();
    const [values, setValues] = useState(() =>
      Object.fromEntries(form.fields.map((field) => [field.name, field.initial ?? '']))
    );
    const [errors, setErrors] = useState({});
    const [submit, { isLoading }] = form.useMutation();

    const setValue = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

    const validate = useMemo(
      () => () => {
        const found = {};
        for (const field of form.fields) {
          const value = values[field.name];
          if (field.required && (value == null || String(value).trim() === '')) {
            found[field.name] = `${field.label} is required`;
          }
        }
        // Cross-field rules the backend also enforces (e.g. endDate >= startDate) — caught here so
        // the user sees them before a round trip, not instead of the server check.
        Object.assign(found, form.validate?.(values) ?? {});
        setErrors(found);
        return Object.keys(found).length === 0;
      },
      [values]
    );

    const onSubmit = () => {
      if (!validate()) return;
      submit(form.buildPayload(values, ctx))
        .unwrap()
        .then(() => navigation.goBack())
        // errorMiddleware.js already alerts on a rejected mutation.
        .catch(() => {});
    };

    return (
      <ScreenContainer scrollable>
        {form.intro ? (
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>{form.intro}</Text>
        ) : null}

        {form.fields.map((field) => {
          if (field.type === 'select') {
            return (
              <SelectField
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(value) => setValue(field.name, value)}
                error={errors[field.name]}
              />
            );
          }
          if (field.type === 'date') {
            return (
              <DateField
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(value) => setValue(field.name, value)}
                error={errors[field.name]}
              />
            );
          }
          return (
            <FormField
              key={field.name}
              label={field.label}
              value={String(values[field.name] ?? '')}
              onChangeText={(value) => setValue(field.name, value)}
              error={errors[field.name]}
              placeholder={field.placeholder}
              multiline={field.type === 'textarea'}
              numberOfLines={field.type === 'textarea' ? 4 : 1}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
              right={field.suffix ? <TextInput.Affix text={field.suffix} /> : undefined}
            />
          );
        })}

        <Button
          mode="contained"
          onPress={onSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={{ marginTop: spacing.lg }}
        >
          {form.submitLabel ?? 'Submit'}
        </Button>
      </ScreenContainer>
    );
  };
}
