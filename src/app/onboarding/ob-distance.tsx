import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { ChoiceRow } from '@/components/onboarding/ChoiceRow';
import { useOnboarding } from '@/core/onboarding/store';

const OPTIONS = [
  { id: 'walkable', label: 'Walkable', ring: 0.3 },
  { id: 'short-ride', label: 'Short ride', ring: 0.6 },
  { id: 'anywhere', label: 'Anywhere', ring: 1 },
];

export default function ObDistanceScreen() {
  const router = useRouter();
  const distance = useOnboarding((s) => s.distance);
  const setField = useOnboarding((s) => s.setField);

  const choose = (id: string) => setField('distance', id);
  const active = OPTIONS.find((o) => o.id === distance) ?? OPTIONS[1];

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <OnboardingHeader progress={1} stepLabel="STEP 8 OF 8" onBack={() => router.back()} />

        <View style={styles.body}>
          <Text variant="display" style={styles.headline}>
            How far will you go?
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.sub}>
            We&apos;ll keep suggestions in this range by default.
          </Text>

          <View style={styles.mapMock}>
            <View
              style={[
                styles.ring,
                { width: 200 * active.ring, height: 200 * active.ring, borderRadius: 100 * active.ring },
              ]}
            />
            <View style={styles.pin} />
          </View>

          <View style={styles.list}>
            {OPTIONS.map((opt) => (
              <ChoiceRow
                key={opt.id}
                label={opt.label}
                selected={distance === opt.id}
                onPress={() => choose(opt.id)}
              />
            ))}
          </View>
        </View>
      </View>

      <PillButton
        label="Continue"
        variant="solid"
        onPress={() => router.push('/onboarding/ob-taste' as never)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  top: {},
  body: { paddingTop: spacing.lg },
  headline: { marginBottom: spacing.sm },
  sub: { marginBottom: spacing.xl },
  mapMock: {
    height: 180,
    borderRadius: radius.xl,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  ring: { borderWidth: 1.5, borderColor: colors.accent, position: 'absolute' },
  pin: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.mapPin },
  list: { gap: spacing.md },
});
