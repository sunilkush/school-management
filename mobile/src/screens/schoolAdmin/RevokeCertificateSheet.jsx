import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useRevokeCertificateMutation } from '../../store/api/apiSlice';

export function RevokeCertificateSheet({ certificate, onDismiss }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [revokeCertificate, revokeState] = useRevokeCertificateMutation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => { if (certificate) { setReason(''); setError(null); } }, [certificate]);

  const handleRevoke = async () => {
    if (!reason.trim()) { setError('A revoke reason is required'); return; }
    try {
      await revokeCertificate({ id: certificate._id, revokeReason: reason.trim() }).unwrap();
      onDismiss?.();
    } catch (err) {
      setError(err?.message || 'Failed to revoke certificate');
    }
  };

  return (
    <Portal>
      <Modal visible={!!certificate} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.sm }]}>Revoke Certificate</Text>
        <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing.md }]}>
          {certificate?.certificateNumber} — {certificate?.studentName}
        </Text>
        <TextInput label="Reason" value={reason} onChangeText={setReason} mode="outlined" multiline style={{ marginBottom: spacing.sm }} />
        {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={revokeState.isLoading}>Cancel</Button>
          <Button mode="contained" buttonColor={colors.danger} onPress={handleRevoke} loading={revokeState.isLoading} disabled={revokeState.isLoading} style={{ flex: 1 }}>
            Revoke
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
