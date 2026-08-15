import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { colors, spacing, radius } from '@/theme/tokens';
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
      <AppHeader variant="sub" title="Plan together" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent center style={{ marginBottom: 10 }}>
          Step 8 of 8 — locked in
        </Kicker>
        <Text variant="display" size={28} center style={{ marginBottom: spacing.lg }}>
          You&apos;re all set.
        </Text>

        <Card accent padded={false} style={styles.pass}>
          <View style={styles.passTop}>
            <Kicker style={{ marginBottom: 4 }}>{hop?.title ?? 'Your hop'}</Kicker>
            <Text variant="serif" size={24}>
              {place ? place.name : 'Somewhere good'}
            </Text>
            {place ? (
              <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 2 }}>
                {[CATEGORY_LABEL[place.category], place.area].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>

          <View style={styles.perforation} />

          <View style={styles.passBottom}>
            <PassLine label="Date" value={fmtDate(date)} />
            <PassLine label="Time" value={time ?? 'TBD'} />
            <PassLine label="Guests" value={`${partySize} ${partySize === 1 ? 'person' : 'people'}`} last />

            <View style={styles.avatarStack}>
              {(hop?.members ?? []).map((m, i) => (
                <View key={m.id} style={[styles.avatar, i > 0 && { marginLeft: -10 }]}>
                  <Text variant="body" size={16}>
                    {m.emoji}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        <PillButton label="Done" variant="solid" style={{ marginTop: spacing.xxl }} onPress={done} />
      </View>
    </Screen>
  );
}

function PassLine({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.line, !last && styles.lineDivider]}>
      <Text variant="kicker" size={10} color={colors.accent} style={styles.label}>
        {label}
      </Text>
      <Text variant="bodyMedium" size={15}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  pass: { marginTop: spacing.md },
  passTop: { padding: 18 },
  passBottom: { padding: 18 },
  perforation: {
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.ink16,
    marginHorizontal: 18,
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  lineDivider: { borderBottomWidth: 1, borderBottomColor: colors.ink10 },
  label: { width: 52 },
  avatarStack: { flexDirection: 'row', marginTop: spacing.md },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    borderWidth: 1.5,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
