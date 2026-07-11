import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyChildrenView } from './students/MyChildrenView';
import { StudentDetailsScreen } from './students/StudentDetailsScreen';
import { useAppHeaderOptions } from '../navigation/headerOptions';

const Stack = createNativeStackNavigator();

// MyChildrenView/StudentDetailsScreen already existed (built for Parent's 'Students' tab, which
// Parent's NAV_CONFIG never actually references — only 'MyChildren' does), just never wired to a
// nav key of their own. This is that wiring: same nested list→details Stack pattern as
// StudentListScreen.jsx — see SELF_HEADERED_KEYS in screenForModule.js.
export function MyChildrenScreen() {
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="MyChildrenMain" component={MyChildrenView} options={{ title: 'My Children' }} />
      <Stack.Screen name="StudentDetails" component={StudentDetailsScreen} options={{ title: 'Student Details' }} />
    </Stack.Navigator>
  );
}
