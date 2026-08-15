import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
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
      <AppHeader variant="sub" title="Plan together" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 6 of 8
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: spacing.lg }}>
          Ready to lock it in.
        </Text>

        <Card accent style={{ marginBottom: spacing.lg }}>
          <SummaryLine label="Place" value={place ? place.name : 'Somewhere good'} />
          {place ? (
            <Text variant="kicker" size={10} color={colors.ink45} style={{ marginBottom: 10 }}>
              {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          <SummaryLine label="When" value={`${fmtDate(date)}${time ? ` · ${time}` : ''}`} />
          <SummaryLine label="Party" value={`${partySize} ${partySize === 1 ? 'person' : 'people'}`} last />
        </Card>

        <PillButton
          label={reserving ? 'Reserving…' : 'Reserve the table'}
          variant="solid"
          style={{ opacity: reserving ? 0.6 : 1 }}
          onPress={reserving ? undefined : reserve}
        />
        <Text variant="body" size={12} color={colors.ink45} center style={{ marginTop: spacing.sm }}>
          Live reservations aren&apos;t connected yet — this holds your spot in Hoppr.
        </Text>
      </View>
    </Screen>
  );
}

function SummaryLine({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.line, !last && styles.lineDivider]}>
      <Text variant="kicker" size={10} color={colors.accent} style={styles.label}>
        {label}
      </Text>
      <Text variant="bodyMedium" size={15} style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  lineDivider: { borderBottomWidth: 1, borderBottomColor: colors.ink10 },
  label: { width: 52 },
});
