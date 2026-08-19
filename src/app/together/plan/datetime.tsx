import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
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
    <Screen scroll gutter={0} padTop={false}>
      <AppHeader variant="wizard" onBack={() => router.back()} />
      <View style={styles.body}>
        <Kicker accent style={{ marginBottom: 9 }}>
          Step 4 of 8
        </Kicker>
        <Text variant="display" size={28} style={{ marginBottom: spacing.lg }}>
          When works?
        </Text>

        <Kicker style={{ marginBottom: spacing.sm }}>Date</Kicker>
        <MonthCalendar value={date} onChange={(iso) => setDateTime(iso, time)} />

        <Kicker style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>Time</Kicker>
        <WheelTimePicker value={time} onChange={(t) => setDateTime(date, t)} />

        <PillButton
          label="Confirm"
          variant="solid"
          style={{ marginTop: spacing.xxl, opacity: date && time ? 1 : 0.4 }}
          onPress={date && time ? () => router.push('/together/plan/results') : undefined}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
});
