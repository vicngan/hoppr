import { View, StyleSheet } from 'react-native';
import { Screen, Text, Kicker, Card, PillButton } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

/**
 * Placeholder for the "Together" social layer (invite → private answers →
 * swipe-to-match → group plan). Full flow lands in Slice 5; this keeps the tab
 * on-brand and states the intent.
 */
export default function TogetherScreen() {
  return (
    <Screen>
      <Kicker accent style={{ marginBottom: 9 }}>
        Coming in a later slice
      </Kicker>
      <Text variant="display" size={30} style={{ marginBottom: 8 }}>
        Decide as a group.
      </Text>
      <Text variant="serif" size={19} color={colors.ink80} style={{ marginBottom: spacing.xxl }}>
        Invite friends, everyone answers a few questions privately, then swipe to
        a place that clears the whole table.
      </Text>

      <Card style={{ marginBottom: spacing.lg }}>
        <Kicker style={{ marginBottom: 10 }}>How a hop will work</Kicker>
        {[
          'Start a hop and invite the table',
          'Everyone answers privately — no account needed to join',
          'Swipe the shortlist; Hoppr matches the overlap',
          'Lock a place and a time that actually works',
        ].map((line, i) => (
          <View key={line} style={styles.step}>
            <Text variant="kicker" size={10} color={colors.accent} style={styles.num}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <Text variant="body" size={14} color={colors.ink72} style={{ flex: 1 }}>
              {line}
            </Text>
          </View>
        ))}
      </Card>

      <PillButton label="Start a hop" variant="solid" onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 7 },
  num: { width: 20, paddingTop: 3 },
});
