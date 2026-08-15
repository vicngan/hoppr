import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';

/** No back/progress row per package brief — a centered permission-style screen. */
export default function ObLocationScreen() {
  const router = useRouter();
  const next = () => router.push('/onboarding/ob-account' as never);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.iconWrap}>
        <View style={styles.iconBadge}>
          <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.7}>
            <Path d="M12 21C7 16 4 12.5 4 9a8 8 0 1116 0c0 3.5-3 7-8 12z" />
            <Circle cx={12} cy={9} r={2.6} />
          </Svg>
        </View>
      </View>
      <Text variant="display" center style={styles.headline}>
        Where are you starting from?
      </Text>
      <Text variant="body" size={14} color={colors.ink60} center style={styles.sub}>
        Hoppr uses your location to find what&apos;s actually close tonight. We never post it or
        share it.
      </Text>

      <View style={styles.chipWrap}>
        <View style={styles.chip}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.ink} strokeWidth={1.8}>
            <Path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
          </Svg>
          <Text variant="bodyMedium" size={13}>
            Currently: Ann Arbor, MI
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={next} style={styles.primary}>
          <Text variant="bodyMedium" size={15} color={colors.onDark} center>
            Use my location
          </Text>
        </Pressable>
        <Pressable onPress={next} style={styles.secondary}>
          <Text variant="bodyMedium" size={14} color={colors.ink45} center>
            Set it manually
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(200,67,28,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: { marginBottom: spacing.md },
  sub: { alignSelf: 'center', maxWidth: 300, marginBottom: spacing.xl },
  chipWrap: { alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.fill,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  actions: { gap: spacing.sm, marginTop: spacing.xl },
  primary: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondary: { paddingVertical: spacing.sm, alignItems: 'center' },
});
