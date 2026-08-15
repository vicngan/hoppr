import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { BellIcon } from '@/theme/icons';

const BULLETS = [
  'Evening pick, only when you usually go out',
  'Friends inviting you to a plan',
  'A saved spot has something on tonight',
];

/** No back/progress row per package brief — a centered permission-style screen. */
export default function ObNotifScreen() {
  const router = useRouter();
  const next = () => router.push('/onboarding/ob-location' as never);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.iconWrap}>
        <View style={styles.iconBadge}>
          <BellIcon size={44} color={colors.onDark} />
        </View>
      </View>
      <Text variant="display" center style={styles.headline}>
        Want a nudge when there&apos;s a good night?
      </Text>
      <Text variant="body" size={14} color={colors.ink60} center style={styles.sub}>
        A single evening ping — never spam. &quot;Three quiet cocktail rooms open near you right
        now.&quot;
      </Text>

      <View style={styles.bulletBox}>
        {BULLETS.map((b) => (
          <View key={b} style={styles.bulletRow}>
            <View style={styles.dot} />
            <Text variant="body" size={13} style={styles.bulletText}>
              {b}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={next} style={styles.primary}>
          <Text variant="bodyMedium" size={15} color={colors.onDark} center>
            Turn on notifications
          </Text>
        </Pressable>
        <Pressable onPress={next} style={styles.secondary}>
          <Text variant="bodyMedium" size={14} color={colors.ink45} center>
            Maybe later
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center' },
  iconWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  headline: { marginBottom: spacing.md },
  sub: { alignSelf: 'center', maxWidth: 300, marginBottom: spacing.xl },
  bulletBox: {
    backgroundColor: colors.fill,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.accent },
  bulletText: { flex: 1 },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondary: { paddingVertical: spacing.sm, alignItems: 'center' },
});
