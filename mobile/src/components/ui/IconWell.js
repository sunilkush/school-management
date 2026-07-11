import React from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { iconWellStyle } from '../../theme/patterns';

/** Rounded-square tinted icon badge — mirrors the web app's iconWell() pattern. */
export function IconWell({ icon, color, size = 36, iconSize }) {
  return (
    <View style={iconWellStyle(color, size)}>
      <MaterialCommunityIcons name={icon} size={iconSize ?? Math.round(size * 0.5)} color={color} />
    </View>
  );
}
