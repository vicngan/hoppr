import { useRef, useState, type ReactNode } from 'react';
import { View, ScrollView, StyleSheet, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/theme/tokens';

type Props = {
  /** Fixed, non-scrolling header — typically `<AppHeader variant="wizard" .../>`. */
  header: ReactNode;
  /** Fixed, non-scrolling footer — typically the step's primary CTA `PillButton`. */
  footer?: ReactNode;
  children: ReactNode;
  contentStyle?: ViewStyle | ViewStyle[];
};

/**
 * The together/plan wizard's shared step shell: a fixed `header` and (optional)
 * fixed `footer` bracket a middle area that only scrolls once its content
 * actually overflows the available space — most steps fit on one screen and
 * should feel static, not like an empty ScrollView waiting to rubber-band.
 */
export function WizardScreen({ header, footer, children, contentStyle }: Props) {
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const viewportHeight = useRef(0);

  const onViewportLayout = (e: LayoutChangeEvent) => {
    viewportHeight.current = e.nativeEvent.layout.height;
  };
  const onContentSizeChange = (_w: number, contentHeight: number) => {
    setScrollEnabled(contentHeight > viewportHeight.current);
  };

  return (
    <View style={styles.root}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={contentStyle}
        onLayout={onViewportLayout}
        onContentSizeChange={onContentSizeChange}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.paper,
  },
});
