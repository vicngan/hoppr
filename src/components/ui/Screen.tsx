import { type ReactNode } from 'react';
import { ScrollView, View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme/tokens';

type Props = {
  children: ReactNode;
  /** wrap content in a ScrollView (default true) */
  scroll?: boolean;
  /** horizontal padding on the content (default 20 — the design's gutter) */
  gutter?: number;
  /** extra style for the content container */
  contentStyle?: ViewStyle;
  /** apply top safe-area padding (default true) */
  padTop?: boolean;
};

/**
 * Standard screen surface: paper background + safe-area handling.
 * The design renders as a single mobile column, so this fills the device.
 */
export function Screen({ children, scroll = true, gutter = spacing.xl, contentStyle, padTop = true }: Props) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingHorizontal: gutter,
    paddingTop: padTop ? insets.top + spacing.xl : 0,
    paddingBottom: spacing.xxxl,
  };

  if (!scroll) {
    return <View style={[styles.root, pad, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[pad, contentStyle]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
});
