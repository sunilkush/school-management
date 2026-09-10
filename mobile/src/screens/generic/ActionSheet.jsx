import React, { useState } from 'react';
import { Button } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useModuleContext } from '../../modules/useModuleContext';

/**
 * Some record actions need input before they can fire — rejecting leave stores the reason on the
 * record and shows it back to the applicant, so it cannot be defaulted. Rather than each such
 * module writing its own reason screen, a detail action declares `fields` and gets this one.
 *
 * Deliberately not an Alert prompt: `Alert.prompt` is iOS-only, so an Android approver would have
 * had no way to reject at all.
 */
export function createActionScreen(descriptor) {
  const actions = descriptor.detail?.actions ?? [];

  return function ModuleActionScreen({ route, navigation }) {
    const { spacing } = useAppTheme();
    const ctx = useModuleContext();
    const { actionKey, row } = route.params ?? {};
    const action = actions.find((candidate) => candidate.key === actionKey);

    const [values, setValues] = useState(() =>
      Object.fromEntries((action?.fields ?? []).map((field) => [field.name, field.initial ?? '']))
    );
    const [errors, setErrors] = useState({});
    const [run, { isLoading }] = action.useMutation();

    const onSubmit = () => {
      const found = {};
      for (const field of action.fields) {
        if (field.required && String(values[field.name] ?? '').trim() === '') {
          found[field.name] = `${field.label} is required`;
        }
      }
      setErrors(found);
      if (Object.keys(found).length > 0) return;

      run(action.buildArg(row, ctx, values))
        .unwrap()
        // Back past the detail screen too, not just this one — the record's state has changed and
        // the refreshed list is what the user wants to see next.
        .then(() => navigation.navigate('ModuleList'))
        // errorMiddleware.js already alerts on a rejected mutation.
        .catch(() => {});
    };

    return (
      <ScreenContainer scrollable>
        {action.fields.map((field) => (
          <FormField
            key={field.name}
            label={field.label}
            value={String(values[field.name] ?? '')}
            onChangeText={(value) => setValues((prev) => ({ ...prev, [field.name]: value }))}
            error={errors[field.name]}
            placeholder={field.placeholder}
            multiline={field.type === 'textarea'}
            numberOfLines={field.type === 'textarea' ? 4 : 1}
          />
        ))}

        <Button
          mode="contained"
          onPress={onSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={{ marginTop: spacing.lg }}
        >
          {action.submitLabel ?? action.label}
        </Button>
      </ScreenContainer>
    );
  };
}
