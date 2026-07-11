import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeProvider';

// Past this width (tablets, foldables, split-screen), letting content stretch edge-to-edge makes
// stat-grid cards oversized and body text lines too long to read comfortably — center a column
// instead of adding tablet-specific layouts per screen.
const WIDE_BREAKPOINT = 720;
const WIDE_CONTENT_MAX_WIDTH = 640;

/** Shared page frame: safe area + theme background + optional scroll + keyboard avoidance for forms.
 * Defaults to reserving only the bottom inset — nearly every screen renders under a React
 * Navigation header, which already accounts for the top status-bar area itself, so also reserving
 * a top inset here double-pads it and shows as a dead gap between the header and the content.
 * Pass `edges={['top', 'bottom']}` explicitly for the rare screen with no header (e.g. Login). */
export function ScreenContainer({ children, scrollable = false, style, edges = ['bottom'] }) {
  const { colors, spacing } = useAppTheme();
  const { width } = useWindowDimensions();
  const wideStyle = width >= WIDE_BREAKPOINT ? { maxWidth: WIDE_CONTENT_MAX_WIDTH, alignSelf: 'center', width: '100%' } : null;
  const Content = scrollable ? ScrollView : View;
  // Scrollable screens get extra bottom clearance beyond the flat spacing.lg gutter — the bottom
  // tab bar is a sibling rendered by React Navigation, not something this content area's own
  // SafeAreaView inset accounts for, so the last card/button needs its own breathing room above it.
  const contentProps = scrollable
    ? { contentContainerStyle: [styles.content, { padding: spacing.lg, paddingBottom: spacing.xxl }, wideStyle, style], keyboardShouldPersistTaps: 'handled' }
    : { style: [styles.content, { padding: spacing.lg }, wideStyle, style] };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Content {...contentProps}>{children}</Content>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
});
