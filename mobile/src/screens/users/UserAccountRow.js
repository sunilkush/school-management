import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AccentListCard } from '../../components/ui/AccentListCard';
import { AvatarInitials } from '../../components/ui/AvatarInitials';
import { pillStyle, STATUS_SEMANTICS } from '../../theme/patterns';
import { roleColor } from '../../utils/roleColors';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useActivateUserAccountMutation, useDeactivateUserAccountMutation } from '../../store/api/apiSlice';

export function UserAccountRow({ user }) {
  const { typography } = useAppTheme();
  const [activateUser, activateState] = useActivateUserAccountMutation();
  const [deactivateUser, deactivateState] = useDeactivateUserAccountMutation();
  const roleTint = roleColor(user.role?.name);

  return (
    <AccentListCard
      accent={user.isActive ? STATUS_SEMANTICS.active.dot : STATUS_SEMANTICS.inactive.dot}
      avatar={<AvatarInitials name={user.name} size={40} />}
      title={user.name || 'Unnamed'}
      subtitle={user.email}
      badge={
        <View style={pillStyle(roleTint)}>
          <Text style={[typography.caption, { color: roleTint, fontWeight: '700', fontSize: 10.5 }]}>{user.role?.name}</Text>
        </View>
      }
      meta={[{ label: 'School', value: user.school?.name }]}
      expandable
      actions={
        user.isActive ? (
          <Button
            mode="outlined"
            compact
            textColor="#EF4444"
            loading={deactivateState.isLoading}
            disabled={deactivateState.isLoading}
            onPress={() => deactivateUser(user._id)}
          >
            Deactivate
          </Button>
        ) : (
          <Button
            mode="contained"
            compact
            loading={activateState.isLoading}
            disabled={activateState.isLoading}
            onPress={() => activateUser(user._id)}
          >
            Activate
          </Button>
        )
      }
    />
  );
}
