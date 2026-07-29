import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { StatusPill } from '../../components/ui/StatusPill';
import { FormField } from '../../components/ui/FormField';
import { IconWell } from '../../components/ui/IconWell';
import { formatDate } from '../../utils/format';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetEmployeesQuery, useUpdateEmployeeMutation } from '../../store/api/apiSlice';

/** Transport Manager's driver roster — mirrors web's DriversPage.jsx (Transport/TransportPages.jsx)
 * exactly: same "Employee with Transport department or Driver designation" filter (this is an
 * HR/employee-record roster, distinct from the "Driver" role's own login-account concept used
 * elsewhere for vehicle self-service — see Vehicles.jsx's own comment on that distinction), same
 * view + edit-designation/department/phone actions via PUT /employee/updateEmployee/:id. */
export function DriversView() {
  const { colors, typography, spacing } = useAppTheme();
  const [editingDriver, setEditingDriver] = useState(null);
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [error, setError] = useState(null);

  const employeesQuery = useGetEmployeesQuery();
  const employees = employeesQuery.data ?? [];
  const [updateEmployee, updateState] = useUpdateEmployeeMutation();

  const drivers = useMemo(
    () => employees.filter((e) => e.department?.toLowerCase().includes('transport') || e.designation?.toLowerCase().includes('driver')),
    [employees]
  );

  const openEdit = (driver) => {
    setEditingDriver(driver);
    setDesignation(driver.designation || '');
    setDepartment(driver.department || '');
    setPhoneNo(driver.phoneNo || '');
    setError(null);
  };

  const closeEdit = () => setEditingDriver(null);

  const handleSave = async () => {
    try {
      await updateEmployee({ id: editingDriver._id, payload: { designation, department, phoneNo } }).unwrap();
      closeEdit();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Update failed');
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-tie-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Drivers</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Transport department & driver-designation staff roster
          </Text>
        </View>
      </View>

      <QueryState
        isLoading={employeesQuery.isLoading}
        isError={employeesQuery.isError}
        error={employeesQuery.error}
        onRetry={employeesQuery.refetch}
        isEmpty={drivers.length === 0}
        emptyIcon="account-tie-outline"
        emptyLabel="No drivers found. Add employees with Transport department or Driver designation."
      >
        {drivers.map((d) => {
          const name = d.userId?.name || d.name || '—';
          return (
            <AccentListCard
              key={d._id}
              accent={d.isActive ? colors.success : colors.danger}
              avatar={<AvatarInitials name={name} size={40} />}
              title={name}
              subtitle={`${d.designation || 'Driver'} · ${d.department || 'Transport'}`}
              badge={<StatusPill label={d.isActive ? 'Active' : 'Inactive'} color={d.isActive ? colors.success : colors.danger} />}
              meta={[
                { label: 'Phone', value: d.phoneNo || '—' },
                { label: 'Email', value: d.userId?.email || d.email || '—' },
                { label: 'Join Date', value: d.joinDate ? formatDate(d.joinDate) : '—' },
              ]}
              expandable
              actions={
                <Button mode="contained-tonal" compact icon="pencil-outline" onPress={() => openEdit(d)}>
                  Edit
                </Button>
              }
            />
          );
        })}
      </QueryState>

      <Portal>
        <Modal visible={Boolean(editingDriver)} onDismiss={closeEdit} contentContainerStyle={{ backgroundColor: colors.surface, margin: spacing.lg, borderRadius: 16, padding: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>Edit Driver Info</Text>

          <FormField label="Designation" value={designation} onChangeText={setDesignation} placeholder="e.g. Senior Driver" disabled={updateState.isLoading} />
          <FormField label="Department" value={department} onChangeText={setDepartment} placeholder="e.g. Transport" disabled={updateState.isLoading} />
          <FormField label="Phone Number" value={phoneNo} onChangeText={setPhoneNo} keyboardType="phone-pad" disabled={updateState.isLoading} />

          {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Button mode="outlined" onPress={closeEdit} style={{ flex: 1 }} disabled={updateState.isLoading}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleSave} loading={updateState.isLoading} disabled={updateState.isLoading} style={{ flex: 1 }}>
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScreenContainer>
  );
}
