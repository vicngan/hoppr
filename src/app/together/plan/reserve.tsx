import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, spacing } from '@/theme/tokens';
import { usePlace } from '@/core/places-store';
import { CATEGORY_LABEL } from '@/core/places';
import { useUserLocation } from '@/core/location';
import { usePlaces } from '@/core/places-repo';
import { usePlanStore } from '@/core/together/plan-store';

function fmtDate(iso: string | null): string {
  if (!iso) return 'TBD';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Step 6 of 8 — summary + "Reserve the table" commits the wizard into a real Hop. */
export default function PlanReserveScreen() {
  const router = useRouter();
  const fromPlace = usePlanStore((s) => s.fromPlace);
  const invitees = usePlanStore((s) => s.invitees);
  const date = usePlanStore((s) => s.date);
  const time = usePlanStore((s) => s.time);
  const setReserve = usePlanStore((s) => s.setReserve);
  const commitToHop = usePlanStore((s) => s.commitToHop);

  const place = usePlace(fromPlace ?? undefined);
  const { coords } = useUserLocation();
  const { places } = usePlaces(coords);

  const [reserving, setReserving] = useState(false);
  const partySize = invitees.length + 1;

  const reserve = () => {
    setReserving(true);
    setReserve({ partySize, status: 'requested' });
    commitToHop(places, coords);
    router.push('/together/plan/preorder');
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="wizard" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 6 of 8
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: spacing.lg }}>
          Ready to lock it in.
        </Text>

        <View style={styles.summaryCard}>
          <Text variant="bodyMedium" size={16} color={colors.onDark}>
            {place ? place.name : 'Somewhere good'}
          </Text>
          {place ? (
            <Text variant="body" size={12} color="rgba(247,242,232,0.6)" style={{ marginTop: 2 }}>
              {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          <View style={styles.statRow}>
            <Stat label="Date" value={fmtDate(date)} />
            <Stat label="Time" value={time ?? 'TBD'} />
            <Stat label="Party" value={`${partySize} ${partySize === 1 ? 'guest' : 'guests'}`} />
          </View>
        </View>

        <PillButton
          label={reserving ? 'Reserving…' : 'Reserve the table'}
          variant="outline"
          selected
          style={{ marginTop: spacing.lg, opacity: reserving ? 0.6 : 1 }}
          onPress={reserving ? undefined : reserve}
        />
        <Text variant="body" size={12} color={colors.ink45} center style={{ marginTop: spacing.sm }}>
          Live reservations aren&apos;t connected yet — this holds your spot in Hoppr.
        </Text>
      </View>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="kicker" size={9} color="rgba(247,242,232,0.5)">
        {label.toUpperCase()}
      </Text>
      <Text variant="bodyMedium" size={13} color={colors.onDark} style={{ marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  summaryCard: {
    backgroundColor: colors.ink,
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(247,242,232,0.15)',
  },
});
