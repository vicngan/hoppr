import { type ReactNode, useMemo } from 'react';
import { View, StyleSheet, type ViewStyle, type DimensionValue } from 'react-native';
import { colors, radius as radii, stripe } from '@/theme/tokens';

type Props = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
  /** overlays (caption, match badge, etc.) rendered above the stripes */
  children?: ReactNode;
  /** width of each diagonal band */
  band?: number;
};

/**
 * The diagonal two-tone "photo pending" placeholder used everywhere in the
 * design (`repeating-linear-gradient(135deg, …)`). React Native can't do a
 * repeating gradient, so we approximate with rotated alternating bands clipped
 * by the rounded container.
 */
export function StripePlaceholder({
  width = '100%',
  height,
  radius = radii.lg,
  style,
  children,
  band = 9,
}: Props) {
  // A large rotated square guarantees full coverage for any placeholder up to
  // ~700px on its longest side (plenty for a phone column).
  const SIZE = 760;
  const bands = useMemo(() => {
    const count = Math.ceil(SIZE / band);
    return Array.from({ length: count }, (_, i) => i);
  }, [band]);

  return (
    <View style={[{ width, height, borderRadius: radius }, styles.clip, style]}>
      <View style={styles.fill} pointerEvents="none">
        <View style={[styles.rotor, { width: SIZE, height: SIZE }]}>
          {bands.map((i) => (
            <View
              key={i}
              style={{
                width: band,
                height: SIZE,
                backgroundColor: i % 2 === 0 ? stripe.light : stripe.dark,
              }}
            />
          ))}
        </View>
      </View>
      {children ? <View style={styles.overlay}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', backgroundColor: stripe.light },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  rotor: { flexDirection: 'row', transform: [{ rotate: '45deg' }] },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 10 },
});

/** small mono caption for the bottom-left of a placeholder */
export function stripeCaptionColor() {
  return colors.ink40;
}
