import { useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { useOnboarding, type OnboardingFields } from '@/core/onboarding/store';
import { useTaste } from '@/core/taste/store';
import type { Tag } from '@/core/taste/tags';

/**
 * Onboarding → taste vocabulary mapping (SPEC.md §8). Applied here, at the
 * terminal step, rather than per-screen — keeps the raw onboarding choices
 * (which don't need to know about `core/taste`) decoupled until the very
 * end, and lets us build one deltas object from the whole session.
 *
 * Some raw choices don't map cleanly onto the existing TAGS vocabulary and
 * are intentionally left unmapped (documented inline below) rather than
 * forcing a bad fit:
 *  - energy: "active" and "exploring" have no clean single-tag analog.
 *  - budget: "comfortable" (the middle tier) has no tag — only the two
 *    extremes (cheap/splurge) exist in TAGS.
 *  - dietary notes are food-restriction metadata, not taste-vibe tags —
 *    intentionally not mapped into TAGS at all.
 */
const ENERGY_TAGS: Partial<Record<string, Tag[]>> = {
  chill: ['quiet', 'comfy'],
  loud: ['lively'],
  artsy: ['moody', 'photo'],
  foodie: ['food'],
};

const INTEREST_TAGS: Partial<Record<string, Tag[]>> = {
  'live-music': ['lively'],
  'cocktail-bars': ['drinks'],
  'trivia-games': ['group'],
  dancing: ['lively'],
  comedy: ['group'],
  'dive-bars': ['cheap', 'drinks'],
  galleries: ['quiet', 'photo'],
  outdoors: ['bright'],
  'late-night-eats': ['food', 'quick'],
};

const BUDGET_TAGS: Partial<Record<string, Tag[]>> = {
  cheap: ['cheap'],
  splurge: ['splurge'],
};

function buildTasteDeltas(fields: Pick<OnboardingFields, 'energy' | 'interests' | 'budget'>) {
  const deltas: Partial<Record<Tag, number>> = {};
  const bump = (tag: Tag, amount: number) => {
    deltas[tag] = (deltas[tag] ?? 0) + amount;
  };
  for (const id of fields.energy) for (const t of ENERGY_TAGS[id] ?? []) bump(t, 0.5);
  for (const id of fields.interests) for (const t of INTEREST_TAGS[id] ?? []) bump(t, 0.35);
  for (const t of BUDGET_TAGS[fields.budget] ?? []) bump(t, 0.5);
  return deltas;
}

export default function ObAccountScreen() {
  const router = useRouter();
  const onboarding = useOnboarding();
  const markComplete = useOnboarding((s) => s.markComplete);
  const reinforce = useTaste((s) => s.reinforce);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const finish = () => {
    reinforce(
      buildTasteDeltas({
        energy: onboarding.energy,
        interests: onboarding.interests,
        budget: onboarding.budget,
      }),
    );
    markComplete();
    router.replace('/home' as never);
  };

  return (
    <Screen contentStyle={styles.content}>
      <OnboardingHeader onBack={() => router.back()} />

      <View style={styles.body}>
        <Kicker accent style={styles.kicker}>
          Lock it in
        </Kicker>
        <Text variant="display" style={styles.headline}>
          Save your profile.
        </Text>
        <Text variant="body" color={colors.ink60} style={styles.sub}>
          So your taste sticks around next time.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.ink40}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.ink40}
          secureTextEntry
          style={styles.input}
        />

        <PillButton label="Create account" variant="solid" onPress={finish} style={styles.cta} />

        <View style={styles.divider}>
          <Text variant="body" size={12} color={colors.ink45}>
            or continue with
          </Text>
        </View>

        <Pressable onPress={finish} style={styles.altBtn}>
          <Text variant="bodyMedium" size={14}>
            Continue with Google
          </Text>
        </Pressable>
        <Pressable onPress={finish} style={styles.altBtn}>
          <Text variant="bodyMedium" size={14}>
            Continue with Phone
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  body: { paddingTop: spacing.xl },
  kicker: { marginBottom: spacing.sm },
  headline: { marginBottom: spacing.sm },
  sub: { marginBottom: spacing.xl },
  input: {
    borderWidth: 1.5,
    borderColor: colors.ink14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  cta: { marginTop: spacing.sm },
  divider: { alignItems: 'center', marginVertical: spacing.xl },
  altBtn: {
    borderWidth: 1.5,
    borderColor: colors.ink14,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
