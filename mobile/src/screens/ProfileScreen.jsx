import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Button, List, SegmentedButtons, Snackbar, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { Panel } from '../components/ui/Panel';
import { SectionHeader } from '../components/ui/SectionHeader';
import { FormField } from '../components/ui/FormField';
import { StatusPill } from '../components/ui/StatusPill';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { setThemeMode } from '../store/slices/uiSlice';
import { updateProfile } from '../store/slices/authSlice';
import { useAppHeaderOptions } from '../navigation/headerOptions';
import {
  useChangePasswordMutation,
  useGetMyEnrollmentQuery,
  useGetStudentProfileQuery,
  useUpdateStudentProfileMutation,
} from '../store/api/apiSlice';
import { validatePassword } from '../utils/validators';
import { SettingsScreen } from './SettingsScreen';

// Mirrors the web app's Profile.jsx — roles that show the "Employee Details" / "Emergency
// Contact" sections instead of the student-only ones.
const EMPLOYEE_ROLES = new Set([
  'Super Admin', 'School Admin', 'Principal', 'Vice Principal',
  'Teacher', 'Subject Coordinator', 'Exam Coordinator',
  'Accountant', 'Staff', 'Support Staff',
  'Librarian', 'Hostel Warden', 'Transport Manager',
  'Receptionist', 'IT Support', 'Counselor', 'Security',
]);

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const fmtDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

function InfoBadge({ label, value, colors, typography, spacing, radii }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 100,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSoft,
        borderRadius: radii.md,
        padding: spacing.sm,
      }}
    >
      <Text style={[typography.caption, { color: colors.textMuted }]} numberOfLines={1}>{label}</Text>
      <Text style={[typography.bodyStrong, { color: colors.text, marginTop: 2 }]} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

