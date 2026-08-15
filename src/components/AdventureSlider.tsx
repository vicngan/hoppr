import { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, type GestureResponderEvent } from 'react-native';
import { colors } from '@/theme/tokens';

type Props = {
  /** 0..1 */
  value: number;
  onChange: (v: number) => void;
};

const TRACK_H = 6;
const THUMB = 22;

/**
 * Local ephemeral "Familiar ↔ Adventurous" slider — a lightweight
 * PanResponder-based control built from RN primitives rather than pulling in
 * `@react-native-community/slider` (not an existing project dependency), per
 * the package brief's "simple Slider or custom draggable control is fine".
 *
 * PanResponder's gesture callbacks only ever run from native touch events,
 * never during render, so reading `widthRef.current` inside them is safe —
 * but the react-hooks/refs rule can't prove that statically for a ref read
 * reachable from a function literal created in render. This is the standard
 * RN PanResponder shape; disabling the rule for this file rather than
 * contorting the gesture handlers around a lint limitation.
 */
/* eslint-disable react-hooks/refs */
export function AdventureSlider({ value, onChange }: Props) {
  const widthRef = useRef(0);

  const setFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return;
    const v = Math.max(0, Math.min(1, x / w));
    onChange(v);
  };

  // A plain `useState` initializer (not `useRef(...).current`) so the
  // PanResponder instance is created once without reading a ref during
  // render (react-hooks/refs).
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e: GestureResponderEvent) => setFromX(e.nativeEvent.locationX),
    }),
  );

  return (
    <View
      style={styles.hitArea}
      onLayout={(e) => (widthRef.current = e.nativeEvent.layout.width)}
      {...pan.panHandlers}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value * 100}%` }]} />
      </View>
      <View style={[styles.thumb, { left: `${value * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: { height: 28, justifyContent: 'center' },
  track: {
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: colors.ink16,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.accent },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.accent,
    marginLeft: -THUMB / 2,
    top: 3,
  },
});
