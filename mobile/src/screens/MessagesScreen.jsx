import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ui/ScreenContainer';
import { MessagesInbox } from './messages/MessagesInbox';
import { MessageThreadScreen } from './messages/MessageThreadScreen';
import { ComposeMessageScreen } from './messages/ComposeMessageScreen';
import { useAppHeaderOptions } from '../navigation/headerOptions';

function MessagesInboxScreen({ navigation }) {
  return (
    <ScreenContainer scrollable>
      <MessagesInbox navigation={navigation} />
    </ScreenContainer>
  );
}

const Stack = createNativeStackNavigator();

// Nested stack (Inbox → Thread / Compose) — see SELF_HEADERED_KEYS in screenForModule.js.
export function MessagesScreen() {
  const headerOptions = useAppHeaderOptions();

  return (
    <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
      <Stack.Screen name="MessagesInbox" component={MessagesInboxScreen} options={{ title: 'Messages' }} />
      <Stack.Screen
        name="MessageThread"
        component={MessageThreadScreen}
        options={({ route }) => ({ title: route.params?.subject ?? 'Message' })}
      />
      <Stack.Screen name="ComposeMessage" component={ComposeMessageScreen} options={{ title: 'New Message' }} />
    </Stack.Navigator>
  );
}
