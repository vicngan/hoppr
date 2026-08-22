import { type ReactNode } from 'react';
import { View, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from '@/components/ui/Text';
import { ChevronBackIcon, BellIcon, StreakFlagIcon } from '@/theme/icons';

const MARK_LOGO = require('../assets/brand/hoppr-mark-v2-trimmed.png');
const LOCKUP_LOGO = require('../assets/brand/hoppr-lockup-v2-trimmed.png');

export type AppHeaderProps = {
  variant: 'root' | 'sub' | 'wizard';
  title?: string;
  onBack?: () => void;
  /** Home-only: render the profile-dot avatar button (navigates to /profile). */
  showProfileDot?: boolean;
  /** Home-only: render the bell icon button. */
  showBell?: boolean;
  /** Home-only: render the "▲ {streak}-night streak" pill. */
  streak?: number;
  /** Tap handler for the bell button. Only used when `showBell` is true. */
  onBellPress?: () => void;
  /** Extra content rendered at the right edge, after the built-in Home controls. */
  right?: ReactNode;
  /** `sub`-only: swap the small icon-only mark for the full lockup wordmark (default 'mark'). Used by pushed "main" screens like place/[id] and menu/[id] that still need a back button. */
  logo?: 'mark' | 'lockup';
  /** `wizard`-only: small step counter (e.g. "Step 1 of 8"), rendered below the back button/logo row. */
  stepLabel?: string;
  /** `wizard`-only: the step's title, rendered below `stepLabel`. */
  heading?: string;
  /** `wizard`-only: replaces the centered logo with bigger centered text (e.g. "Question 1 of 6"), for screens that need the counter more than the mark. */
  centerText?: string;
};

/**
 * Persistent screen header. Three variants:
 *  - `sub`: 34px circular back button + icon-only mark logo (or the full
 *    lockup wordmark via `logo="lockup"`, for pushed "main" screens like
 *    place/[id] and menu/[id] that still need a back button). Used on every
 *    non-root, non-wizard screen.
 *  - `root`: no back button. Only Home additionally passes
 *    `showBell`/`showProfileDot`/`streak`, which also renders the full
 *    wordmark lockup here — every other root-ish screen (tabs) renders no
 *    logo in the header at all; those screens place a small `BrandMark`
 *    icon directly beside their own body title instead (see `BrandMark.tsx`).
 *  - `wizard`: back button + centered icon-only mark logo (swapped for
 *    bigger centered text via `centerText`, e.g. quiz.tsx's "Question 1 of
 *    6", on screens where the counter matters more than the mark), no
 *    wordmark/title. Used by every screen inside the together/plan pipeline.
 *    `stepLabel`/`heading` render as a stacked block below that row (e.g.
 *    invite.tsx's "Step 1 of 8" / "Invite the table.").
 *
 * Sticky behavior: this component is designed to sit *above* a screen's
 * scroll container (e.g. above `<Screen scroll>`'s ScrollView), which is
 * the sticky convention used everywhere except Home. On Home specifically,
 * pass through `position: 'sticky'` via the `stickyOnWeb` default below —
 * on React Native Web this pins the header to the viewport top; on native
 * RN, `position: 'sticky'` is a no-op and the header sits outside the
 * ScrollView already, which achieves the same pinned effect by construction.
 * One implementation serves both platforms, no per-platform branch needed.
 */
export function AppHeader({
  variant,
  title,
  onBack,
  showProfileDot,
  showBell,
  streak,
  onBellPress,
  right,
  logo = 'mark',
  stepLabel,
  heading,
  centerText,
}: AppHeaderProps) {
  const router = useRouter();
  const isHomeChrome = variant === 'root' && (showProfileDot || showBell || streak != null);

  if (variant === 'wizard') {
    return (
      <View style={[styles.root, styles.rootSub, styles.wizardRoot]}>
        <View style={styles.wizardRow}>
          <View style={styles.wizardSide}>
            <Pressable
              onPress={onBack}
              hitSlop={8}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
              <ChevronBackIcon size={18} color={colors.ink} />
            </Pressable>
          </View>
          {centerText ? (
            <Text variant="bodyMedium" size={15} color={colors.ink} style={styles.centerTextCentered}>
              {centerText}
            </Text>
          ) : (
            <Image source={MARK_LOGO} style={styles.markLogoCentered} resizeMode="contain" />
          )}
          <View style={[styles.wizardSide, styles.wizardSideRight]}>{right}</View>
        </View>
        {stepLabel || heading ? (
          <View style={styles.wizardTextBlock}>
            {stepLabel ? (
              <Text variant="kicker" size={11} color={colors.accent} style={{ marginBottom: 6 }}>
                {stepLabel}
              </Text>
            ) : null}
            {heading ? (
              <Text variant="display" size={26}>
                {heading}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        variant === 'sub' ? styles.rootSub : styles.rootRoot,
        isHomeChrome && styles.sticky,
      ]}>
      <View style={styles.left}>
        {variant === 'sub' ? (
          <>
            <Pressable
              onPress={onBack}
              hitSlop={8}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
              <ChevronBackIcon size={18} color={colors.ink} />
            </Pressable>
            <Image
              source={logo === 'lockup' ? LOCKUP_LOGO : MARK_LOGO}
              style={logo === 'lockup' ? styles.lockupLogo : styles.markLogo}
              resizeMode="contain"
            />
            {title ? (
              <Text variant="bodyMedium" size={15} color={colors.ink} style={styles.title}>
                {title}
              </Text>
            ) : null}
          </>
        ) : isHomeChrome ? (
          <>
            <Image source={LOCKUP_LOGO} style={styles.lockupLogo} resizeMode="contain" />
            {title ? (
              <Text variant="bodyMedium" size={15} color={colors.ink} style={styles.title}>
                {title}
              </Text>
            ) : null}
          </>
        ) : title ? (
          <Text variant="bodyMedium" size={15} color={colors.ink} style={styles.title}>
            {title}
          </Text>
        ) : null}
      </View>

      {isHomeChrome ? (
        <View style={styles.right}>
          {streak != null ? (
            <View style={styles.streakPill}>
              <StreakFlagIcon size={12} color={colors.accent} />
              <Text variant="kicker" size={10} color={colors.accent}>
                {streak}-night streak
              </Text>
            </View>
          ) : null}
          {showBell ? (
            <Pressable
              onPress={onBellPress}
              hitSlop={8}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
              <BellIcon size={20} color={colors.ink} />
            </Pressable>
          ) : null}
          {showProfileDot ? (
            <Pressable
              onPress={() => router.navigate('/profile' as Href)}
              hitSlop={8}
              style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <LinearGradient
                colors={[colors.avatarGradientFrom, colors.avatarGradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.profileDot}
              />
            </Pressable>
          ) : null}
          {right}
        </View>
      ) : (
        right ? <View style={styles.right}>{right}</View> : null
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.paper,
  },
  // React Native Web passes `position: 'sticky'` through directly; on native
  // RN it's an inert style (the header already sits outside the ScrollView).
  sticky: { position: 'sticky' as unknown as 'relative', top: 0, zIndex: 5 },
  rootSub: { paddingTop: 76 },
  rootRoot: { paddingTop: 68 },
  // Explicit flexBasis override: the shared `root` style's `flex: 0` compiles
  // on web to `flex-basis: 0%` (CSS shorthand semantics, unlike Yoga's
  // `auto`), which collapses this column to its padding alone and lets the
  // stacked step-label/heading block render outside its own box.
  wizardRoot: { flexDirection: 'column', alignItems: 'stretch', flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  wizardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative' },
  wizardSide: { width: 34, alignItems: 'flex-start' },
  wizardSideRight: { alignItems: 'flex-end' },
  markLogoCentered: { width: 40, height: 40, position: 'absolute', left: '50%', marginLeft: -20 },
  centerTextCentered: { position: 'absolute', left: 0, right: 0, textAlign: 'center' },
  wizardTextBlock: { marginTop: spacing.lg },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.ink14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLogo: { width: 26, height: 26 },
  // The lockup asset is the rabbit doodle + "Hoppr" script stacked roughly
  // square (~293x234), not a wide horizontal wordmark — size to that real
  // aspect ratio rather than a wide fixed box, or `resizeMode="contain"`
  // just letterboxes it down to a sliver.
  lockupLogo: { height: 40, width: 50 },
  title: { marginLeft: 0 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
  },
  profileDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
