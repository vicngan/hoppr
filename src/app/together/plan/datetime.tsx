import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { WizardScreen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { AppHeader } from '@/components/AppHeader';
import { MonthCalendar } from '@/components/together/MonthCalendar';
import { WheelTimePicker } from '@/components/together/WheelTimePicker';
import { spacing } from '@/theme/tokens';
import { usePlanStore } from '@/core/together/plan-store';

/** Step 4 of 8 — full month-grid calendar + a native-style wheel time picker. */
export default function PlanDatetimeScreen() {
  const router = useRouter();
  const date = usePlanStore((s) => s.date);
  const time = usePlanStore((s) => s.time);
  const setDateTime = usePlanStore((s) => s.setDateTime);

  // Default to today / 7:00 PM so the wheel's visible starting position
  // matches what "Confirm" would actually submit before the user touches it.
  useEffect(() => {
    if (!date || !time) {
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      setDateTime(date ?? iso, time ?? '19:00');
    }
    // once, on entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WizardScreen
      header={<AppHeader variant="wizard" onBack={() => router.back()} />}
      footer={
        <PillButton
          label="Confirm"
          variant="solid"
          style={{ opacity: date && time ? 1 : 0.4 }}
          onPress={date && time ? () => router.push('/together/plan/results') : undefined}
        />
      }
      contentStyle={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 4 of 8
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: spacing.lg }}>
          When works?
        </Text>

        <Card style={{ padding: spacing.lg }}>
          <MonthCalendar value={date} onChange={(iso) => setDateTime(iso, time)} />
        </Card>

        <Card style={{ marginTop: spacing.lg, padding: spacing.lg }}>
          <WheelTimePicker value={time} onChange={(t) => setDateTime(date, t)} />
        </Card>
    </WizardScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
});
