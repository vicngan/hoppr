/**
 * Central icon set — react-native-svg based, stroke icons matching the
 * design's ~2px rounded-cap line weight. Screen code imports icons from
 * here rather than hand-rolling SVGs per screen (see SPEC.md §2).
 *
 * Home / Explore / Saved paths are the confirmed originals from the
 * design's `TabBar.dc.html` source. The rest are original stroke-icon
 * designs built to match that line weight.
 */
import Svg, { Path, Circle, Line } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  /** only meaningful on icons that support a solid-fill active state (Saved) */
  filled?: boolean;
};

const DEFAULT_SIZE = 22;
const DEFAULT_COLOR = '#14110d';

export function HomeIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5 12 3l9 7.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 9.5V21h14V9.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ExploreIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path
        d="M15.5 8.5l-2 5-5 2 2-5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SavedIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR, filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3h12v18l-6-4-6 4z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Two-people/overlapping-circles glyph — stroke only, never fills (SPEC.md §8). */
export function TogetherIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={9} r={3.25} stroke={color} strokeWidth={2} />
      <Circle cx={15.5} cy={10.5} r={2.75} stroke={color} strokeWidth={2} />
      <Path
        d="M3.5 20c.6-3.3 3-5.25 5.5-5.25s4.9 1.95 5.5 5.25"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.5 15.1c2.1.3 3.9 2 4.4 4.9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ProfileIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={color} strokeWidth={2} />
      <Path
        d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 34px back-circle header pattern chevron. */
export function ChevronBackIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.5 5.5 8 12l6.5 6.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 18.5a2 2 0 0 0 4 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** dice / "surprise me" glyph (Home hero → `/deck`). */
export function DiceIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 5.5h14v13H5z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={9.5} r={1.15} fill={color} />
      <Circle cx={15} cy={9.5} r={1.15} fill={color} />
      <Circle cx={12} cy={12} r={1.15} fill={color} />
      <Circle cx={9} cy={14.5} r={1.15} fill={color} />
      <Circle cx={15} cy={14.5} r={1.15} fill={color} />
    </Svg>
  );
}

/** gear (profile header settings button). */
export function SettingsIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
      <Path
        d="M19 12a7 7 0 00-.2-1.6l2-1.5-2-3.4-2.3 1a7 7 0 00-2.8-1.6L13.4 2h-2.8l-.5 2.3a7 7 0 00-2.8 1.6l-2.3-1-2 3.4 2 1.5a7 7 0 000 3.2l-2 1.5 2 3.4 2.3-1a7 7 0 002.8 1.6l.5 2.3h2.8l.5-2.3a7 7 0 002.8-1.6l2.3 1 2-3.4-2-1.5A7 7 0 0019 12z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** X / close (swipe-deck pass button). */
export function CloseIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

/** heart (swipe-deck save button). */
export function HeartIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR, filled }: IconProps) {
  const d = 'M12 20.5s-7.5-4.6-10-9.3C.4 8 1.8 4.5 5.2 3.7c2-.5 4 .3 5.3 2.1a1 1 0 0 0 1.4 0c1.3-1.8 3.3-2.6 5.3-2.1 3.4.8 4.8 4.3 3.2 7.5-2.5 4.7-10 9.3-10 9.3z';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={1.8} fill={filled ? color : 'none'} strokeLinejoin="round" />
    </Svg>
  );
}

/** right-pointing arrow (chat send button). */
export function ArrowRightIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** gem / diamond icon (hidden-gems section headers). */
export function GemIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h12l4 6-10 12L2 9z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M2 9h20M8 3l-2 6 6 12 6-12-2-6" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

/** streak-flag / pennant icon (header streak pill). */
export function StreakFlagIcon({ size = DEFAULT_SIZE, color = DEFAULT_COLOR }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={6} y1={3.5} x2={6} y2={20.5} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M6 4.5h11.5l-3.25 3.75L17.5 12H6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
