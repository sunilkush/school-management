import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { QueryState } from '../components/ui/QueryState';
import { TeacherHomeworkView } from './homework/TeacherHomeworkView';
import { StudentHomeworkView } from './homework/StudentHomeworkView';
import { HomeworkSubmissionsView } from './homework/HomeworkSubmissionsView';
import { ParentHomeworkView } from './parent/ParentHomeworkView';
import { useAuth } from '../hooks/useAuth';
import { useAppHeaderOptions } from '../navigation/headerOptions';

function HomeworkMain({ navigation }) {
  const { role } = useAuth();

  // Sports Teacher/Class Teacher's web "Assignments" reuses the identical Teacher Assignments.jsx
  // component (full create/edit/delete/grade CRUD, not a read-only view) — now backend-permitted
  // for both roles too (studentPortal.routes.js's ADMIN_AND_TEACHER, class.routes.js's READ_ROLES).
  if (['Teacher', 'Sports Teacher', 'Class Teacher'].includes(role?.name)) return <TeacherHomeworkView navigation={navigation} />;
  if (role?.name === 'Student') return <StudentHomeworkView />;
  if (role?.name === 'Parent') return <ParentHomeworkView />;

  return (
    <ScreenContainer>
      <QueryState isLoading={false} isError={false} isEmpty emptyIcon="clipboard-text-off-outline" emptyLabel="Homework view isn't available for this role yet" />
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

// Nested stack (Homework list → Submissions, Teacher only) — see SELF_HEADERED_KEYS in
// screenForModule.js.
export function AssignmentsScreen() {
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="HomeworkMain" component={HomeworkMain} options={{ title: 'Homework' }} />
      <Stack.Screen
        name="HomeworkSubmissions"
        component={HomeworkSubmissionsView}
        options={({ route }) => ({ title: route.params?.title ?? 'Submissions' })}
      />
    </Stack.Navigator>
  );
}
