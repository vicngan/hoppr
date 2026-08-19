import { Image, type ImageStyle, type StyleProp } from 'react-native';

const MARK_LOGO = require('../assets/brand/hoppr-mark-v2-trimmed.png');

/** Small icon-only rabbit mark, meant to sit directly beside a screen's title text. */
export function BrandMark({ size = 22, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={MARK_LOGO} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
