import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Chip, SegmentedButtons, Snackbar, Text } from 'react-native-paper';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { FormField } from '../../components/ui/FormField';
import { IconWell } from '../../components/ui/IconWell';
import { Panel } from '../../components/ui/Panel';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useCreateStudentAdmissionMutation, useGetClassDetailsQuery } from '../../store/api/apiSlice';

const GENDERS = ['Male', 'Female', 'Other'];

/** New student enrollment — mirrors frontend/src/components/forms/AdmissionForm.jsx. Only the
 * fields the backend's POST /student/register actually accepts are collected here; the web form
 * itself collects several extra fields (mobile number, admission date, religion, siblings, ...)
 * that are silently dropped client-side and never reach the API — not reproduced here either. */
export function StudentAdmissionView() {
  const { colors, typography, spacing } = useAppTheme();
  const { user } = useAuth();
  const schoolId = user?.school?._id;
  const academicYearId = user?.academicYear?._id;

  const classesQuery = useGetClassDetailsQuery({ schoolId, academicYearId }, { skip: !schoolId });
  const classes = classesQuery.data ?? [];
  const [classId, setClassId] = useState(null);
  const [sectionId, setSectionId] = useState(null);
  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections ?? [];

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  const [fatherName, setFatherName] = useState('');
  const [fatherEmail, setFatherEmail] = useState('');
  const [fatherMobile, setFatherMobile] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherEmail, setMotherEmail] = useState('');
  const [motherMobile, setMotherMobile] = useState('');

  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [createAdmission, createState] = useCreateStudentAdmissionMutation();

  const resetForm = () => {
    setClassId(null);
    setSectionId(null);
    setStudentName('');
    setStudentEmail('');
    setDateOfBirth('');
    setGender('Male');
    setAddress('');
    setBloodGroup('');
    setFatherName('');
    setFatherEmail('');
    setFatherMobile('');
    setMotherName('');
    setMotherEmail('');
    setMotherMobile('');
  };

  const handleSubmit = async () => {
    if (!studentName.trim() || !studentEmail.trim() || !classId) {
      setError('Student name, email and class are all required');
      return;
    }
    setError(null);
    try {
      const res = await createAdmission({
        studentData: {
          name: studentName.trim(),
          email: studentEmail.trim(),
          dateOfBirth: dateOfBirth.trim() || undefined,
          gender,
          address: address.trim() || undefined,
          bloodGroup: bloodGroup.trim() || undefined,
        },
        fatherData: fatherName.trim() ? { name: fatherName.trim(), email: fatherEmail.trim() || undefined, mobile: fatherMobile.trim() || undefined } : undefined,
        motherData: motherName.trim() ? { name: motherName.trim(), email: motherEmail.trim() || undefined, mobile: motherMobile.trim() || undefined } : undefined,
        schoolId,
        academicYearId,
        schoolClassId: classId,
        sectionId,
      }).unwrap();
      setResult(res);
      resetForm();
    } catch (err) {
      setError(err?.data?.message || 'Failed to admit student');
    }
  };

  if (result) {
    return (
      <ScreenContainer scrollable>
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <IconWell icon="check-circle-outline" color={colors.success} size={64} />
          <Text style={[typography.h3, { color: colors.success, marginTop: spacing.md }]}>Student Admitted</Text>
        </View>
        <Panel>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>Login Credentials</Text>
          {['student', 'father', 'mother'].map((who) =>
            result.credentials?.[who] ? (
              <View key={who} style={{ marginTop: spacing.sm }}>
                <Text style={[typography.caption, { color: colors.textMuted }]}>{who.toUpperCase()}</Text>
                <Text style={[typography.body, { color: colors.text }]}>Login: {result.credentials[who].loginId}</Text>
                <Text style={[typography.body, { color: colors.text }]}>Password: {result.credentials[who].password}</Text>
              </View>
            ) : null
          )}
        </Panel>
        <Button mode="contained" style={{ marginBottom: spacing.xl }} onPress={() => setResult(null)}>
          Admit Another Student
        </Button>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="account-school-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Student Admission</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            Enroll a new student and link their parents
          </Text>
        </View>
      </View>

      <Panel>
        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Student Details</Text>
        <FormField label="Full Name" value={studentName} onChangeText={setStudentName} disabled={createState.isLoading} />
        <FormField label="Email" value={studentEmail} onChangeText={setStudentEmail} autoCapitalize="none" keyboardType="email-address" disabled={createState.isLoading} />
        <FormField label="Date of Birth (YYYY-MM-DD, optional)" value={dateOfBirth} onChangeText={setDateOfBirth} disabled={createState.isLoading} />

        <SegmentedButtons value={gender} onValueChange={setGender} style={{ marginBottom: spacing.sm }} buttons={GENDERS.map((g) => ({ value: g, label: g }))} />

        <FormField label="Address (optional)" value={address} onChangeText={setAddress} disabled={createState.isLoading} />
        <FormField label="Blood Group (optional)" value={bloodGroup} onChangeText={setBloodGroup} disabled={createState.isLoading} />
      </Panel>

      <Panel>
        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Class</Text>
        <QueryState isLoading={classesQuery.isLoading} isError={classesQuery.isError} error={classesQuery.error} onRetry={classesQuery.refetch} isEmpty={classes.length === 0} emptyIcon="google-classroom" emptyLabel="No classes found">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'center' }}>
            {classes.map((c) => (
              <Chip key={c._id} selected={c._id === classId} onPress={() => { setClassId(c._id); setSectionId(null); }}>
                {c.name}
              </Chip>
            ))}
          </ScrollView>
          {sections.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, alignItems: 'center' }}>
              {sections.map((s) => (
                <Chip key={s._id} selected={s._id === sectionId} onPress={() => setSectionId(s._id)}>
                  {s.name}
                </Chip>
              ))}
            </ScrollView>
          )}
        </QueryState>
      </Panel>

      <Panel>
        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>
          Father's Details (optional)
        </Text>
        <FormField label="Name" value={fatherName} onChangeText={setFatherName} disabled={createState.isLoading} />
        <FormField label="Email" value={fatherEmail} onChangeText={setFatherEmail} autoCapitalize="none" keyboardType="email-address" disabled={createState.isLoading} />
        <FormField label="Mobile" value={fatherMobile} onChangeText={setFatherMobile} keyboardType="phone-pad" disabled={createState.isLoading} />
      </Panel>

      <Panel>
        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>
          Mother's Details (optional)
        </Text>
        <FormField label="Name" value={motherName} onChangeText={setMotherName} disabled={createState.isLoading} />
        <FormField label="Email" value={motherEmail} onChangeText={setMotherEmail} autoCapitalize="none" keyboardType="email-address" disabled={createState.isLoading} />
        <FormField label="Mobile" value={motherMobile} onChangeText={setMotherMobile} keyboardType="phone-pad" disabled={createState.isLoading} />
      </Panel>

      {error && <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.md }]}>{error}</Text>}

      <Button mode="contained" onPress={handleSubmit} loading={createState.isLoading} disabled={createState.isLoading} style={{ marginBottom: spacing.xl }}>
        Admit Student
      </Button>
    </ScreenContainer>
  );
}
