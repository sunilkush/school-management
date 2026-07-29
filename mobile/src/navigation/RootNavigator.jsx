import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useDispatch } from 'react-redux';
import { bootstrapSession } from '../store/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { useAppTheme } from '../theme/ThemeProvider';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { AuthStack } from './AuthStack';
import { AppShell } from './AppShell';
import { navigationRef } from './navigationRef';

// app.json declares scheme "eduosschool" but nothing wired it to React Navigation before — the OS
// would still launch the app for an eduosschool:// URL, but React Navigation had no linking config
// to interpret the path, so it silently landed on whatever screen the app happened to already be
// on. No screen-by-screen `config` map here: nothing in this app currently generates a path-based
// deep link (password-reset/verification emails point at the web app's FRONTEND_URL, not this
// scheme — see user.controllers.js's buildClientUrl) — the one real deep-link need, routing a
// tapped push notification to the Notifications screen, is handled separately in
// usePushRegistration.js via the navigationRef below, not through this `linking` prop. This just
// registers the app's own scheme/dev-client prefix so `Linking`/cold-start via that scheme is
// actually connected to the navigator instead of a declared-but-dead config.
const linking = { prefixes: [Linking.createURL('/'), 'eduosschool://'] };

export function RootNavigator() {
  const dispatch = useDispatch();
  const { isBooting, isAuthenticated } = useAuth();
  const { navigationTheme } = useAppTheme();

  useEffect(() => {
    dispatch(bootstrapSession());
  }, [dispatch]);

  usePushRegistration();

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
      {isBooting ? <SplashScreen /> : isAuthenticated ? <AppShell /> : <AuthStack />}
    </NavigationContainer>
  );
}
