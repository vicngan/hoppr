import { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { BackButton } from '@/components/BackButton';
import { colors, radius, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';
import { usePlace } from '@/core/places-store';
import { useLibrary, selectRating } from '@/core/library/store';

const SPEC_QS: { label: string; options: string[] }[] = [
  { label: 'Noise', options: ['Quiet', 'Medium', 'Loud'] },
  { label: 'Crowd', options: ['Empty', 'Half full', 'Packed'] },
  { label: 'Outlets', options: ['Plenty', 'A few', 'None'] },
  { label: 'Lighting', options: ['Bright', 'Warm', 'Dim'] },
];

const STAR_NOTES = ['', 'Not for me', 'It was fine', 'Solid', 'Really good', 'Would send a friend'];

/** Rate a place + tag the specs. Persists to the library and teaches the taste profile. */
export default function RateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const place = usePlace(id);
  const existing = useLibrary(selectRating(id ?? ''));
  const rate = useLibrary((s) => s.rate);

  const [stars, setStars] = useState(existing?.stars ?? 0);
  const [picks, setPicks] = useState<Record<string, string>>(existing?.specs ?? {});
  const [note, setNote] = useState(existing?.note ?? '');

  const submit = () => {
    if (!place || stars === 0) return;
    rate(place, stars, picks, note.trim() || undefined);
    if (router.canGoBack()) router.back();
    else router.replace('/explore');
  };

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
                  onPress={() =>
                    setPicks((p) => (p[q.label] === o ? omit(p, q.label) : { ...p, [q.label]: o }))
                  }
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      <Kicker style={{ marginTop: 26, marginBottom: 12 }}>Anything worth telling someone?</Kicker>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Sit at the back-left table, it has two outlets…"
        placeholderTextColor={colors.ink40}
        multiline
        style={styles.note}
      />

      <PillButton
        label={stars === 0 ? 'Pick a rating first' : existing ? 'Update rating' : 'Post rating'}
        variant="solid"
        style={{ marginTop: spacing.xl, opacity: stars === 0 ? 0.5 : 1 }}
        onPress={submit}
      />
    </Screen>
  );
}

function omit<T extends Record<string, string>>(obj: T, key: string): Record<string, string> {
  const next = { ...obj };
  delete next[key];
  return next;
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
  starGlyph: { fontFamily: fonts.monoMedium },
  optRow: { flexDirection: 'row', gap: 6 },
  note: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ink14,
    borderRadius: radius.md,
    padding: 15,
    minHeight: 90,
    textAlignVertical: 'top',
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink,
  },
});
