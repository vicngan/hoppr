import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, PillButton } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, radius, spacing } from '@/theme/tokens';
import { CATEGORY_LABEL, type Place } from '@/core/places';
import { usePlacesStore } from '@/core/places-store';
import { useLibrary } from '@/core/library/store';

/** Saved / visited grid, backed by the persisted library. */
export default function ListScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'saved' | 'visited'>('saved');
  const saved = useLibrary((s) => s.saved);
  const ratings = useLibrary((s) => s.ratings);
  const byId = usePlacesStore((s) => s.byId);

  const savedPlaces = Object.keys(saved)
    .map((id) => byId[id])
    .filter(Boolean) as Place[];
  const ratedIds = Object.keys(ratings).sort((a, b) => ratings[b].at - ratings[a].at);
  const ratedPlaces = ratedIds.map((id) => byId[id]).filter(Boolean) as Place[];

  const items = tab === 'saved' ? savedPlaces : ratedPlaces;

  return (
    <Screen>
      <Text variant="display" size={32} style={{ marginBottom: 18 }}>
        Your list
      </Text>
      <View style={styles.tabs}>
        <PillButton
          label={`Saved${savedPlaces.length ? ` · ${savedPlaces.length}` : ''}`}
          compact
          selected={tab === 'saved'}
          onPress={() => setTab('saved')}
        />
        <PillButton
          label={`Been there${ratedPlaces.length ? ` · ${ratedPlaces.length}` : ''}`}
          compact
          selected={tab === 'visited'}
          onPress={() => setTab('visited')}
        />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="serif" size={19} color={colors.ink70} center>
            {tab === 'saved'
              ? 'Nothing saved yet. Tap “Save for later” on a place you like.'
              : "You haven't rated anywhere yet. Rate a spot to remember it."}
          </Text>
          <PillButton label="Find somewhere" onPress={() => router.push('/(tabs)/discover')} />
        </View>
      ) : (
        <View style={styles.grid}>
          {items.map((p) => (
            <View key={p.id} style={styles.cell}>
              <PlaceImage coords={p.coords} photo={p.photo} height={104} radius={0} mapSize={280}>
                {tab === 'visited' && ratings[p.id] ? (
                  <View style={styles.starBadge}>
                    <Text variant="kicker" size={10} color={colors.ink}>
                      {ratings[p.id].stars}★
                    </Text>
                  </View>
                ) : null}
              </PlaceImage>
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
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: spacing.xl },
  empty: { alignItems: 'center', gap: 18, paddingVertical: 48, paddingHorizontal: 20 },
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
  starBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(247,242,232,0.94)',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
