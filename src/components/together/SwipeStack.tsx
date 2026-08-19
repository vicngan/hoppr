import { type ReactNode, useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { CloseIcon, HeartIcon } from '@/theme/icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';

type Props<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  /** swiped right or tapped the heart button */
  onLike: (item: T) => void;
  /** swiped left or tapped the X button — just skip to the next candidate */
  onPass?: (item: T) => void;
  /** tapped the card body — opens a detail view without advancing the deck. Falls back to `onLike` if omitted. */
  onCardPress?: (item: T) => void;
  emptyState: ReactNode;
  height?: number;
};

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const STACK_SIZE = 4;

/**
 * Generic Tinder-style swipe stack — the gesture/animation core originally
 * built for the solo Ask flow, now scoped to Together's group plan matching
 * (see together/plan/matches.tsx) where swiping between several real
 * candidates fits a group deciding together. Not modal — renders inline as
 * a fixed-height block wherever it's placed.
 */
export function SwipeStack<T>({
  items,
  keyOf,
  renderCard,
  onLike,
  onPass,
  onCardPress,
  emptyState,
  height = 420,
}: Props<T>) {
  const [index, setIndex] = useState(0);
  const stack = items.slice(index, index + STACK_SIZE);
  const current = stack[0];

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const advance = (liked: boolean) => {
    if (current) {
      if (liked) onLike(current);
      else onPass?.(current);
    }
    translateX.value = 0;
    translateY.value = 0;
    setIndex((i) => i + 1);
  };

  const flingOut = (dir: 1 | -1) => {
    translateX.value = withTiming(dir * SCREEN_W * 1.5, { duration: 220 }, () => {
      runOnJS(advance)(dir === 1);
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.35;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        flingOut(1);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        flingOut(-1);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${translateX.value / 18}deg` },
    ],
  }));

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [10, SWIPE_THRESHOLD], [0, 1]),
  }));
  const passStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, -10], [1, 0]),
  }));

  return (
    <View>
      <View style={[styles.deckArea, { height }]}>
        {!current ? (
          <View style={styles.empty}>{emptyState}</View>
        ) : (
          stack
            .slice()
            .reverse()
            .map((item, i) => {
              const depth = stack.length - 1 - i;
              const isTop = depth === 0;
              const staticStyle = {
                transform: [{ translateY: depth * -10 }, { scale: 1 - depth * 0.04 }],
                opacity: 1 - depth * 0.15,
                zIndex: STACK_SIZE - depth,
              };
              const key = keyOf(item);

              if (!isTop) {
                return (
                  <View key={key} style={[styles.cardWrap, staticStyle]}>
                    <View style={styles.card}>{renderCard(item)}</View>
                  </View>
                );
              }

              return (
                <GestureDetector key={key} gesture={pan}>
                  <Animated.View style={[styles.cardWrap, staticStyle, topCardStyle]}>
                    <Pressable onPress={() => (onCardPress ?? onLike)(item)} style={styles.cardPress}>
                      <View style={styles.card}>{renderCard(item)}</View>
                    </Pressable>
                    <Animated.View style={[styles.stamp, styles.likeStamp, likeStampStyle]}>
                      <Text variant="bodyMedium" size={16} color={colors.success}>
                        PICK
                      </Text>
                    </Animated.View>
                    <Animated.View style={[styles.stamp, styles.passStamp, passStampStyle]}>
                      <Text variant="bodyMedium" size={16} color={colors.ink45}>
                        SKIP
                      </Text>
                    </Animated.View>
                  </Animated.View>
                </GestureDetector>
              );
            })
        )}
      </View>

      {current ? (
        <View style={styles.actions}>
          <Pressable
            onPress={() => flingOut(-1)}
            style={({ pressed }) => [styles.circleBtn, styles.passCircle, pressed && { opacity: 0.85 }]}>
            <CloseIcon size={22} color={colors.onDark} />
          </Pressable>
          <Pressable
            onPress={() => flingOut(1)}
            style={({ pressed }) => [styles.circleBtn, styles.saveCircle, pressed && { opacity: 0.85 }]}>
            <HeartIcon size={22} color={colors.accent} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  deckArea: { position: 'relative' },
  cardWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, ...shadow.card },
  cardPress: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink10,
    overflow: 'hidden',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  stamp: {
    position: 'absolute',
    top: 24,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  likeStamp: { right: 20, borderColor: colors.success, transform: [{ rotate: '-12deg' }] },
  passStamp: { left: 20, borderColor: colors.ink45, transform: [{ rotate: '12deg' }] },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  circleBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  passCircle: { backgroundColor: colors.ink },
  saveCircle: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.ink14,
  },
});
