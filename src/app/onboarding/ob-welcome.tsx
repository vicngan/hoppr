import { Image, Pressable, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Screen, Text, Kicker, PillButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { useOnboarding } from '@/core/onboarding/store';

const MARK_LOGO = require('../../assets/brand/hoppr-mark-v2-trimmed.png');

/** Onboarding entry point. Skip bails straight to the app, no data collected. */
export default function ObWelcomeScreen() {
  const router = useRouter();
  const markComplete = useOnboarding((s) => s.markComplete);

  const skip = () => {
    markComplete();
    router.replace('/home' as never);
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <View />
        <Pressable onPress={skip} hitSlop={8}>
          <Text variant="bodyMedium" size={13} color={colors.ink60}>
            Skip →
          </Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <Image source={MARK_LOGO} style={styles.logo} resizeMode="contain" />
        <Kicker accent center style={{ marginTop: spacing.xl }}>
          Welcome to Hoppr
        </Kicker>
        <Text variant="display" size={40} center style={styles.headline}>
          Never wonder “what should I do?” again.
        </Text>
        <Text variant="body" size={15} center color={colors.ink60} style={styles.sub}>
          A few quick taps and Hoppr learns your kind of night — then it just knows what to
          suggest. No feed to scroll, no research.
        </Text>

        <View style={styles.callout}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.8} style={styles.calloutIcon}>
            <Path d="M12 2l7 3v6c0 4.5-3 8.5-7 9.5C8 19.5 5 15.5 5 11V5z" />
          </Svg>
          <Text variant="body" size={12.5} color={colors.ink70} style={styles.calloutText}>
            Your answers only shape your picks. No account needed to start — set one up when
            you&apos;re ready.
          </Text>
        </View>
      </View>

      <PillButton
        label="Let's find your night →"
        variant="solid"
        onPress={() => router.push('/onboarding/ob-name' as never)}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  center: { alignItems: 'center', paddingTop: spacing.xxxl },
  logo: { width: 96, height: 96 },
  headline: { marginTop: spacing.lg, paddingHorizontal: spacing.md, maxWidth: 300 },
  sub: { marginTop: spacing.md, paddingHorizontal: spacing.md, maxWidth: 290 },
  callout: {
    marginTop: spacing.xxl,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: colors.fill,
    borderRadius: radius.xl,
    padding: 14,
  },
  calloutIcon: { marginTop: 1 },
  calloutText: { flex: 1 },
  cta: { marginTop: spacing.xxl },
});
