import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

/**
 * Onboarding stack. Matches the root layout's default screenOptions
 * (headerShown: false, slide_from_right) — see src/app/_layout.tsx, which
 * this file does not modify (integration-owner only).
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
        animation: 'slide_from_right',
      }}
    />
  );
}
