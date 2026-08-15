import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { useOnboarding } from '@/core/onboarding/store';

/** Static seed cards for the genuine like/pass sequence — no live ranking engine. */
const CARDS = [
  {
    id: 'card-1',
    name: 'Marrow',
    tagline: 'Low-lit natural wine bar with a short, changing menu',
    tags: ['moody', 'drinks', 'lingering'],
  },
  {
    id: 'card-2',
    name: 'The Rooftop at Blue Hour',
    tagline: 'Open-air lounge, skyline views, DJ after 10',
    tags: ['lively', 'bright', 'group'],
  },
  {
    id: 'card-3',
    name: 'Fern & Co.',
    tagline: 'Plant-filled café that turns into a listening bar at night',
    tags: ['quiet', 'coffee', 'photo'],
  },
];

export default function ObTasteScreen() {
  const router = useRouter();
  const tasteSwipes = useOnboarding((s) => s.tasteSwipes);
  const setField = useOnboarding((s) => s.setField);
  const [index, setIndex] = useState(0);

  const card = CARDS[index];

  const swipe = (liked: boolean) => {
    setField('tasteSwipes', [...tasteSwipes, { cardId: card.id, liked }]);
    if (index + 1 >= CARDS.length) {
      router.push('/onboarding/ob-photo' as never);
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <OnboardingHeader eyebrow="ONE LAST THING" />

      <View style={styles.header}>
        <Text variant="display" size={30} center style={styles.headline}>
          Swipe on a few, so we click faster.
        </Text>
        <Text variant="body" size={13} color={colors.ink55} center style={styles.sub}>
          Left to pass, right to save. This is how you&apos;ll pick every night.
        </Text>
      </View>

      <View style={styles.body}>
        <Card style={styles.card}>
          <View style={styles.photoMock} />
          <Text variant="serif" size={22} style={styles.name}>
            {card.name}
          </Text>
          <Text variant="body" color={colors.ink60} style={styles.tagline}>
            {card.tagline}
          </Text>
          <View style={styles.tagRow}>
            {card.tags.map((t) => (
              <View key={t} style={styles.tagChip}>
                <Text variant="kicker" size={10}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.actions}>
          <Pressable
            onPress={() => swipe(false)}
            style={({ pressed }) => [styles.actionBtn, styles.pass, pressed && { opacity: 0.8 }]}>
            <Text variant="bodyMedium" size={20} color={colors.ink}>
              ✕
            </Text>
          </Pressable>
          <Pressable
            onPress={() => swipe(true)}
            style={({ pressed }) => [styles.actionBtn, styles.like, pressed && { opacity: 0.8 }]}>
            <Text variant="bodyMedium" size={20} color={colors.onDark}>
              ♥
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  header: { paddingTop: spacing.lg },
  headline: { marginBottom: spacing.xs },
  sub: { marginBottom: 0 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%' },
  photoMock: {
    height: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.fill,
    marginBottom: spacing.lg,
  },
  name: { marginBottom: spacing.xs },
  tagline: { marginBottom: spacing.md },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tagChip: {
    backgroundColor: colors.fill,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xxl },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pass: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.ink14 },
  like: { backgroundColor: colors.accent },
});
