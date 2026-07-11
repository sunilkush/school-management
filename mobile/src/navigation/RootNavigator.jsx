import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { bootstrapSession } from '../store/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { useAppTheme } from '../theme/ThemeProvider';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { AuthStack } from './AuthStack';
import { AppShell } from './AppShell';

export function RootNavigator() {
  const dispatch = useDispatch();
  const { isBooting, isAuthenticated } = useAuth();
  const { navigationTheme } = useAppTheme();

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  usePushRegistration();

  return (
    <NavigationContainer theme={navigationTheme}>
      {isBooting ? <SplashScreen /> : isAuthenticated ? <AppShell /> : <AuthStack />}
    </NavigationContainer>
  );
}
