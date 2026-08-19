import { useState } from 'react';
import { Modal, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, Kicker, PillButton } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { CATEGORY_LABEL, type Place } from '@/core/places';
import type { PickTally } from '@/core/together';

type Props = {
  visible: boolean;
  /** best-first, from `pickTallies` — real deterministic match.ts scoring, never AI */
  tallies: PickTally[];
  places: Place[];
  onClose: () => void;
  onReserve: (placeId: string) => void;
};

/**
 * "Where's it gonna be?" reveal — visually in the same family as the Ask
 * flow's "surprise me" `SuggestionReveal` (top pick big, backups in a row),
 * but built on `PickTally`/`Place` data with a "Reserve a table" CTA baked
 * in, since this always hands off into the reserve step rather than just
 * linking out to a detail page.
 */
export function WhereItsGonnaBe({ visible, tallies, places, onClose, onReserve }: Props) {
  const [mainIndex, setMainIndex] = useState(0);
  const byId = new Map(places.map((p) => [p.id, p]));

  const ranked = tallies.map((t) => ({ tally: t, place: byId.get(t.placeId) })).filter((r) => !!r.place) as {
    tally: PickTally;
    place: Place;
  }[];

  const main = ranked[mainIndex] ?? ranked[0];
  const backups = ranked.filter((_, i) => i !== ranked.indexOf(main));

  if (!main) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.centerWrap}>
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.mainCard}>
            <PlaceImage coords={main.place.coords} photo={main.place.photo} width="100%" height={200} radius={0}>
              {main.tally.unanimous ? (
                <View style={styles.matchBadge}>
                  <Text variant="kicker" size={10} color={colors.onDark}>
                    Unanimous
                  </Text>
                </View>
              ) : (
                <View style={styles.matchBadge}>
                  <Text variant="kicker" size={10} color={colors.onDark}>
                    {main.tally.likes} like{main.tally.likes === 1 ? '' : 's'}
                  </Text>
                </View>
              )}
            </PlaceImage>
            <View style={styles.mainBody}>
              <Kicker accent size={10} style={{ marginBottom: 6 }}>
                Where it&apos;s gonna be
              </Kicker>
              <Text variant="serif" size={24}>
                {main.place.name}
              </Text>
              <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 6, marginBottom: 8 }}>
                {[CATEGORY_LABEL[main.place.category], main.place.area].filter(Boolean).join(' · ')}
              </Text>
              <Text variant="body" size={13} color={colors.ink72} numberOfLines={2}>
                {main.place.blurb}
              </Text>

              <PillButton
                label="Reserve a table"
                variant="solid"
                style={{ marginTop: spacing.lg }}
                onPress={() => onReserve(main.place.id)}
              />
            </View>
          </Pressable>

          {backups.length > 0 ? (
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.backupSection}>
              <Text variant="kicker" size={10} color="rgba(247,242,232,0.6)" style={styles.backupLabel}>
                OR MAYBE
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.backupRow}>
                {backups.map((r) => (
                  <Pressable
                    key={r.place.id}
                    onPress={() => setMainIndex(ranked.indexOf(r))}
                    style={styles.backupCard}>
                    <PlaceImage coords={r.place.coords} photo={r.place.photo} width="100%" height={72} radius={radius.md} />
                    <Text variant="bodyMedium" size={12} color={colors.onDark} style={{ marginTop: 6 }} numberOfLines={1}>
                      {r.place.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,17,13,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  centerWrap: { width: '100%', maxWidth: 360, alignItems: 'center' },
  mainCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20,17,13,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    margin: spacing.md,
  },
  mainBody: { padding: spacing.lg },
  backupSection: { width: '100%', marginTop: spacing.xl },
  backupLabel: { textAlign: 'center', marginBottom: spacing.sm, letterSpacing: 1 },
  backupRow: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  backupCard: { width: 96 },
});
