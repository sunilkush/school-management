import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useRejectLeaveRequestMutation } from '../../store/api/apiSlice';

export function RejectLeaveSheet({ request, onDismiss, onRejected }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const [rejectLeaveRequest, rejectState] = useRejectLeaveRequestMutation();

  useEffect(() => {
    if (request) {
      setReason('');
      setError(null);
    }
  }, [request]);

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Enter a rejection reason');
      return;
    }
    try {
      await rejectLeaveRequest({ id: request._id, rejectionReason: reason.trim() }).unwrap();
      onRejected?.();
    } catch (err) {
      setError(err?.message || 'Failed to reject request');
    }
  };

  return (
    <Portal>
      <Modal visible={Boolean(request)} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        {request && (
          <View>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Reject Leave Request</Text>
            <FormField label="Rejection Reason" value={reason} onChangeText={setReason} multiline numberOfLines={3} disabled={rejectState.isLoading} />

            {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={rejectState.isLoading}>
                Cancel
              </Button>
              <Button mode="contained" buttonColor={colors.danger} onPress={handleReject} loading={rejectState.isLoading} disabled={rejectState.isLoading} style={{ flex: 1 }}>
                Reject
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
}
