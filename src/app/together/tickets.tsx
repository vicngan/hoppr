import { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, spacing } from '@/theme/tokens';
import { useTogether, TIME_SLOTS } from '@/core/together';
import { usePlace } from '@/core/places-store';
import { CATEGORY_LABEL } from '@/core/places';

type Tab = 'upcoming' | 'past';

/**
 * Reconciled Tickets — folded into the Together tab per SPEC.md §6 (the
 * design's peer Tickets tab was swapped for Together). The only real source
 * of "things the user planned" is the single active/most-recent `Hop` in
 * `together/store.ts` — there's no separate persisted history, so a `planned`
 * hop shows as one ticket, filed Upcoming or Past by its date.
 */
export default function TicketsScreen() {
  const router = useRouter();
  const hop = useTogether((s) => s.hop);
  const [tab, setTab] = useState<Tab>('upcoming');

  const place = usePlace(hop?.pickId ?? undefined);

  const { when, isPast } = useMemo(() => {
    if (!hop || hop.status !== 'planned') return { when: null as Date | null, isPast: false };
    let d: Date | null = null;
    if (hop.planDate) {
      d = new Date(`${hop.planDate}T${hop.planTime ?? '00:00'}:00`);
    } else if (hop.slotId) {
      const slot = TIME_SLOTS.find((s) => s.id === hop.slotId);
      if (slot) {
        d = new Date();
        if (slot.day.toLowerCase() !== 'tonight') d.setDate(d.getDate() + 1);
      }
    }
    // Comparing a derived date against "now" for an upcoming/past split; no
    // SSR in this RN app, so there's no hydration-mismatch risk here.
    // eslint-disable-next-line react-hooks/purity
    return { when: d, isPast: d ? d.getTime() < Date.now() : false };
  }, [hop]);

  const hasTicket = hop?.status === 'planned' && !!place;
  const showInTab = hasTicket && (tab === 'upcoming' ? !isPast : isPast);

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="sub" title="Your tickets" onBack={() => router.back()} />
      <View style={styles.body}>
        <View style={styles.tabs}>
          {(['upcoming', 'past'] as Tab[]).map((t) => {
            const on = tab === t;
            return (
              <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, on && styles.tabOn]}>
                <Text variant="bodyMedium" size={14} color={on ? colors.accent : colors.ink45}>
                  {t === 'upcoming' ? 'Upcoming' : 'Past'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showInTab && hop && place ? (
          <Card padded={false} style={{ marginTop: spacing.lg }} onPress={() => router.push(`/place/${place.id}`)}>
            <PlaceImage coords={place.coords} photo={place.photo} width="100%" height={150} mapSize={700} />
            <View style={{ padding: spacing.md }}>
              <Kicker style={{ marginBottom: 4 }}>{hop.title}</Kicker>
              <Text variant="serif" size={20} style={{ marginBottom: 4 }}>
                {place.name}
              </Text>
              <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 10 }}>
                {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
              </Text>
              <Text variant="body" size={13} color={colors.ink72}>
                {when
                  ? when.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) +
                    (hop.planTime ? ` · ${hop.planTime}` : '')
                  : 'Time TBD'}
              </Text>
              <Text variant="body" size={12} color={colors.ink55} style={{ marginTop: 6 }}>
                {hop.members.map((m) => m.name).join(', ')}
              </Text>
            </View>
          </Card>
        ) : (
          <EmptyState onPlan={() => router.push('/together/plan/invite')} tab={tab} />
        )}
      </View>
    </Screen>
  );
}

function EmptyState({ onPlan, tab }: { onPlan: () => void; tab: Tab }) {
  return (
    <Card accent style={{ marginTop: spacing.xxl, alignItems: 'center' }}>
      <Text variant="serif" size={19} center style={{ marginBottom: 8 }}>
        {tab === 'upcoming' ? 'Nothing on the calendar yet.' : 'No past plans yet.'}
      </Text>
      <Text variant="body" size={14} color={colors.ink72} center style={{ marginBottom: spacing.lg }}>
        Plan a hop with friends — pick a place, a time, and Hoppr holds the ticket here.
      </Text>
      <PillButton label="Plan together" variant="solid" onPress={onPlan} />
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  tabs: { flexDirection: 'row', gap: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.ink10 },
  tab: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: colors.accent },
});
