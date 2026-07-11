import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Chip, Modal, Portal, Text } from 'react-native-paper';
import { FormField } from '../../components/ui/FormField';
import { useAppTheme } from '../../theme/ThemeProvider';
import { LEAVE_TYPES, inclusiveDayCount, leaveRoleFor } from '../../utils/leave';
import { useCreateLeaveRequestMutation } from '../../store/api/apiSlice';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** targetUserId/targetRoleName let a Parent apply on a verified child's behalf (backend requires
 * the child's own role, e.g. "student", not the parent's) — omit both to apply for yourself. */
export function ApplyLeaveSheet({ visible, onDismiss, onCreated, roleName, targetUserId, targetRoleName }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [createLeaveRequest, createState] = useCreateLeaveRequestMutation();

  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setLeaveType('casual');
      setStartDate('');
      setEndDate('');
      setReason('');
      setError(null);
    }
  }, [visible]);

  const totalDays = inclusiveDayCount(startDate, endDate);

  const handleSubmit = async () => {
    if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate) || !totalDays) {
      setError('Enter valid start/end dates (YYYY-MM-DD), with end on or after start');
      return;
    }
    if (!reason.trim()) {
      setError('Enter a reason');
      return;
    }

    try {
      await createLeaveRequest({
        userId: targetUserId || undefined,
        role: targetRoleName ? leaveRoleFor(targetRoleName) : leaveRoleFor(roleName),
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason: reason.trim(),
      }).unwrap();
      onCreated?.();
    } catch (err) {
      setError(err?.message || 'Failed to submit leave request');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: radii.lg, padding: spacing.lg }}>
        <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Apply for Leave</Text>

        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>LEAVE TYPE</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.sm }}>
          {LEAVE_TYPES.map((t) => (
            <Chip key={t} selected={t === leaveType} onPress={() => setLeaveType(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </Chip>
          ))}
        </View>

        <FormField label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} disabled={createState.isLoading} />
        <FormField label="End Date (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} disabled={createState.isLoading} />
        {totalDays ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>{totalDays} day(s)</Text>
        ) : null}
        <FormField label="Reason" value={reason} onChangeText={setReason} multiline numberOfLines={3} disabled={createState.isLoading} />

        {error && <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>}

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1 }} disabled={createState.isLoading}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleSubmit} loading={createState.isLoading} disabled={createState.isLoading} style={{ flex: 1 }}>
            Submit
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
