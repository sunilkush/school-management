import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeProvider';

/**
 * Direct port of the web app's MobileCard (frontend/src/components/mobile/MobileCard.jsx) — its
 * designated replacement for a table row on small screens. Left accent border, avatar/title/
 * subtitle/badge header, an optional expandable meta grid, and an actions footer.
 */
export function AccentListCard({
  avatar,
  title,
  subtitle,
  badge,
  meta = [],
  actions,
  expandable = false,
  accent,
  onPress,
  style,
}) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const [open, setOpen] = useState(!expandable);
  const accentColor = accent || colors.primary;

  const Header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}>
      {avatar}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        {badge}
        {expandable && (
          <MaterialCommunityIcons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        )}
      </View>
    </View>
  );

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderLeftWidth: 3,
          borderLeftColor: accentColor,
          borderRadius: radii.lg,
          overflow: 'hidden',
          marginBottom: spacing.sm,
        },
        style,
      ]}
    >
      {expandable || onPress ? (
        <Pressable onPress={expandable ? () => setOpen((v) => !v) : onPress} android_ripple={{ color: colors.surfaceSoft }}>
          {Header}
        </Pressable>
      ) : (
        Header
      )}

      {open && meta.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            backgroundColor: colors.surfaceSoft,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            padding: spacing.md,
            gap: spacing.md,
          }}
        >
          {meta.map((item) => (
            <View key={item.label} style={{ minWidth: '40%' }}>
              <Text style={[typography.caption, { color: colors.textMuted, fontSize: 10, letterSpacing: 0.5 }]}>
                {item.label.toUpperCase()}
              </Text>
              <Text style={[typography.bodyStrong, { color: colors.text, marginTop: 2 }]} numberOfLines={1}>
                {item.value ?? '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {actions ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {actions}
        </View>
      ) : null}
    </View>
  );
}
