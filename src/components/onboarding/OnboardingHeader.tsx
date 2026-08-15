import { Pressable, View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';
import { Kicker } from '@/components/ui/Kicker';
import { ChevronBackIcon } from '@/theme/icons';

type Props = {
  /**
   * 0-1 fraction for the inline progress bar next to the back button — runs
   * continuously across the name→distance question screens (design uses
   * designer-set percentages, not an even split). Omit for screens with no
   * bar at all (taste/photo/notif/location/account).
   */
  progress?: number;
  /** "STEP N OF 8" kicker rendered under the row, only on the 8 core question screens. */
  stepLabel?: string;
  /**
   * Custom kicker label with no progress bar, for the non-stepped screens
   * (e.g. "ONE LAST THING", "ALMOST THERE"). Mutually exclusive with `progress`/`stepLabel`.
   */
  eyebrow?: string;
  onBack?: () => void;
  /** top-right skip link *in the header row* — only ob-photo uses this (paired with no bar). */
  skipLabel?: string;
  onSkip?: () => void;
};

/**
 * Shared onboarding chrome: back button + inline progress bar (or a
 * top-right skip link) in one row, plus an optional step/eyebrow kicker
 * below it. Sits above each step screen's content instead of AppHeader,
 * since onboarding needs step-progress rather than the root app's chrome.
 */
export function OnboardingHeader({ progress, stepLabel, eyebrow, onBack, skipLabel, onSkip }: Props) {
  const hasRow = onBack != null || progress != null || skipLabel != null;
  return (
    <View style={styles.root}>
      {hasRow ? (
        <View style={styles.row}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={8}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
              <ChevronBackIcon size={18} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          {progress != null ? (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
          ) : skipLabel ? (
            <>
              <View style={styles.spacer} />
              <Pressable onPress={onSkip} hitSlop={8}>
                <Text variant="bodyMedium" size={13} color={colors.ink45}>
                  {skipLabel}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      ) : null}
      {stepLabel ? (
        <Kicker style={styles.kicker}>{stepLabel}</Kicker>
      ) : eyebrow ? (
        <Kicker accent style={styles.kicker}>
          {eyebrow}
        </Kicker>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.ink14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { flex: 1 },
  kicker: { marginTop: spacing.xs },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.fill, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent },
});
