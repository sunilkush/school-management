import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { screenForModule, SELF_HEADERED_KEYS } from './screenForModule';
import { MoreMenuScreen } from '../screens/MoreMenuScreen';
import { useHeaderScreenOptions } from './headerOptions';
import { useAppTheme } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();
const BAR_CONTENT_HEIGHT = 60;

function TabIcon({ icon, focused, color, size }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 8 }}>
      {focused && (
        <View style={{ position: 'absolute', top: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
      )}
      <View
        style={{
          width: size + 16,
          height: size + 8,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? `${color}15` : 'transparent',
        }}
      >
        <MaterialCommunityIcons name={icon} color={color} size={size} />
      </View>
    </View>
  );
}

// A dedicated render function (rather than relying on the navigator's default label) so every
// tab's name always fits on one line and ellipsizes instead of overflowing into a neighboring
// tab or off the edge of the screen when 5 tabs share a narrow phone width.
function TabLabel({ label, color, focused }) {
  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={{ fontSize: 10.5, fontWeight: focused ? '700' : '600', color, marginTop: 3, textAlign: 'center', width: '100%' }}
    >
      {label}
    </Text>
  );
}

/** Bottom-tab shell for every role — at most 4 curated quick tabs + a 5th "More" tab for anything
 * that doesn't fit, mirroring the web app's own mobile nav (frontend/src/components/mobile/
 * BottomNav.jsx: always a bottom bar, never a side drawer). Active-state pill background + dot
 * indicator also mirrors that same component's `.bn-icon-wrap` / `.bn-active-dot`. */
export function TabShell({ quickItems, moreItems = [] }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerOptions = useHeaderScreenOptions();

  return (
    <Tab.Navigator
      screenOptions={{
        ...headerOptions,
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 4,
        },
        tabBarItemStyle: { paddingHorizontal: 2 },
      }}
    >
      {quickItems.map((item) => (
        <Tab.Screen
          key={item.key}
          name={item.key}
          component={screenForModule(item)}
          initialParams={{ label: item.label, icon: item.icon, actions: item.actions }}
          options={{
            title: item.label,
            headerShown: !SELF_HEADERED_KEYS.has(item.key),
            tabBarIcon: ({ focused, color, size }) => <TabIcon icon={item.icon} focused={focused} color={color} size={size} />,
            tabBarLabel: ({ focused, color }) => <TabLabel label={item.label} color={color} focused={focused} />,
          }}
        />
      ))}

      {moreItems.length > 0 && (
        <Tab.Screen
          name="More"
          component={MoreMenuScreen}
          initialParams={{ items: moreItems }}
          options={{
            title: 'More',
            headerShown: false, // MoreMenuScreen renders its own nested-stack headers
            tabBarIcon: ({ focused, color, size }) => <TabIcon icon="dots-horizontal" focused={focused} color={color} size={size} />,
            tabBarLabel: ({ focused, color }) => <TabLabel label="More" color={color} focused={focused} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}
