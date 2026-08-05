import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { BackButton } from '@/components/BackButton';
import { colors, radius, spacing } from '@/theme/tokens';
import { findPlaceById } from '@/core/places';

const SPEC_QS: { label: string; options: string[] }[] = [
  { label: 'Noise', options: ['Quiet', 'Medium', 'Loud'] },
  { label: 'Crowd', options: ['Empty', 'Half full', 'Packed'] },
  { label: 'Outlets', options: ['Plenty', 'A few', 'None'] },
  { label: 'Lighting', options: ['Bright', 'Warm', 'Dim'] },
];

const STAR_NOTES = ['', 'Not for me', 'It was fine', 'Solid', 'Really good', 'Would send a friend'];

/** Rate a place + tag the specs. Slice 2 persists this and feeds the profile. */
export default function RateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const place = findPlaceById(id);
  const [stars, setStars] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});

  return (
    <Screen contentStyle={{ paddingTop: 60 }}>
      <BackButton style={{ marginBottom: 18 }} />
      <Kicker style={{ marginBottom: 10 }}>{place?.name ?? 'This place'}</Kicker>
      <Text variant="display" size={26} style={{ marginBottom: 22 }}>
        How was it, really?
      </Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= stars;
          return (
            <Pressable key={n} onPress={() => setStars(n)} style={[styles.star, on && styles.starOn]}>
              <Text variant="bodyMedium" size={14} color={on ? colors.onDark : colors.ink45} style={styles.starGlyph}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="body" size={13} color={colors.ink50} style={{ marginBottom: 26 }}>
        {STAR_NOTES[stars] || 'Tap to rate'}
      </Text>

      <Kicker style={{ marginBottom: 14 }}>The specs — what was it like today?</Kicker>
      <View style={{ gap: 18 }}>
        {SPEC_QS.map((q) => (
          <View key={q.label}>
            <Text variant="bodyMedium" size={13} style={{ marginBottom: 9 }}>
              {q.label}
            </Text>
            <View style={styles.optRow}>
              {q.options.map((o) => (
                <PillButton
                  key={o}
                  label={o}
                  compact
                  selected={picks[q.label] === o}
                  style={{ flex: 1 }}
                  onPress={() => setPicks((p) => ({ ...p, [q.label]: o }))}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      <PillButton
        label="Post rating"
        variant="solid"
        style={{ marginTop: spacing.xxl }}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/discover'))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  star: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.ink20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  starGlyph: { fontFamily: 'JetBrainsMono_500Medium' },
  optRow: { flexDirection: 'row', gap: 6 },
});
