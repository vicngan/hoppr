# Screen Map — design `screen` key → route path

Source: full parse of `Hoppr App Prototype.dc.html`. Use these route names
verbatim — don't invent alternates. "Tab?" marks the 5 `GlobalTabBar` roots
(home/explore/saved/together/profile — Tickets swapped for Together per
user decision, see `SPEC.md` §6).

## Onboarding (linear, `src/app/onboarding/*.tsx`)

| Design key | Route | Notes |
|---|---|---|
| ob-welcome | `/onboarding/ob-welcome` | Skip → `/home` directly |
| ob-name | `/onboarding/ob-name` | |
| ob-energy | `/onboarding/ob-energy` | multi-select, `ChoiceTile` |
| ob-interests | `/onboarding/ob-interests` | multi-select, `ChoicePill` |
| ob-budget | `/onboarding/ob-budget` | single-select, `ChoiceRow` |
| ob-crew | `/onboarding/ob-crew` | single-select, `ChoiceRow` |
| ob-when | `/onboarding/ob-when` | single-select, `ChoiceRow` |
| ob-thisorthat | `/onboarding/ob-thisorthat` | 3 forced-choice pairs |
| ob-dietary | `/onboarding/ob-dietary` | multi-select + explicit Skip |
| ob-distance | `/onboarding/ob-distance` | radius visual + 3 chips |
| ob-taste | `/onboarding/ob-taste` | real 3-card swipe, see SPEC §8 |
| ob-photo | `/onboarding/ob-photo` | avatar + DOB, Skip |
| ob-notif | `/onboarding/ob-notif` | no back/progress row |
| ob-location | `/onboarding/ob-location` | no back/progress row |
| ob-account | `/onboarding/ob-account` | last step → `markComplete()` → `/home` |

## Main app

| Design key | Route | Tab? | Notes |
|---|---|---|---|
| home | `/home` | Home | replaces `(tabs)/ask.tsx` as tab root |
| ask-chips | `/ask/chips` | | tap-mode mood input |
| ask-chat | `/ask/chat` | | distinct from `/chat` (Together's group chat) |
| deck | `/deck` | | swipe recommendations |
| gems | `/gems` | | hidden gems list |
| detail-food | `/place/[id]` | | existing route, rebuilt |
| menu-entry | `/menu/[id]` (modal) | | bottom sheet: photo/browse/describe |
| menu-photo | `/menu/[id]` (modal) | | OCR-result sub-state |
| detail-event | `/place/[id]` | | no new route — `src/core/places.ts` has no distinct event entity (no `event` category, no ticket/date fields), so `detail-event` is a special case inside `place/[id].tsx`: lively bars (`category === 'bar'` + `lively` tag) get the "LIVE MUSIC TONIGHT" hero badge, a "Maya, Devon +1 are going" card → `/together/vote`, and "Get tickets · $10" → an explicit "coming soon" toast (no real ticketing pipeline this pass) |
| group-vote | `/together/vote` | | |
| chat | `/chat` | | existing route, restyled + composer made functional |
| tickets | `/together/tickets` | | reconciled under Together, see SPEC §6 |
| profile | `/profile` | Profile | replaces `(tabs)/you.tsx` |
| saved | `/saved` | Saved | replaces `(tabs)/list.tsx` |
| explore (browse) | `/explore` | Explore | replaces `(tabs)/discover.tsx`, `exploreMode='browse'` local state |
| explore (map collapsed) | `/explore` | Explore | `exploreMode='map'` |
| explore (map expanded) | `/explore` | Explore | `exploreMode='mapExpanded'` |
| notifications | `/notifications` | | reached via bell icon on Home |
| plan-invite | `/together/plan/invite` | | wizard step 1 |
| plan-waiting | `/together/plan/waiting` | | wizard step 2 |
| plan-quiz | `/together/plan/quiz` | | blank-path only |
| plan-matches | `/together/plan/matches` | | blank-path only |
| plan-datetime | `/together/plan/datetime` | | |
| plan-reserve | `/together/plan/reserve` | | |
| plan-preorder | `/together/plan/preorder` | | |
| plan-ticket | `/together/plan/ticket` | | terminal, "Done" → `/home` |

## Together (existing, restyled only — not new routes)

`(tabs)/together.tsx` (tab root, absorbs intro/ResumeHub + new "Your
tickets" entry card), `hop/{lobby,answer,swipe,pick,plan,join}.tsx`
(existing code-invite lobby path, unchanged functionally, restyled to new
tokens — remains a second entry path into the same state machine alongside
the Plan-Together wizard).

## Retired routes (old tab-root screens, deleted once replacements verified)

`(tabs)/ask.tsx` → `home.tsx` + `ask/*.tsx`
`(tabs)/discover.tsx` → `explore.tsx`
`(tabs)/list.tsx` → `saved.tsx`
`(tabs)/you.tsx` → `profile.tsx`
