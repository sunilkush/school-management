import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { List } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { screenForModule, SELF_HEADERED_KEYS } from '../navigation/screenForModule';
import { useAppHeaderOptions } from '../navigation/headerOptions';

function MoreMenuList({ route, navigation }) {
  const items = route.params?.items ?? [];

  return (
    <ScreenContainer>
      {items.map((item) => (
        <List.Item
          key={item.key}
          title={item.label}
          left={(props) => <List.Icon {...props} icon={item.icon} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate(item.key)}
        />
      ))}
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

/** Overflow bucket for nav destinations beyond the 4 quick bottom tabs — a list that pushes to
 * the real module screen, same nested-stack shape as Profile/Students (see SELF_HEADERED_KEYS). */
export function MoreMenuScreen({ route }) {
  const items = route.params?.items ?? [];
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="MoreMenuList" component={MoreMenuList} initialParams={{ items }} options={{ title: 'More' }} />
      {items.map((item) => (
        <Stack.Screen
          key={item.key}
          name={item.key}
          component={screenForModule(item)}
          initialParams={{ label: item.label, icon: item.icon, actions: item.actions }}
          options={{ title: item.label, headerShown: !SELF_HEADERED_KEYS.has(item.key) }}
        />
      ))}
    </Stack.Navigator>
  );
}
