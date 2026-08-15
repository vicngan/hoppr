import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

/**
 * Plan-Together wizard stack (8 steps, see SPEC.md §4 and SCREEN_MAP.md).
 * Matches the root layout's default screenOptions (headerShown: false,
 * slide_from_right) — see src/app/_layout.tsx, which this file does not
 * modify (integration-owner only).
 */
export default function PlanLayout() {
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
