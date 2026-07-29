import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, IconButton, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useApproveRestoreJobMutation } from '../../store/api/apiSlice';

/** Mirrors the real web app's own confirmation exactly: a masked verification-code field with a
 * client-side length >= 6 check. The backend's actual validation is identical (`mfaToken.length
 * >= 6`, no OTP/TOTP dispatch or comparison against any stored secret) — this is not real MFA,
 * it just gates the action behind typing something plausible, matching the production behavior
 * as-is rather than upgrading its security model. */
export function ApproveRestoreSheet({ visible, job, onDismiss, onApproved }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [approveRestore, approveState] = useApproveRestoreJobMutation();
  const [mfaToken, setMfaToken] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setMfaToken('');
      setError(null);
    }
  }, [visible]);

  const handleApprove = async () => {
    if (mfaToken.trim().length < 6) {
      setError('Enter at least a 6-digit verification code');
      return;
    }
    try {
      await approveRestore({ id: job._id, mfaToken: mfaToken.trim() }).unwrap();
      onApproved?.();
    } catch (err) {
      setError(err?.data?.message || 'Failed to approve restore');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <IconButton icon="close" size={18} onPress={onDismiss} style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }} />
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Approve Restore</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>
          Enter your verification code to approve restoring backup {job?.backupId?.backupNo ?? ''}.
        </Text>

        <FormField
          label="Verification code"
          value={mfaToken}
          onChangeText={setMfaToken}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={8}
          disabled={approveState.isLoading}
        />

        {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={approveState.isLoading}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleApprove} loading={approveState.isLoading} disabled={approveState.isLoading} style={{ flex: 1 }}>
            Approve
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
