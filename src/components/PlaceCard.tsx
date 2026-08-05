import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StripePlaceholder, MatchBadge, Text } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { CATEGORY_LABEL } from '@/core/places';
import { fmtDistance } from '@/core/discovery';
import type { RankedPlace } from '@/core/engine';

/** Build the mono meta line, e.g. "Cafe · Kerrytown · 0.4 mi". */
export function placeMeta(rp: RankedPlace): string {
  return [CATEGORY_LABEL[rp.place.category], rp.place.area, fmtDistance(rp.distanceMi)]
    .filter(Boolean)
    .join(' · ');
}

/** The 158px tappable card used in Discover's horizontal rows. */
export function PlaceCard({ rp }: { rp: RankedPlace }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/place/${rp.place.id}`)}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.92 : 1 }]}>
      <StripePlaceholder width={158} height={158} radius={14}>
        <View style={styles.badge}>
          <MatchBadge value={`${rp.match}%`} />
        </View>
        <View style={styles.caption}>
          <Text variant="kicker" size={9} color={colors.ink40}>
            photo — visitor upload
          </Text>
        </View>
      </StripePlaceholder>
      <Text variant="bodyMedium" size={14} style={styles.name} numberOfLines={1}>
        {rp.place.name}
      </Text>
      <Text variant="kicker" size={9} color={colors.ink45} style={styles.meta} numberOfLines={1}>
        {placeMeta(rp)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 158 },
  badge: { position: 'absolute', top: 9, right: 9 },
  caption: { position: 'absolute', left: 10, bottom: 10 },
  name: { marginTop: 9 },
  meta: { marginTop: 5 },
});
