# Hoppr Design System

Source of truth: `src/theme/tokens.ts` + `src/theme/fonts.ts`, translated
from the Claude Design project *"Hoppr discovery app design"*
(`Hoppr Web.dc.html`). Brand assets live in `assets/brand/`.

## Direction

A single warm, paper-toned **light theme** — the design commits to one look,
there is no dark mode variant. Editorial, mascot-driven discovery app, not a
generic dashboard or SaaS surface.

## Palette (`src/theme/tokens.ts`)

| Token | Value | Use |
|---|---|---|
| `appBg` | `#e9e5dc` | behind the device frame |
| `paper` | `#f7f2e8` | primary screen surface |
| `card` | `#fffdf8` | raised cards |
| `panel` | `#f4eee3` | tab bar, sheets |
| `fill` | `#efe8da` | chips, inset controls |
| `ink` | `#14110d` | primary text |
| `accent` | `#c8431c` | rust accent |
| `accentPressed` | `#9c320f` | pressed state |
| `onDark` | `#f7f2e8` | text on ink/accent |

Muted text/borders use `ink08`–`ink80` alpha steps (see tokens.ts) rather
than separate gray colors — stay on the ink alpha ramp instead of introducing
new grays.

## Typography (`src/theme/fonts.ts`)

- **Instrument Serif** — display/editorial headlines
- **DM Sans** — body, buttons, UI
- **JetBrains Mono** — labels, metadata

## Other tokens

- `radius`: sm 8, md 12, lg 14, xl 16, xxl 20, pill 100
- `spacing`: xs 4, sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 40
- `hairline`: 1px `ink10` border helper
- `shadow.card`: the standard raised-card shadow

## Components

Reuse `src/components/ui/` primitives (`Card`, `Kicker`, `MatchBadge`,
`MeterBar`, `PillButton`, `ProgressDots`, `Screen`, `StripePlaceholder`,
`Text`) before adding new ones. `StripePlaceholder` is the diagonal-stripe
placeholder used everywhere a photo hasn't loaded — photo resolution order is
Google Places photo → static map → stripe placeholder.

`GlobalTabBar` (`src/components/`) is rendered once in the root layout, not
per-screen — don't re-implement tab bar UI inside individual screens.
