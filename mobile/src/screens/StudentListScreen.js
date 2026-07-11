import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { useAuth } from '../hooks/useAuth';
import { AdminStudentListView } from './students/AdminStudentListView';
import { MyChildrenView } from './students/MyChildrenView';
import { StudentDetailsScreen } from './students/StudentDetailsScreen';
import { useHeaderScreenOptions } from '../navigation/headerOptions';

// GET /student/all's role middleware only allows Super Admin/School Admin/Teacher/Accountant/
// Principal/Vice Principal — Receptionist has a "Students: read" permission entry but isn't in
// that route's allowed roles, a real gap noted during the Phase 5 API audit, not fixed here since
// widening a student-data route's access wasn't asked for.
const DIRECTORY_ROLES = new Set(['Super Admin', 'School Admin', 'Teacher', 'Accountant', 'Principal', 'Vice Principal']);

function StudentListMain({ navigation }) {
  const { role } = useAuth();

  if (role?.name === 'Parent') return <MyChildrenView navigation={navigation} />;
  if (DIRECTORY_ROLES.has(role?.name)) return <AdminStudentListView navigation={navigation} />;

  return (
    <ScreenContainer>
      <QueryState
        isLoading={false}
        isError={false}
        isEmpty
        emptyIcon="account-off-outline"
        emptyLabel="Student directory isn't available for this role yet"
      />
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

// This screen is itself a nested stack (list → details) rather than a single component — see
// SELF_HEADERED_KEYS in screenForModule.js, which tells the outer Tab/Drawer to not also render a
// header for this item, so only this stack's own header shows.
export function StudentListScreen() {
  const headerOptions = useHeaderScreenOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="StudentListMain" component={StudentListMain} options={{ title: 'Students' }} />
      <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} options={{ title: 'Student Details' }} />
    </Stack.Navigator>
  );
}
