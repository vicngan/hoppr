import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, spacing, radius, shadow } from '@/theme/tokens';
import { usePlace } from '@/core/places-store';
import { CATEGORY_LABEL } from '@/core/places';
import { useTogether } from '@/core/together';
import { usePlanStore } from '@/core/together/plan-store';

function fmtDate(iso: string | null): string {
  if (!iso) return 'TBD';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Step 8 of 8, terminal — boarding-pass confirmation. "Done" → /home. */
export default function PlanTicketScreen() {
  const router = useRouter();
  const hop = useTogether((s) => s.hop);
  const setPlanDetails = useTogether((s) => s.setPlanDetails);
  const fromPlace = usePlanStore((s) => s.fromPlace);
  const invitees = usePlanStore((s) => s.invitees);
  const date = usePlanStore((s) => s.date);
  const time = usePlanStore((s) => s.time);
  const preorder = usePlanStore((s) => s.preorder);
  const reset = usePlanStore((s) => s.reset);

  const place = usePlace(fromPlace ?? undefined);
  const partySize = invitees.length + 1;

  // The wizard's preorder step (if any) runs after commitToHop() already put
  // the hop in `planned` — sync it on via the store's own public action.
  useEffect(() => {
    if (preorder) setPlanDetails({ preorderDetails: preorder });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = () => {
    reset();
    router.replace('/home');
  };

  return (
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="wizard" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent center style={{ marginBottom: 10 }}>
          Step 8 of 8 — locked in
        </Kicker>
        <Text variant="display" size={28} center style={{ marginBottom: spacing.lg }}>
          You&apos;re all set.
        </Text>

        <View style={styles.pass}>
          <View style={styles.passTop}>
            <Kicker accent style={{ marginBottom: 4 }}>
              {fmtDate(date)}
              {time ? ` · ${time}` : ''}
            </Kicker>
            <Text variant="serif" size={26} color={colors.onDark}>
              {place ? place.name : 'Somewhere good'}
            </Text>
            {place ? (
              <Text variant="body" size={13} color="rgba(247,242,232,0.6)" style={{ marginTop: 3 }}>
                {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
              </Text>
            ) : null}

            <View style={styles.avatarStack}>
              {(hop?.members ?? []).map((m, i) => (
                <View key={m.id} style={[styles.avatar, i > 0 && { marginLeft: -11 }]}>
                  <Text variant="body" size={16}>
                    {m.emoji}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.perforationRow}>
            <View style={styles.notchLeft} />
            <View style={styles.perforation} />
            <View style={styles.notchRight} />
          </View>

          <View style={styles.passBottom}>
            <View>
              <Text variant="kicker" size={9} color="rgba(247,242,232,0.5)">
                TOGETHER WITH
              </Text>
              <Text variant="bodyMedium" size={14} color={colors.onDark} style={{ marginTop: 2 }}>
                {(hop?.members ?? []).map((m) => m.name).join(', ') || `${partySize} guests`}
              </Text>
            </View>
            <Barcode />
          </View>
        </View>

        <PillButton label="Done" variant="solid" style={{ marginTop: spacing.xxl }} onPress={done} />
      </View>
    </Screen>
  );
}

/** Simple alternating-bar barcode graphic — no real scan payload, purely the ticket-stub visual cue. */
function Barcode() {
  const widths = [3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2];
  return (
    <View style={styles.barcode}>
      {widths.map((w, i) => (
        <View key={i} style={{ width: w, height: '100%', backgroundColor: colors.ink, marginRight: 2 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  pass: { marginTop: spacing.md, backgroundColor: colors.ink, borderRadius: radius.sheet, overflow: 'hidden', ...shadow.card },
  passTop: { padding: 20 },
  passBottom: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  perforationRow: { flexDirection: 'row', alignItems: 'center' },
  perforation: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(247,242,232,0.2)',
  },
  notchLeft: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.paper, marginLeft: -10 },
  notchRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.paper, marginRight: -10 },
  avatarStack: { flexDirection: 'row', marginTop: spacing.md },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcode: { flexDirection: 'row', width: 56, height: 56, backgroundColor: colors.onDark, padding: 5, borderRadius: 8 },
});
