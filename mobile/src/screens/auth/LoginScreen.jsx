import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FormField } from '../../components/ui/FormField';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeProvider';
import { validateEmail, validatePassword } from '../../utils/validators';
import { APP_NAME } from '../../constants/config';

// Hero gradient and trust badges mirror the web app's split-screen login
// (frontend/src/components/forms/LoginForm.jsx .lf-left / .lf-trust-row), condensed into a single
// compact panel since a phone has no room for the desktop's two-column layout.
const HERO_GRADIENT = ['#0D1526', '#111827', '#0F1F33'];
const TRUST_BADGES = ['SSL Encrypted', '2FA Ready'];

export function LoginScreen({ navigation }) {
  const { colors, typography, spacing, radii } = useAppTheme();
  const { signIn, status, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [secure, setSecure] = useState(true);

  const submitting = status === 'loading';

  const handleSubmit = () => {
    const errors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(errors);
    if (errors.email || errors.password) return;
    signIn(email.trim(), password);
  };

  return (
    <ScreenContainer scrollable style={{ padding: 0 }} edges={['top', 'bottom']}>
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={styles.heroLogoWrap}>
          <Image source={require('../../../assets/icon.png')} style={styles.heroLogo} />
        </View>
        <View style={styles.platformBadge}>
          <MaterialCommunityIcons name="school-outline" size={12} color="#A5B4FC" />
          <Text style={styles.platformBadgeText}>All-in-One Platform</Text>
        </View>
        <Text style={styles.heroHeadline}>The smarter way to run your school</Text>
      </LinearGradient>

      <View style={{ padding: spacing.lg, marginTop: -28 }}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.xl }]}>
          <LinearGradient colors={[colors.primary, '#3B82F6', colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardStripe} />

          <View style={{ padding: spacing.lg }}>
            <View style={[styles.portalBadge, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={12} color={colors.primary} />
              <Text style={[styles.portalBadgeText, { color: colors.primary }]}>School Portal</Text>
            </View>
            <Text style={[typography.h1, { color: colors.text }]}>Welcome back</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
              Sign in to access {APP_NAME}
            </Text>

            <FormField
              testID="email-input"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={fieldErrors.email}
              disabled={submitting}
              left={<TextInput.Icon icon="email-outline" />}
            />
            <FormField
              testID="password-input"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
              autoCapitalize="none"
              autoComplete="password"
              error={fieldErrors.password}
              disabled={submitting}
              left={<TextInput.Icon icon="lock-outline" />}
              right={<TextInput.Icon icon={secure ? 'eye' : 'eye-off'} onPress={() => setSecure((s) => !s)} />}
            />

            {Boolean(error) && (
              <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight ?? `${colors.danger}15`, borderColor: colors.danger }]}>
                <Text style={{ fontSize: 15 }}>⚠</Text>
                <Text style={[typography.caption, { color: colors.danger, flex: 1 }]}>{error}</Text>
              </View>
            )}

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotLink}
              contentStyle={styles.forgotLinkContent}
              disabled={submitting}
            >
              Forgot password?
            </Button>

            <LinearGradient colors={[colors.primary, '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: radii.md, marginTop: spacing.md }}>
              <Button mode="contained" buttonColor="transparent" onPress={handleSubmit} loading={submitting} disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </LinearGradient>

            <View style={styles.trustRow}>
              {TRUST_BADGES.map((label) => (
                <View key={label} style={[styles.trustBadge, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="check-circle" size={10} color={colors.success} />
                  <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 10 }]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 64, paddingBottom: 56, paddingHorizontal: 24, alignItems: 'center' },
  heroLogoWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroLogo: { width: 56, height: 56, resizeMode: 'contain' },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99,102,241,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  platformBadgeText: { fontSize: 11, fontWeight: '600', color: '#A5B4FC', letterSpacing: 0.4 },
  heroHeadline: { fontSize: 20, fontWeight: '800', color: '#F1F5F9', textAlign: 'center', lineHeight: 26 },
  card: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6, overflow: 'hidden' },
  cardStripe: { height: 4, width: '100%' },
  portalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  portalBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: 8,
    padding: 11,
    marginBottom: 12,
  },
  forgotLink: { alignSelf: 'flex-end' },
  forgotLinkContent: { paddingHorizontal: 4 },
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 18, flexWrap: 'wrap' },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
});
