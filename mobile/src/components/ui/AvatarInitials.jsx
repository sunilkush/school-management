import React from 'react';
import { View, Text } from 'react-native';
import { avatarColorFor } from '../../theme/patterns';

/** Circular initials avatar with the web app's pastel-bg/saturated-ink palette, keyed by name. */
export function AvatarInitials({ name = '', size = 40 }) {
  const { bg, color } = avatarColorFor(name);
  const initials = (name || '?').trim().slice(0, 2).toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        borderWidth: 2,
        borderColor: `${color}30`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontWeight: '700', fontSize: Math.round(size * 0.38) }}>{initials}</Text>
    </View>
  );
}
