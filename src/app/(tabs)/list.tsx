import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton, StripePlaceholder } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { PLACES, CATEGORY_LABEL } from '@/core/places';

// Placeholder membership until saves/visits persist in Slice 2.
const SAVED = PLACES.slice(0, 4);
const VISITED = PLACES.slice(4, 8);

/** Saved / visited grid. Slice 2 wires real persistence + spec tags. */
export default function ListScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'saved' | 'visited'>('saved');
  const items = tab === 'saved' ? SAVED : VISITED;

  return (
    <Screen>
      <Text variant="display" size={32} style={{ marginBottom: 18 }}>
        Your list
      </Text>
      <View style={styles.tabs}>
        <PillButton label="Saved" compact selected={tab === 'saved'} onPress={() => setTab('saved')} />
        <PillButton label="Been there" compact selected={tab === 'visited'} onPress={() => setTab('visited')} />
      </View>

      <View style={styles.grid}>
        {items.map((p) => (
          <View key={p.id} style={styles.cell}>
            <StripePlaceholder height={104} radius={0} />
            <View style={styles.body}>
              <Text variant="serif" size={17} numberOfLines={1}>
                {p.name}
              </Text>
              <Text variant="kicker" size={9} color={colors.ink45} style={{ marginTop: 6 }}>
                {CATEGORY_LABEL[p.category]} · {p.area}
              </Text>
            </View>
            <View
              style={StyleSheet.absoluteFill}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => router.push(`/place/${p.id}`)}
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    overflow: 'hidden',
  },
  body: { padding: 13 },
});
