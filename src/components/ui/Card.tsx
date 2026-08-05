import { type ReactNode } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme/tokens';

type Props = {
  children: ReactNode;
  /** highlight with the rust accent border (the "featured" card in the design) */
  accent?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
};

/** The warm off-white card surface used across the app. */
export function Card({ children, accent, onPress, style, padded = true }: Props) {
  const body = (
    <View
      style={[
        styles.base,
        accent ? styles.accent : styles.hairline,
        padded && styles.padded,
        style,
      ]}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        {body}
      </Pressable>
    );
  }
  return body;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  padded: { padding: 18 },
  hairline: { borderWidth: 1, borderColor: colors.ink12 },
  accent: { borderWidth: 1.5, borderColor: colors.accent },
});
