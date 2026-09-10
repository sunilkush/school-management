import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { lightColors, spacing, radii, typography } from '../theme/tokens';

// Sits above everything in App.jsx (including the Redux/theme providers) so it can catch a render
// error anywhere in the tree — a class component, not a hook, since React only supports error
// boundaries via getDerivedStateFromError/componentDidCatch. Deliberately styled from the static
// token values rather than useAppTheme(), since a boundary this high in the tree must still render
// something sane even if the thing that crashed was the theme provider itself.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, info?.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            An unexpected error occurred. Try again, or restart the app if the problem persists.
          </Text>
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightColors.background,
    padding: spacing.xl,
  },
  card: {
    maxWidth: 420,
    width: '100%',
    alignItems: 'center',
    backgroundColor: lightColors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: lightColors.border,
    padding: spacing.xxl,
  },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  title: { ...typography.h3, color: lightColors.text, marginBottom: spacing.sm, textAlign: 'center' },
  message: {
    ...typography.body,
    color: lightColors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: lightColors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  buttonText: { ...typography.bodyStrong, color: lightColors.textOnPrimary },
});

export default ErrorBoundary;
