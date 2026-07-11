import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Divider, List, SegmentedButtons, Text } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { AvatarInitials } from '../components/ui/AvatarInitials';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../theme/ThemeProvider';
import { setThemeMode } from '../store/slices/uiSlice';
import { useHeaderScreenOptions } from '../navigation/headerOptions';
import { SettingsScreen } from './SettingsScreen';

function ProfileMain({ navigation }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { user, role, signOut, status } = useAuth();
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.ui.themeMode);

  return (
    <ScreenContainer scrollable>
      <View style={{ alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl }}>
        <AvatarInitials name={user?.name} size={72} />
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.md }]}>{user?.name}</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{user?.email}</Text>
        <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>{role?.name}</Text>
      </View>

      <Divider />

      <View style={{ marginTop: spacing.xl }}>
        <Text style={[typography.bodyStrong, { color: colors.text, marginBottom: spacing.sm }]}>Appearance</Text>
        <SegmentedButtons
          value={themeMode}
          onValueChange={(value) => dispatch(setThemeMode(value))}
          buttons={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </View>

      <List.Item
        title="Settings"
        description="Notifications, password, app info"
        left={(props) => <List.Icon {...props} icon="cog-outline" />}
        right={(props) => <List.Icon {...props} icon="chevron-right" />}
        onPress={() => navigation.navigate('Settings')}
        style={{ marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: radii.md }}
      />

      <Button mode="outlined" onPress={signOut} loading={status === 'loading'} style={{ marginTop: spacing.xxl }}>
        Sign Out
      </Button>
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

// Nested stack (Profile → Settings) — see SELF_HEADERED_KEYS in screenForModule.js.
export function ProfileScreen() {
  const headerOptions = useHeaderScreenOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="ProfileMain" component={ProfileMain} options={{ title: 'Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
