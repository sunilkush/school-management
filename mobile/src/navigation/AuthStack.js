import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { useHeaderScreenOptions } from './headerOptions';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  const headerOptions = useHeaderScreenOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: true, title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
}
