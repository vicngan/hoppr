/**
 * Hoppr design tokens — translated from the `Hoppr Web.dc.html` design.
 * A single warm, paper-toned light theme (the design commits to one look).
 */

export const colors = {
  /** app background behind the device */
  appBg: '#e9e5dc',
  /** primary screen surface ("paper") */
  paper: '#f7f2e8',
  /** raised cards */
  card: '#fffdf8',
  /** panels / secondary surfaces (tab bar, sheets) */
  panel: '#f4eee3',
  /** slightly warmer fill for chips / inset controls */
  fill: '#efe8da',
  /** primary text / near-black ink */
  ink: '#14110d',
  /** rust accent */
  accent: '#c8431c',
  accentPressed: '#9c320f',
  /** inverse text on ink/accent */
  onDark: '#f7f2e8',

  // ink alphas (used constantly in the design for muted text & borders)
  ink80: 'rgba(20,17,13,0.8)',
  ink72: 'rgba(20,17,13,0.72)',
  ink70: 'rgba(20,17,13,0.7)',
  ink60: 'rgba(20,17,13,0.6)',
  ink55: 'rgba(20,17,13,0.55)',
  ink50: 'rgba(20,17,13,0.5)',
  ink45: 'rgba(20,17,13,0.45)',
  ink42: 'rgba(20,17,13,0.42)',
  ink40: 'rgba(20,17,13,0.4)',
  ink25: 'rgba(20,17,13,0.25)',
  ink20: 'rgba(20,17,13,0.2)',
  ink16: 'rgba(20,17,13,0.16)',
  ink14: 'rgba(20,17,13,0.14)',
  ink12: 'rgba(20,17,13,0.12)',
  ink10: 'rgba(20,17,13,0.1)',
  ink08: 'rgba(20,17,13,0.08)',
} as const;

/** the diagonal-stripe placeholder used everywhere a photo will go */
export const stripe = {
  light: '#e4dccb',
  dark: '#ded5c1',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  pill: 100,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 40,
} as const;

/** hairline border helper */
export const hairline = { borderWidth: 1, borderColor: colors.ink10 } as const;

export const shadow = {
  card: {
    shadowColor: '#14110d',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
} as const;
