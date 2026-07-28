import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Modal, Portal, SegmentedButtons, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useReturnIssuedBookMutation } from '../../store/api/apiSlice';

// "Damaged" applies settings.damagedBookFine, same as "Lost" applies settings.lostBookFine
// (issuedBook.controllers.js's returnBook).
export function ReturnBookSheet({ issuedBook, onDismiss, onReturned }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [status, setStatus] = useState('Returned');
  const [error, setError] = useState(null);
  const [returnBook, returnState] = useReturnIssuedBookMutation();

  useEffect(() => {
    if (issuedBook) {
      setStatus('Returned');
      setError(null);
    }
  }, [issuedBook]);

  const handleConfirm = async () => {
    try {
      await returnBook({ id: issuedBook._id, status }).unwrap();
      onReturned?.();
    } catch (err) {
      setError(err?.message || 'Failed to process return');
    }
  };

  return (
    <Portal>
      <Modal visible={Boolean(issuedBook)} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        {issuedBook && (
          <View>
            <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{issuedBook.bookId?.title}</Text>

            <SegmentedButtons
              value={status}
              onValueChange={setStatus}
              buttons={[
                { value: 'Returned', label: 'Returned' },
                { value: 'Damaged', label: 'Damaged' },
                { value: 'Lost', label: 'Lost' },
              ]}
            />

            {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={returnState.isLoading}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleConfirm} loading={returnState.isLoading} disabled={returnState.isLoading} style={{ flex: 1 }}>
                Confirm
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </Portal>
  );
}
