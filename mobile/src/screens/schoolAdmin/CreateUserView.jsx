import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { FormField } from '../../components/ui/FormField';
import { IconWell } from '../../components/ui/IconWell';
import { Panel } from '../../components/ui/Panel';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import {
  useCreatePayrollStructureMutation,
  useGetAllRolesQuery,
  useRegisterEmployeeMutation,
  useRegisterUserMutation,
} from '../../store/api/apiSlice';

// Matches web's RegisterForm.jsx EXCLUDED_ROLES_FOR_SCHOOL_ADMIN — School Admin can create any
// staff role except these.
const EXCLUDED_ROLES = new Set(['super admin', 'school admin', 'student', 'parent']);
const GENDERS = ['Male', 'Female', 'Other'];
// Matches Employee.model.js's employmentType enum exactly — the previous list here
// ('full-time'/'part-time'/'contract') used values the model doesn't accept at all, so step 2
// failed its Mongoose validation on every single submission.
const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Part Time', 'Full Time', 'Intern'];
const PHONE_PATTERN = /^[0-9]{10,13}$/;

/** Mirrors web's antd <Steps> indicator (RegisterForm.jsx) — a numbered circle per step,
 * connected by a line, current/completed steps colored in. */
function StepIndicator({ current, labels }) {
  const { colors, typography, spacing } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
      {labels.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;
        const active = isDone || isActive;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center', width: 74 }}>
              <View
                style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: active ? colors.primary : colors.surfaceSoft,
                  borderWidth: 2, borderColor: active ? colors.primary : colors.border,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isDone ? (
                  <MaterialCommunityIcons name="check" size={15} color="#fff" />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#fff' : colors.textMuted }}>{stepNum}</Text>
                )}
              </View>
              <Text style={[typography.caption, { color: isActive ? colors.primary : colors.textMuted, marginTop: 4, textAlign: 'center' }]} numberOfLines={1}>
                {label}
              </Text>
            </View>
            {i < labels.length - 1 && (
              <View style={{ flex: 1, height: 2, backgroundColor: stepNum < current ? colors.primary : colors.border, marginBottom: 16 }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

/** Create a new staff user — mirrors web's "Add Staff" flow (RegisterForm.jsx) field-for-field:
 * same 2-screen shape (Account / Employee & Payroll), same 3 backend calls (register the bare
 * User, create its Employee profile, then a starter PayrollStructure), same required fields.
 * None of the 3 calls is transactional with the ones before it on web either — if a later step
 * fails, the earlier records still exist, same behavior kept here. Avatar upload is the one
 * genuine web feature not ported: it needs expo-image-picker (a new native dependency requiring a
 * dev-client rebuild) plus reworking this request to multipart/form-data, same category of gap as
 * PayInstallmentSheet.jsx's online-payment deferral — not silently dropped, just not wired yet. */
export function CreateUserView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;

  // /role/by-school only returns roles actually scoped to this school's own schoolId — but
  // seed.js creates every standard role (Teacher, Class Teacher, Librarian, ...) with no schoolId
  // at all (type: "system", schoolId stays null, shared across every school), so that endpoint
  // came back empty for virtually any real school. /role/getAllRoles is what web's RegisterForm.jsx
  // actually calls (fetchRoles() with no schoolId argument) — for a School Admin it returns
  // { $or: [{schoolId: their school}, {type: "system"}] }, i.e. the global catalog plus any
  // custom roles they've created themselves.
  const rolesQuery = useGetAllRolesQuery();
  const roles = (rolesQuery.data ?? []).filter((r) => !EXCLUDED_ROLES.has(r.name?.toLowerCase()));

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [createdUserId, setCreatedUserId] = useState(null);

  const [phoneNo, setPhoneNo] = useState('');
  const [gender, setGender] = useState('Male');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [employmentType, setEmploymentType] = useState('Permanent');
  const [joinDate, setJoinDate] = useState('');
  const [basicSalary, setBasicSalary] = useState('');

  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const [registerUser, registerState] = useRegisterUserMutation();
  const [registerEmployee, employeeState] = useRegisterEmployeeMutation();
  const [createPayrollStructure, payrollState] = useCreatePayrollStructureMutation();
  const submitting = employeeState.isLoading || payrollState.isLoading;

  const resetAll = () => {
    setDone(false);
    setStep(1);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRoleId(null);
    setIsActive(true);
    setCreatedUserId(null);
    setPhoneNo('');
    setGender('Male');
    setDepartment('');
    setDesignation('');
    setEmploymentType('Permanent');
    setJoinDate('');
    setBasicSalary('');
    setError(null);
  };

  const handleRegisterUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !roleId) {
      setError('Name, email, password, confirm password and role are all required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    try {
      const created = await registerUser({ name: name.trim(), email: email.trim(), password, roleId, isActive }).unwrap();
      setCreatedUserId(created._id);
      setStep(2);
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to register user');
    }
  };

  const handleRegisterEmployee = async () => {
    if (!phoneNo.trim() || !gender || !joinDate.trim()) {
      setError('Phone, Gender and Join Date are required');
      return;
    }
    if (!PHONE_PATTERN.test(phoneNo.trim())) {
      setError('Enter a valid 10-13 digit phone number');
      return;
    }
    setError(null);
    try {
      const empResult = await registerEmployee({
        userId: createdUserId,
        schoolId,
        phoneNo: phoneNo.trim(),
        gender,
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
        employmentType,
        joinDate: joinDate.trim(),
      }).unwrap();

      const employeeId = empResult?.employee?._id;
      if (!employeeId) {
        setError('Employee created but ID missing — payroll not created');
        return;
      }

      const basic = Number(basicSalary) || 0;
      const hra = Math.round(basic * 0.4);
      try {
        await createPayrollStructure({
          employeeId,
          schoolId,
          basic,
          hra,
          grossMonthly: basic + hra,
          effectiveFrom: joinDate.trim(),
          status: 'active',
        }).unwrap();
      } catch (payrollErr) {
        setError('User & employee created but payroll setup failed: ' + (payrollErr?.data?.message || payrollErr?.message || ''));
        return;
      }

      setDone(true);
    } catch (err) {
      setError('User registered but employee creation failed: ' + (err?.data?.message || err?.message || ''));
    }
  };

  if (done) {
    return (
      <ScreenContainer scrollable>
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <IconWell icon="check-circle-outline" color={colors.success} size={64} />
          <Text style={[typography.h3, { color: colors.success, marginTop: spacing.md, marginBottom: spacing.sm }]}>Staff User Created</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg }]}>
            {name} has been registered, their employee profile created, and a starter payroll structure set up. A verification email has been sent.
          </Text>
          <Button mode="contained" onPress={resetAll}>
            Create Another User
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  if (step === 2) {
    return (
      <ScreenContainer scrollable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconWell icon="account-plus-outline" color={colors.primary} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[typography.h2, { color: colors.text }]}>Create Staff User</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>Employee profile and payroll setup</Text>
          </View>
        </View>

        <StepIndicator current={2} labels={['Account', 'Employee & Payroll']} />

        <Panel>
          <Text style={[typography.bodyStrong, { color: colors.primary, marginBottom: spacing.md }]}>Employee Profile</Text>
          <FormField label="Phone Number" value={phoneNo} onChangeText={setPhoneNo} keyboardType="phone-pad" disabled={submitting} />
          <SegmentedButtons value={gender} onValueChange={setGender} style={{ marginBottom: spacing.sm }} buttons={GENDERS.map((g) => ({ value: g, label: g }))} />
          <FormField label="Department (optional)" value={department} onChangeText={setDepartment} disabled={submitting} />
          <FormField label="Designation (optional)" value={designation} onChangeText={setDesignation} disabled={submitting} />
          <FormField label="Join Date (YYYY-MM-DD)" value={joinDate} onChangeText={setJoinDate} disabled={submitting} />

          <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>EMPLOYMENT TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
            {EMPLOYMENT_TYPES.map((t) => (
              <Chip key={t} selected={t === employmentType} onPress={() => setEmploymentType(t)}>
                {t}
              </Chip>
            ))}
          </ScrollView>
        </Panel>

        <Panel>
          <Text style={[typography.bodyStrong, { color: colors.primary, marginBottom: spacing.md }]}>Payroll Setup</Text>
          <FormField label="Basic Salary (₹/month)" value={basicSalary} onChangeText={setBasicSalary} keyboardType="numeric" disabled={submitting} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            HRA will be auto-calculated as 40% of basic. You can update the full salary structure later from Payroll → Salary Structures.
          </Text>
        </Panel>

        {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
          <Button mode="outlined" onPress={() => setStep(1)} disabled={submitting} style={{ flex: 1 }}>
            Back
          </Button>
          <Button mode="contained" onPress={handleRegisterEmployee} loading={submitting} disabled={submitting} style={{ flex: 2 }}>
            Register & Create Employee
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-plus-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Create Staff User</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>Account credentials and role</Text>
        </View>
      </View>

      <StepIndicator current={1} labels={['Account', 'Employee & Payroll']} />

      <Panel>
        <FormField label="Full Name" value={name} onChangeText={setName} disabled={registerState.isLoading} />
        <FormField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" disabled={registerState.isLoading} />
        <FormField label="Password" value={password} onChangeText={setPassword} secureTextEntry disabled={registerState.isLoading} />
        <FormField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry disabled={registerState.isLoading} />

        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs }]}>ROLE</Text>
        <QueryState isLoading={rolesQuery.isLoading} isError={rolesQuery.isError} error={rolesQuery.error} onRetry={rolesQuery.refetch} isEmpty={roles.length === 0} emptyIcon="shield-account-outline" emptyLabel="No roles available">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
            {roles.map((r) => (
              <Chip key={r._id} selected={r._id === roleId} onPress={() => setRoleId(r._id)}>
                {r.name}
              </Chip>
            ))}
          </ScrollView>
        </QueryState>
      </Panel>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: 10, backgroundColor: colors.surfaceSoft, marginBottom: spacing.md }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Activate Account</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>User can log in immediately after registration</Text>
        </View>
        <Switch value={isActive} onValueChange={setIsActive} disabled={registerState.isLoading} />
      </View>

      {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.sm }]}>{error}</Text>}

      <Button mode="contained" onPress={handleRegisterUser} loading={registerState.isLoading} disabled={registerState.isLoading}>
        Next: Employee Details
      </Button>
    </ScreenContainer>
  );
}