function ReadRow({ label, value, colors, typography, spacing }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 4 }]}>{label}</Text>
      <View style={{ backgroundColor: colors.surfaceSoft, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: spacing.sm }}>
        <Text style={[typography.body, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function GuardianCard({ title, icon, color, data, onChange, colors, typography, spacing, radii }) {
  return (
    <Panel>
      <SectionHeader icon={icon} color={color} title={title} />
      <FormField label="Name" value={data.name} onChangeText={(v) => onChange('name', v)} />
      <FormField label="Mobile" value={data.mobile} onChangeText={(v) => onChange('mobile', v)} keyboardType="phone-pad" />
      <FormField label="Email" value={data.email} onChangeText={(v) => onChange('email', v)} keyboardType="email-address" autoCapitalize="none" />
    </Panel>
  );
}

function ProfileMain({ navigation }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user, role, signOut, status } = useAuth();
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.ui.themeMode);

  const roleName = role?.name || '';
  const isStudent = roleName === 'Student';
  const isEmployee = EMPLOYEE_ROLES.has(roleName);

  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [empForm, setEmpForm] = useState({
    gender: '', dateOfBirth: '', address: '', joiningDate: '',
    qualification: '', emergencyContactName: '', emergencyContactPhone: '',
  });
  const [studentInfo, setStudentInfo] = useState({ dateOfBirth: '', gender: '', bloodGroup: '', address: '' });
  const [fatherInfo, setFatherInfo] = useState({ name: '', mobile: '', email: '' });
  const [motherInfo, setMotherInfo] = useState({ name: '', mobile: '', email: '' });
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState(null);

  const [changePassword, changePasswordState] = useChangePasswordMutation();
  const [updateStudentProfile] = useUpdateStudentProfileMutation();
  const { data: studentProfile } = useGetStudentProfileQuery(undefined, { skip: !isStudent });
  const { data: enrollment } = useGetMyEnrollmentQuery(undefined, { skip: !isStudent });

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    setEmpForm({
      gender: user.gender || '',
      dateOfBirth: fmtDate(user.dateOfBirth),
      address: user.address || '',
      joiningDate: fmtDate(user.joiningDate),
      qualification: user.qualification || '',
      emergencyContactName: user.emergencyContactName || '',
      emergencyContactPhone: user.emergencyContactPhone || '',
    });
  }, [user]);

  useEffect(() => {
    if (!studentProfile) return;
    setProfileForm((p) => ({
      name: p.name || studentProfile?.userId?.name || '',
      email: p.email || studentProfile?.userId?.email || '',
      phone: p.phone || studentProfile?.userId?.phone || '',
    }));
    setStudentInfo({
      dateOfBirth: fmtDate(studentProfile.dateOfBirth),
      gender: studentProfile.gender || '',
      bloodGroup: studentProfile.bloodGroup || '',
      address: studentProfile.address || '',
    });
    setFatherInfo({
      name: studentProfile?.fatherInfo?.name || studentProfile?.fatherId?.name || '',
      mobile: studentProfile?.fatherInfo?.mobile || studentProfile?.fatherId?.phone || '',
      email: studentProfile?.fatherInfo?.email || studentProfile?.fatherId?.email || '',
    });
    setMotherInfo({
      name: studentProfile?.motherInfo?.name || studentProfile?.motherId?.name || '',
      mobile: studentProfile?.motherInfo?.mobile || studentProfile?.motherId?.phone || '',
      email: studentProfile?.motherInfo?.email || studentProfile?.motherId?.email || '',
    });
  }, [studentProfile]);

  const registrationNo = enrollment?.registrationNumber || '—';
  const classInfo = enrollment?.schoolClass?.name
    ? `${enrollment.schoolClass.name}${enrollment?.section?.name ? ` - ${enrollment.section.name}` : ''}`
    : '—';
  const academicYear = enrollment?.academicYear?.name || '—';

  const handleSaveProfile = async () => {
    if (!profileForm.name || !profileForm.email) {
      setSnackbar({ message: 'Name and email are required', isError: true });
      return;
    }
    setSaving(true);
    try {
      if (isStudent) {
        await updateStudentProfile({
          name: profileForm.name, email: profileForm.email, phone: profileForm.phone,
          dateOfBirth: studentInfo.dateOfBirth, gender: studentInfo.gender,
          bloodGroup: studentInfo.bloodGroup, address: studentInfo.address,
          fatherInfo, motherInfo,
        }).unwrap();
      } else {
        await dispatch(updateProfile({
          name: profileForm.name, email: profileForm.email, phone: profileForm.phone,
          ...(isEmployee ? empForm : {}),
        })).unwrap();
      }
      setSnackbar({ message: 'Profile updated successfully', isError: false });
    } catch (err) {
      setSnackbar({ message: typeof err === 'string' ? err : (err?.message || 'Update failed'), isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const errors = {
      current: !pwdForm.current ? 'Current password is required' : null,
      newPwd: validatePassword(pwdForm.newPwd),
      confirm: pwdForm.confirm !== pwdForm.newPwd ? 'Passwords do not match' : null,
    };
    setPwdErrors(errors);
    if (errors.current || errors.newPwd || errors.confirm) return;
    try {
      await changePassword({ oldPassword: pwdForm.current, newPassword: pwdForm.newPwd }).unwrap();
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      setPwdErrors({});
      setSnackbar({ message: 'Password changed successfully', isError: false });
    } catch (err) {
      setSnackbar({ message: err?.message || 'Failed to change password', isError: true });
    }
  };

  const badgeProps = { colors, typography, spacing, radii };

  return (
    <ScreenContainer scrollable>
      <View style={{ alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.lg }}>
        <AvatarInitials name={profileForm.name || user?.name} size={72} />
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.md }]}>{profileForm.name || roleName}</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{profileForm.email}</Text>
        <View style={{ marginTop: spacing.sm }}>
          <StatusPill
            label={isStudent ? 'Active Student' : (user?.isActive ? 'Active' : 'Inactive')}
            color={colors.success}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        {isStudent ? (
          <>
            <InfoBadge label="Registration" value={registrationNo} {...badgeProps} />
            <InfoBadge label="Class" value={classInfo} {...badgeProps} />
            <InfoBadge label="Academic Year" value={academicYear} {...badgeProps} />
          </>
        ) : (
          <>
            <InfoBadge label="Role" value={roleName} {...badgeProps} />
            <InfoBadge label="Department" value={user?.department?.name || '—'} {...badgeProps} />
            <InfoBadge label="Employee ID" value={user?.regId || '—'} {...badgeProps} />
          </>
        )}
      </View>

      <Panel>
        <SectionHeader icon="account-outline" color={colors.primary} title="Account Details" />
        <FormField label="Full Name" value={profileForm.name} onChangeText={(v) => setProfileForm((p) => ({ ...p, name: v }))} />
        <FormField label="Email" value={profileForm.email} onChangeText={(v) => setProfileForm((p) => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" />
        <FormField label="Phone" value={profileForm.phone} onChangeText={(v) => setProfileForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />
      </Panel>

      {isEmployee && (
        <Panel>
          <SectionHeader icon="briefcase-outline" color={colors.accent} title="Employee Details" />
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>Gender</Text>
          <SegmentedButtons
            value={empForm.gender}
            onValueChange={(v) => setEmpForm((p) => ({ ...p, gender: v }))}
            buttons={GENDER_OPTIONS}
            style={{ marginBottom: spacing.md }}
          />
          <FormField label="Date of Birth (YYYY-MM-DD)" value={empForm.dateOfBirth} onChangeText={(v) => setEmpForm((p) => ({ ...p, dateOfBirth: v }))} placeholder="YYYY-MM-DD" />
          <FormField label="Joining Date (YYYY-MM-DD)" value={empForm.joiningDate} onChangeText={(v) => setEmpForm((p) => ({ ...p, joiningDate: v }))} placeholder="YYYY-MM-DD" />
          <FormField label="Qualification" value={empForm.qualification} onChangeText={(v) => setEmpForm((p) => ({ ...p, qualification: v }))} />
          <FormField label="Address" value={empForm.address} onChangeText={(v) => setEmpForm((p) => ({ ...p, address: v }))} multiline />
          {user?.department?.name && <ReadRow label="Department" value={user.department.name} colors={colors} typography={typography} spacing={spacing} />}
          {user?.designation?.title && (
            <ReadRow
              label="Designation"
              value={`${user.designation.title}${user.designation.level ? ` (${user.designation.level})` : ''}`}
              colors={colors} typography={typography} spacing={spacing}
            />
          )}
        </Panel>
      )}

      {isEmployee && (
        <Panel>
          <SectionHeader icon="heart-outline" color={colors.danger} title="Emergency Contact" />
          <FormField label="Contact Name" value={empForm.emergencyContactName} onChangeText={(v) => setEmpForm((p) => ({ ...p, emergencyContactName: v }))} />
          <FormField label="Contact Phone" value={empForm.emergencyContactPhone} onChangeText={(v) => setEmpForm((p) => ({ ...p, emergencyContactPhone: v }))} keyboardType="phone-pad" />
        </Panel>
      )}

      {isStudent && (
        <Panel>
          <SectionHeader icon="school-outline" color={colors.accent} title="Student Details" />
          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>Gender</Text>
          <SegmentedButtons
            value={studentInfo.gender}
            onValueChange={(v) => setStudentInfo((p) => ({ ...p, gender: v }))}
            buttons={GENDER_OPTIONS}
            style={{ marginBottom: spacing.md }}
          />
          <FormField label="Blood Group" value={studentInfo.bloodGroup} onChangeText={(v) => setStudentInfo((p) => ({ ...p, bloodGroup: v }))} />
          <FormField label="Date of Birth (YYYY-MM-DD)" value={studentInfo.dateOfBirth} onChangeText={(v) => setStudentInfo((p) => ({ ...p, dateOfBirth: v }))} placeholder="YYYY-MM-DD" />
          <FormField label="Address" value={studentInfo.address} onChangeText={(v) => setStudentInfo((p) => ({ ...p, address: v }))} multiline />
        </Panel>
      )}

      {isStudent && (
        <>
          <GuardianCard
            title="Father Details" icon="account-tie" color={colors.primary}
            data={fatherInfo} onChange={(field, v) => setFatherInfo((p) => ({ ...p, [field]: v }))}
            colors={colors} typography={typography} spacing={spacing} radii={radii}
          />
          <GuardianCard
            title="Mother Details" icon="account-heart" color={colors.accent}
            data={motherInfo} onChange={(field, v) => setMotherInfo((p) => ({ ...p, [field]: v }))}
            colors={colors} typography={typography} spacing={spacing} radii={radii}
          />
        </>
      )}

      <Button mode="contained" onPress={handleSaveProfile} loading={saving} disabled={saving} style={{ marginBottom: spacing.xl }}>
        Save Changes
      </Button>

      <Panel>
        <SectionHeader icon="lock-outline" color={colors.warning} title="Change Password" />
        <FormField
          label="Current Password" value={pwdForm.current} onChangeText={(v) => setPwdForm((p) => ({ ...p, current: v }))}
          secureTextEntry autoCapitalize="none" error={pwdErrors.current}
        />
        <FormField
          label="New Password" value={pwdForm.newPwd} onChangeText={(v) => setPwdForm((p) => ({ ...p, newPwd: v }))}
          secureTextEntry autoCapitalize="none" error={pwdErrors.newPwd}
        />
        <FormField
          label="Confirm New Password" value={pwdForm.confirm} onChangeText={(v) => setPwdForm((p) => ({ ...p, confirm: v }))}
          secureTextEntry autoCapitalize="none" error={pwdErrors.confirm}
        />
        <Button mode="contained" onPress={handleChangePassword} loading={changePasswordState.isLoading} disabled={changePasswordState.isLoading}>
          Update Password
        </Button>
      </Panel>

      <Panel>
        <SectionHeader icon="theme-light-dark" color={colors.info} title="Appearance" />
        <SegmentedButtons
          value={themeMode}
          onValueChange={(value) => dispatch(setThemeMode(value))}
          buttons={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Panel>

      <List.Item
        title="Settings"
        description="Notifications, app info"
        left={(props) => <List.Icon {...props} icon="cog-outline" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => navigation.navigate('Settings')}
        style={{ backgroundColor: colors.surface, borderRadius: radii.md, marginBottom: spacing.xl }}
      />

      <Button mode="outlined" onPress={signOut} loading={status === 'loading'} style={{ marginBottom: spacing.xxl }}>
        Sign Out
      </Button>

      <Snackbar
        visible={Boolean(snackbar)}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
        style={snackbar?.isError ? { backgroundColor: colors.danger } : undefined}
      >
        {snackbar?.message}
      </Snackbar>
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

// Nested stack (Profile → Settings) — see SELF_HEADERED_KEYS in screenForModule.js.
export function ProfileScreen() {
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="ProfileMain" component={ProfileMain} options={{ title: 'Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
