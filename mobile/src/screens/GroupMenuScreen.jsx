import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { List } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { screenForModule, isSelfHeadered } from '../navigation/screenForModule';
import { useAppHeaderOptions } from '../navigation/headerOptions';

function GroupMenuList({ route, navigation }) {
  const items = route.params?.items ?? [];

  return (
    <ScreenContainer scrollable>
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

/**
 * Generic "submenu" screen for a nav group (e.g. Super Admin's "Users", School Admin's
 * "Academics") — a list that pushes to each of that group's own destinations, exactly the same
 * shape as MoreMenuScreen.jsx one level up. One reusable component handles every group for every
 * role since each group's own children arrive via route.params, same as MoreMenuScreen's items do.
 */
export function GroupMenuScreen({ route }) {
  const children = route.params?.items ?? [];
  const title = route.params?.title ?? 'Menu';
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="GroupMenuList" component={GroupMenuList} initialParams={{ items: children }} options={{ title }} />
      {children.map((item) => (
        <Stack.Screen
          key={item.key}
          name={item.key}
          component={screenForModule(item)}
          initialParams={{ label: item.label, icon: item.icon, actions: item.actions }}
          options={{ title: item.label, headerShown: !isSelfHeadered(item) }}
        />
      ))}
    </Stack.Navigator>
  );
}
