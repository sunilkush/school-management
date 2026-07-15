import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, SegmentedButtons, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { FormField } from '../../components/ui/FormField';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetRolesBySchoolQuery, useRegisterEmployeeMutation, useRegisterUserMutation } from '../../store/api/apiSlice';

// Matches web's RegisterForm.jsx EXCLUDED_ROLES_FOR_SCHOOL_ADMIN — School Admin can create any
// staff role except these.
const EXCLUDED_ROLES = new Set(['super admin', 'school admin', 'student', 'parent']);
const GENDERS = ['Male', 'Female', 'Other'];
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract'];

/** Create a new staff user — mirrors the web app's "Add Staff" flow (RegisterForm.jsx), which is
 * client-orchestrated as 2 separate backend calls: register the bare User, then create its
 * Employee profile. Neither call is transactional with the other on the web app either — if step
 * 2 fails, the User from step 1 still exists, same behavior kept here. Payroll structure setup
 * (the web form's 3rd call) is deferred with the rest of the Payroll sub-system. */
export function CreateUserView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;

  const rolesQuery = useGetRolesBySchoolQuery(schoolId, { skip: !schoolId });
  const roles = (rolesQuery.data ?? []).filter((r) => !EXCLUDED_ROLES.has(r.name?.toLowerCase()));

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(null);
  const [createdUserId, setCreatedUserId] = useState(null);

  const [phoneNo, setPhoneNo] = useState('');
  const [gender, setGender] = useState('Male');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [joinDate, setJoinDate] = useState('');

  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const [registerUser, registerState] = useRegisterUserMutation();
  const [registerEmployee, employeeState] = useRegisterEmployeeMutation();

  const handleRegisterUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !roleId) {
      setError('Name, email, password and role are all required');
      return;
    }
    setError(null);
    try {
      const created = await registerUser({ name: name.trim(), email: email.trim(), password, roleId }).unwrap();
      setCreatedUserId(created._id);
      setStep(2);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to register user');
    }
  };

  const handleRegisterEmployee = async () => {
    setError(null);
    try {
      await registerEmployee({
        userId: createdUserId,
        phoneNo: phoneNo.trim() || undefined,
        gender,
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
        employmentType,
        joinDate: joinDate.trim() || undefined,
      }).unwrap();
      setDone(true);
    } catch (err) {
      setError(err?.data?.message || 'Failed to create employee profile');
    }
  };

  if (done) {
    return (
      <ScreenContainer scrollable>
        <Text style={[typography.h3, { color: colors.success, marginBottom: spacing.md }]}>Staff User Created</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          {name} has been registered and their employee profile created. A verification email has been sent.
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            setDone(false);
            setStep(1);
            setName('');
            setEmail('');
            setPassword('');
            setRoleId(null);
            setCreatedUserId(null);
            setPhoneNo('');
            setDepartment('');
            setDesignation('');
            setJoinDate('');
          }}
        >
          Create Another User
        </Button>
      </ScreenContainer>
    );
  }

  if (step === 2) {
    return (
      <ScreenContainer scrollable>
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>STEP 2 OF 2 — EMPLOYEE PROFILE</Text>

        <FormField label="Phone (optional)" value={phoneNo} onChangeText={setPhoneNo} keyboardType="phone-pad" disabled={employeeState.isLoading} />
        <SegmentedButtons value={gender} onValueChange={setGender} style={{ marginBottom: spacing.sm }} buttons={GENDERS.map((g) => ({ value: g, label: g }))} />
        <FormField label="Department (optional)" value={department} onChangeText={setDepartment} disabled={employeeState.isLoading} />
        <FormField label="Designation (optional)" value={designation} onChangeText={setDesignation} disabled={employeeState.isLoading} />
        <FormField label="Join Date (YYYY-MM-DD, optional)" value={joinDate} onChangeText={setJoinDate} disabled={employeeState.isLoading} />

        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>EMPLOYMENT TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
          {EMPLOYMENT_TYPES.map((t) => (
            <Chip key={t} selected={t === employmentType} onPress={() => setEmploymentType(t)}>
              {t}
            </Chip>
          ))}
        </ScrollView>

        {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

        <Button mode="contained" onPress={handleRegisterEmployee} loading={employeeState.isLoading} disabled={employeeState.isLoading}>
          Create Employee Profile
        </Button>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.md }]}>STEP 1 OF 2 — ACCOUNT</Text>

      <FormField label="Full Name" value={name} onChangeText={setName} disabled={registerState.isLoading} />
      <FormField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" disabled={registerState.isLoading} />
      <FormField label="Password" value={password} onChangeText={setPassword} secureTextEntry disabled={registerState.isLoading} />

      <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>ROLE</Text>
      <QueryState isLoading={rolesQuery.isLoading} isError={rolesQuery.isError} error={rolesQuery.error} onRetry={rolesQuery.refetch} isEmpty={roles.length === 0} emptyIcon="shield-account-outline" emptyLabel="No roles available">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
          {roles.map((r) => (
            <Chip key={r._id} selected={r._id === roleId} onPress={() => setRoleId(r._id)}>
              {r.name}
            </Chip>
          ))}
        </ScrollView>
      </QueryState>

      {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

      <Button mode="contained" onPress={handleRegisterUser} loading={registerState.isLoading} disabled={registerState.isLoading}>
        Next: Employee Details
      </Button>
    </ScreenContainer>
  );
}
