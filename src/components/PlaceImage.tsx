import { type ReactNode, useState } from 'react';
import { type ViewStyle, type DimensionValue } from 'react-native';
import { StripePlaceholder } from '@/components/ui';
import { placePhotoUrl, staticMapUrl } from '@/core/maps';
import type { Coords } from '@/core/engine/types';

type Props = {
  coords?: Coords;
  /** Google photo resource name, if the place has one */
  photo?: string;
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
  /** pixel width to request (capped by the helpers) */
  mapSize?: number;
  children?: ReactNode;
};

type Stage = 'photo' | 'map' | 'none';

/**
 * A place's image, in order of preference: the real Google venue photo → a
 * static map of its location → the striped placeholder. Degrades a stage on
 * load error, so a broken photo falls back to the map, then the placeholder.
 * Overlays (match badge, caption) render on top via `children`.
 */
export function PlaceImage({ coords, photo, width, height, radius, style, mapSize = 400, children }: Props) {
  const hasPhoto = Boolean(placePhotoUrl(photo));
  const hasMap = Boolean(staticMapUrl(coords));
  const [stage, setStage] = useState<Stage>(hasPhoto ? 'photo' : hasMap ? 'map' : 'none');

  const uri = stage === 'photo' ? placePhotoUrl(photo, mapSize) : stage === 'map' ? staticMapUrl(coords, mapSize) : null;

  const onImageError = () => setStage((s) => (s === 'photo' && hasMap ? 'map' : 'none'));

  return (
    <StripePlaceholder
      width={width}
      height={height}
      radius={radius}
      style={style}
      imageUri={uri}
      onImageError={onImageError}>
      {children}
    </StripePlaceholder>
  );
}
