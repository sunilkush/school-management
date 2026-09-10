import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createListScreen } from '../screens/generic/ListScreen';
import { createDetailScreen } from '../screens/generic/DetailScreen';
import { createFormScreen } from '../screens/generic/FormSheet';
import { createActionScreen } from '../screens/generic/ActionSheet';
import { useAppHeaderOptions } from '../navigation/headerOptions';

const Stack = createNativeStackNavigator();

/**
 * Turns one descriptor into the component the navigator mounts.
 *
 * A list-only module is just its list screen. As soon as it has a detail view or a create form it
 * needs somewhere to push to, so it becomes its own small stack — which is why the returned
 * component reports `selfHeadered`, telling the outer Tab/More navigator not to draw a second
 * header on top of this one's.
 */
export function createModuleScreen(descriptor) {
  const ListScreen = createListScreen(descriptor);

  if (!descriptor.detail && !descriptor.create) {
    ListScreen.selfHeadered = false;
    return ListScreen;
  }

  const DetailScreen = descriptor.detail ? createDetailScreen(descriptor) : null;
  const FormScreen = descriptor.create ? createFormScreen(descriptor) : null;
  const hasInputAction = (descriptor.detail?.actions ?? []).some((action) => action.fields);
  const ActionScreen = hasInputAction ? createActionScreen(descriptor) : null;

  function ModuleStack() {
    const headerOptions = useAppHeaderOptions();

    return (
      <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
        <Stack.Screen
          name="ModuleList"
          component={ListScreen}
          options={{ title: descriptor.title }}
          initialParams={{ label: descriptor.title, icon: descriptor.icon }}
        />
        {DetailScreen ? (
          <Stack.Screen
            name="ModuleDetail"
            component={DetailScreen}
            options={({ route }) => ({ title: route.params?.title ?? descriptor.detail.title ?? 'Details' })}
            initialParams={{ icon: descriptor.icon }}
          />
        ) : null}
        {FormScreen ? (
          <Stack.Screen
            name="ModuleForm"
            component={FormScreen}
            options={{ title: descriptor.create.title ?? 'New' }}
            initialParams={{ icon: descriptor.icon }}
          />
        ) : null}
        {ActionScreen ? (
          <Stack.Screen
            name="ModuleAction"
            component={ActionScreen}
            options={({ route }) => ({ title: route.params?.title ?? 'Confirm' })}
            initialParams={{ icon: descriptor.icon }}
          />
        ) : null}
      </Stack.Navigator>
    );
  }

  ModuleStack.selfHeadered = true;
  return ModuleStack;
}
