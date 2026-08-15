import { useEffect, useState } from 'react';
import { Modal, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';
import { Text, Kicker } from '@/components/ui';
import { PlaceImage } from '@/components/PlaceImage';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { fmtDistance } from '@/core/discovery';
import { type RankedPlace } from '@/core/engine';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** top pick + up to 4 backups, best first */
  candidates: RankedPlace[];
};

const SPARKLES = [
  { top: -14, left: 18, delay: 0, size: 16 },
  { top: 10, left: -18, delay: 80, size: 12 },
  { top: -8, left: '82%' as const, delay: 140, size: 14 },
  { top: '46%' as const, left: '96%' as const, delay: 60, size: 10 },
  { top: '92%' as const, left: -10, delay: 180, size: 12 },
];

/**
 * Single top-pick reveal shown after the Ask question flow (and Home's
 * "surprise me" dice, skipping straight here). Replaces the old
 * everyone-swipes SwipeDeck for the solo path — that Tinder-style deck now
 * lives only in Together's group plan matching, where swiping between
 * several real candidates actually makes sense for a group.
 */
export function SuggestionReveal({ visible, onClose, candidates }: Props) {
  const router = useRouter();
  const [mainIndex, setMainIndex] = useState(0);
  // Reset to the top pick each time the popup opens — adjusting state during
  // render (React's documented pattern for this) rather than in an effect,
  // so it doesn't cost an extra cascading render.
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setMainIndex(0);
  }

  const main = candidates[mainIndex];
  const backups = candidates.filter((_, i) => i !== mainIndex);

  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 0.85;
      opacity.value = 0;
      opacity.value = withTiming(1, { duration: 180 });
      scale.value = withSequence(
        withTiming(1.04, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
  }, [visible, mainIndex, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const openDetail = () => {
    if (!main) return;
    onClose();
    router.push(`/place/${main.place.id}` as Href);
  };

  if (!main) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.centerWrap}>
          <Animated.View style={[styles.sparkleWrap, cardStyle]}>
            {SPARKLES.map((s, i) => (
              <Sparkle key={i} top={s.top} left={s.left} delay={s.delay} size={s.size} />
            ))}

            <Pressable onPress={(e) => e.stopPropagation()}>
              <Pressable onPress={openDetail} style={styles.mainCard}>
                <PlaceImage
                  coords={main.place.coords}
                  photo={main.place.photo}
                  width="100%"
                  height={220}
                  radius={0}>
                  <View style={styles.matchBadge}>
                    <Text variant="kicker" size={10} color={colors.onDark}>
                      {main.match}% match
                    </Text>
                  </View>
                </PlaceImage>
                <View style={styles.mainBody}>
                  <Kicker accent size={10} style={{ marginBottom: 6 }}>
                    Tonight&apos;s pick
                  </Kicker>
                  <Text variant="serif" size={24}>
                    {main.place.name}
                  </Text>
                  <Text variant="kicker" size={10} color={colors.ink45} style={{ marginTop: 6, marginBottom: 8 }}>
                    {main.place.area} · {fmtDistance(main.distanceMi)}
                  </Text>
                  <Text variant="body" size={13} color={colors.ink72} numberOfLines={2}>
                    {main.reason}
                  </Text>
                  <Text variant="bodyMedium" size={13} color={colors.accent} style={{ marginTop: 12 }}>
                    Tap to explore →
                  </Text>
                </View>
              </Pressable>
            </Pressable>
          </Animated.View>

          {backups.length > 0 ? (
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.backupSection}>
              <Text variant="kicker" size={10} color="rgba(247,242,232,0.6)" style={styles.backupLabel}>
                OR MAYBE
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.backupRow}>
                {backups.map((r) => {
                  const idx = candidates.indexOf(r);
                  return (
                    <Pressable key={r.place.id} onPress={() => setMainIndex(idx)} style={styles.backupCard}>
                      <PlaceImage coords={r.place.coords} photo={r.place.photo} width="100%" height={72} radius={radius.md} />
                      <Text variant="bodyMedium" size={12} color={colors.onDark} style={{ marginTop: 6 }} numberOfLines={1}>
                        {r.place.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
    </Modal>
  );
}

function Sparkle({
  top,
  left,
  delay,
  size,
}: {
  top: number | `${number}%`;
  left: number | `${number}%`;
  delay: number;
  size: number;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(withTiming(1, { duration: 200 }), withTiming(0.7, { duration: 300 })));
    scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 200 }));
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.sparkleGlyph, { top, left, fontSize: size }, style]}>✦</Animated.Text>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,17,13,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  centerWrap: { width: '100%', maxWidth: 360, alignItems: 'center' },
  sparkleWrap: { width: '100%' },
  sparkleGlyph: { position: 'absolute', color: colors.accent },
  mainCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.card,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(20,17,13,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    margin: spacing.md,
  },
  mainBody: { padding: spacing.lg },
  backupSection: { width: '100%', marginTop: spacing.xl },
  backupLabel: { textAlign: 'center', marginBottom: spacing.sm, letterSpacing: 1 },
  backupRow: { gap: spacing.sm, paddingHorizontal: spacing.xs },
  backupCard: { width: 96 },
});
