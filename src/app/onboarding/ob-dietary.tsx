import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { ChoicePill } from '@/components/onboarding/ChoicePill';
import { useOnboarding } from '@/core/onboarding/store';

const OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'sober-friendly', label: 'Sober-friendly' },
  { id: 'halal', label: 'Halal' },
  { id: 'craft-beer', label: 'Big craft beer person' },
];

export default function ObDietaryScreen() {
  const router = useRouter();
  const dietary = useOnboarding((s) => s.dietary);
  const setField = useOnboarding((s) => s.setField);

  const toggle = (id: string) => {
    setField('dietary', dietary.includes(id) ? dietary.filter((d) => d !== id) : [...dietary, id]);
  };

  const next = () => router.push('/onboarding/ob-distance' as never);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader progress={0.88} stepLabel="STEP 7 OF 8" onBack={() => router.back()} />

        <View style={styles.body}>
          <Text variant="display" style={styles.headline}>
            Any dietary notes?
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            Optional — helps us filter menus for you.
          </Text>

          <View style={styles.wrap}>
            {OPTIONS.map((opt) => (
              <ChoicePill
                key={opt.id}
                label={opt.label}
                selected={dietary.includes(opt.id)}
                onPress={() => toggle(opt.id)}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={next} hitSlop={8}>
          <Text variant="bodyMedium" size={14} color={colors.ink45}>
            Skip
          </Text>
        </Pressable>
        <PillButton label="Continue" variant="solid" onPress={next} style={styles.footerCta} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  top: {},
  body: { paddingTop: spacing.lg },
  headline: { marginBottom: spacing.sm },
  sub: { marginBottom: spacing.xl },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  footerCta: { flex: 1 },
});
