import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { List } from 'react-native-paper';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { useAppTheme } from '../theme/ThemeProvider';
import { screenForModule, isSelfHeadered } from '../navigation/screenForModule';
import { useAppHeaderOptions } from '../navigation/headerOptions';

/** Accordion-style overflow list — a group expands in place to reveal its own destinations
 * (tap again to collapse) instead of pushing to a whole separate screen just to browse one level
 * deeper. A flat (non-group) item still navigates straight to its real screen. Tapping an item
 * inside an expanded group still routes through that group's own registered Stack.Screen
 * (`group:X`, declared below) with `{ screen: child.key }` — the same params shape
 * navigateToNavItem.js already uses for deep-linking (e.g. the header bell into "Notifications"),
 * so GroupMenuScreen's own initialRouteName fix opens straight on that child instead of its list. */
function MoreMenuList({ route, navigation }) {
  const { colors, typography } = useAppTheme();
  const items = route.params?.items ?? [];

  return (
    <ScreenContainer scrollable>
      <List.Section>
        {items.map((item) =>
          item.isGroup ? (
            <List.Accordion
              key={item.key}
              title={item.title}
              titleStyle={[typography.bodyStrong, { color: colors.text }]}
              left={(props) => <List.Icon {...props} icon={item.icon} color={colors.primary} />}
            >
              {item.children.map((child) => (
                <List.Item
                  key={child.key}
                  title={child.label}
                  titleStyle={[typography.body, { color: colors.text }]}
                  left={(props) => <List.Icon {...props} icon={child.icon} color={colors.textMuted} />}
                  style={{ paddingLeft: 24 }}
                  onPress={() => navigation.navigate(item.key, { screen: child.key })}
                />
              ))}
            </List.Accordion>
          ) : (
            <List.Item
              key={item.key}
              title={item.label}
              titleStyle={[typography.bodyStrong, { color: colors.text }]}
              left={(props) => <List.Icon {...props} icon={item.icon} color={colors.primary} />}
              onPress={() => navigation.navigate(item.key)}
            />
          )
        )}
      </List.Section>
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

/** Overflow bucket for nav destinations beyond the 4 quick bottom tabs — a list that pushes to
 * the real module screen, or (for a group) expands in place before pushing into that group's own
 * submenu stack. Same nested-stack shape as Profile/Students (see isSelfHeadered in
 * screenForModule.js) — every group and flat item still gets its own registered Stack.Screen here
 * so direct deep-links (navigateToNavItem.js) keep working exactly as before; only the list's own
 * browsing UI changed from "tap group → new screen" to "tap group → expands inline". */
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
          initialParams={item.isGroup ? { items: item.children, title: item.title } : { label: item.label, icon: item.icon, actions: item.actions }}
          options={{ title: item.isGroup ? item.title : item.label, headerShown: !isSelfHeadered(item) }}
        />
      ))}
    </Stack.Navigator>
  );
}
