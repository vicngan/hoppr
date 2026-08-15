import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Kicker } from '@/components/ui';
import { PlaceCard, placeMeta } from '@/components/PlaceCard';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, radius, spacing } from '@/theme/tokens';
import type { RankedPlace } from '@/core/engine';

type Props = {
  ranked: RankedPlace[];
  expanded: boolean;
  onToggle: () => void;
};

/**
 * Fake-map + draggable-feeling bottom sheet for explore's map modes. No real
 * MapView library is wired into this codebase (see `src/core/maps.ts` — it
 * only produces Google Static Maps URLs for place photos, no interactive map
 * component/dependency). Rather than adding a new map dependency in this
 * pass, the "map" behind the sheet is a static grid-pattern placeholder
 * matching the design's own fake-map treatment; a real MapView is an
 * explicit out-of-scope item for a later pass.
 */
export function MapSheet({ ranked, expanded, onToggle }: Props) {
  const router = useRouter();

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.fakeMap}>
        <View style={styles.grid} pointerEvents="none">
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={`h${i}`} style={[styles.gridLineH, { top: `${(i + 1) * 12}%` }]} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={`v${i}`} style={[styles.gridLineV, { left: `${(i + 1) * 16}%` }]} />
          ))}
        </View>
        <View style={styles.pin}>
          <View style={styles.pinDot} />
        </View>
      </View>

      <View style={[styles.sheet, expanded && styles.sheetExpanded]}>
        <Pressable onPress={onToggle} style={styles.handleWrap} hitSlop={8}>
          <View style={styles.handle} />
        </Pressable>

        <Pressable onPress={onToggle} style={styles.sheetHead}>
          <Text variant="serif" size={18} style={{ flex: 1 }}>
            {ranked.length} spots near you
          </Text>
          <Kicker accent size={10}>
            {expanded ? 'COLLAPSE' : 'SEE ALL'}
          </Kicker>
        </Pressable>

        {expanded ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {ranked.map((rp) => (
              <Pressable
                key={rp.place.id}
                onPress={() => router.push(`/place/${rp.place.id}`)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}>
                <PlaceImage coords={rp.place.coords} photo={rp.place.photo} width={72} height={72} radius={12} mapSize={160} />
                <View style={styles.rowBody}>
                  <Text variant="bodyMedium" size={14} numberOfLines={1}>
                    {rp.place.name}
                  </Text>
                  <Text variant="kicker" size={9} color={colors.ink45} style={{ marginTop: 4 }} numberOfLines={1}>
                    {placeMeta(rp)}
                  </Text>
                </View>
                <Text variant="kicker" size={10} color={colors.ink45}>
                  {rp.match}%
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {ranked.slice(0, 10).map((rp) => (
              <PlaceCard key={rp.place.id} rp={rp} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fakeMap: { flex: 1, backgroundColor: colors.fill, overflow: 'hidden' },
  grid: { ...StyleSheet.absoluteFill },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.ink08 },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.ink08 },
  pin: {
    position: 'absolute',
    top: '42%',
    left: '48%',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(42,109,244,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.mapPin },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '42%',
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.ink10,
  },
  sheetExpanded: { maxHeight: '86%' },
  handleWrap: { alignItems: 'center', paddingVertical: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.ink16 },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  rail: { gap: 12, paddingHorizontal: spacing.xl },
  list: { gap: 10, paddingHorizontal: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: 8,
  },
  rowBody: { flex: 1 },
});
