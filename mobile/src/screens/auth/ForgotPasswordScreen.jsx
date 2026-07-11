import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { authApi } from '../../api/authApi';
import { FormField } from '../../components/ui/FormField';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAppTheme } from '../../theme/ThemeProvider';
import { validateEmail } from '../../utils/validators';

export function ForgotPasswordScreen({ navigation }) {
  const { colors, typography, spacing } = useAppTheme();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const error = validateEmail(email);
    setFieldError(error);
    setServerError(null);
    if (error) return;

    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <ScreenContainer>
        <View style={{ marginTop: spacing.xxxl }}>
          <Text style={[typography.h2, { color: colors.text }]}>Check your email</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            If an account exists for {email.trim()}, we've sent a link to reset your password.
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }}>
            Back to Sign In
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={{ marginTop: spacing.xxxl, marginBottom: spacing.xxl }}>
        <Text style={[typography.h1, { color: colors.text }]}>Reset password</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Enter your account email and we'll send you a reset link.
        </Text>
      </View>

      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        error={fieldError}
        disabled={submitting}
      />

      {Boolean(serverError) && (
        <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>{serverError}</Text>
      )}

      <Button mode="contained" onPress={handleSubmit} loading={submitting} disabled={submitting} style={{ marginTop: spacing.md }}>
        Send Reset Link
      </Button>
      <Button mode="text" onPress={() => navigation.goBack()} disabled={submitting} style={{ marginTop: spacing.sm }}>
        Back to Sign In
      </Button>
    </ScreenContainer>
  );
}
