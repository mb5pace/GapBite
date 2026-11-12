# UI/UX BIBLE

The look is taken from the team's reference set (the "KAFE" coffee app shots on Pinterest): warm cream paper, one deep coffee-maroon, chunky friendly headings, pill buttons, a floating rounded tab bar, arch-topped item cards and thin hand-drawn line illustrations. It should feel like a printed cafe menu that came alive, not like a tech startup. Light mode only. Follow this file exactly; if something is not covered, choose the plainest option that fits it and add it here.

## 1. Palette (fixed, sampled from the references)

Only these colours. Define them once as Tailwind theme tokens and CSS variables; never write a hex anywhere else.

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FFFCDF` | App background |
| `parchment` | `#F4EFCF` | Cards, bottom bar, sheets |
| `sand` | `#EEE8C6` | Inputs, inactive chips, dividers on parchment, item tiles |
| `blush` | `#DCBFB7` | Selected chip fill, subtle highlights, image placeholders |
| `maroon` | `#4B2220` | Primary: buttons, active tab, headings, brand |
| `espresso` | `#371110` | Body text, icons |
| `mocha` | `#6D4142` | Secondary text |
| `taupe` | `#8F706B` | Tertiary text, borders, placeholder text |
| `sun` | `#FFCC01` | Brand yellow. Gate screen panel, wordmark backdrop, the single "earn" highlight on runner earnings. Never for buttons or large in-app areas |

Status colours, muted to sit in the same family (use for text, borders and small dots, never as big fills):

| Token | Hex | Meaning |
|---|---|---|
| `olive` | `#5C6B2E` | Delivered, collected, money in |
| `amber` | `#B7791F` | Due now, unclaimed, low balance |
| `brick` | `#A3261C` | Failed late, rejected, money out, errors |

Text on `cream`/`parchment` is `espresso` or `maroon`. Text on `maroon` is `cream`. Check WCAG AA contrast for any new pairing.

`taupe` does not reach AA as text (4.3:1 on `cream`, 3.9:1 on `parchment`, 3.6:1 on `sand`). Use it only for placeholder text, disabled controls (which WCAG exempts), borders and handles. Hints, captions and any other secondary or tertiary text use `mocha` (7:1 or better). Checked ratios: espresso on cream 16.2, maroon on cream 13.1, maroon on sun 9.0, mocha on cream 8.2, brick on cream 7.1, olive on cream 5.6; amber on parchment 3.1 is fine for icons and dots only, never for text.

## 2. Typography

1. **Display:** Grandstander (Google Fonts), weights 700 and 800. Greetings, screen titles, section titles, prices on item cards, the wordmark, big codes.
2. **Text:** Figtree (Google Fonts), weights 400, 500, 700. Everything else.
3. Load both with `next/font/google`. No other fonts.
4. Scale (mobile): 32 greeting name, 24 screen title, 18 section title, 16 body, 14 secondary, 12 caption. One larger size, 72 display, only for the gate wordmark and the Admin "show code" mode (32 on phones for the code). Line height 1.25 for display (1.1 at 72), 1.5 for text.
5. Sentence case everywhere. No ALL-CAPS labels. Letter-spacing only on the access code and the 4-digit codes (token `tracking-code`).
6. Numbers that change (countdowns, balances) use `font-variant-numeric: tabular-nums`.

## 3. Shape, space, depth

1. Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40. Screen side padding 20 px on mobile.
2. Radius: pills fully rounded; cards 24; inputs 9999 (pill) or 16 for multi-line; sheets 28 on top corners. Do not round everything to the same radius.
3. **Arch card:** item cards in "Popular at UC" have a tall arch top (top corners radius = half the width) like the "Your Cravings" row in the reference.
4. Depth by colour, not shadow. Cards are `parchment` on `cream`. Allowed shadow, only on the floating bottom bar and sheets: `0 6px 20px rgba(55,17,16,0.12)`. No other shadows, no coloured shadows, no glow, no blur, no glassmorphism.
5. Borders: 1.5 px `espresso` outline is allowed on secondary pill buttons and the code boxes (the reference uses thick dark outlines). Otherwise no borders.

## 4. Components

1. **Primary pill button:** `maroon` fill, `cream` Grandstander text, height 56, with an optional round `cream` circle holding a `maroon` arrow at the right end (reference "I'm In →"). Full width at the bottom of checkout and sheets.
2. **Secondary pill:** `sand` fill, `espresso` text; or outline variant with the 1.5 px border.
3. **Icon button:** 44 px circle, `maroon` fill + `cream` icon (primary, e.g. Scan, notifications) or `sand` fill + `espresso` icon.
4. **Bottom bar:** floating 12 px above the bottom safe area, 20 px side margins, `parchment`, fully rounded, five 48 px circles. Active = `maroon` circle, `cream` Bold icon. Inactive = `sand` circle, `espresso` Regular icon. Labels hidden; use `aria-label`.
5. **Chips:** pill, `sand` default, `blush` + `maroon` text when selected. Day/slot chips use the tall capsule (min 64 px high); the selected capsule is filled `maroon` with `cream` text so it stands out in a row, and a slot that is too late is disabled.
6. **Stepper (order tracker):** vertical, a thick `maroon` rail with round icon nodes like the reference delivery screen; done = filled `maroon`, current = filled with a `sun` ring, upcoming = `sand`. Time on the right.
7. **Code boxes:** four separate rounded boxes, Grandstander 32, outline 1.5 px.
8. **Sheet:** bottom sheet on `parchment`, drag handle, 28 radius. Used for the runner popup, top-up, confirmations. No centred modals on mobile.
9. **Item tile (no photo):** a `sand` square with 20 radius showing the item's initials (e.g. "CC" for Cold Coffee) in Grandstander `maroon`, plus a tiny source glyph in the corner. Real photos replace it when the team adds them.
10. **Banner:** `parchment` strip with an icon and one sentence; amber left icon for warnings, never a coloured side stripe.
11. **Money:** `₹240` with no decimals, Indian digit grouping (`₹1,250`). Credits in `olive` with `+`, debits in `brick` with `−`.
12. **Empty states:** one line illustration, one sentence, one action.

## 5. Illustrations and imagery

1. Thin line drawings in `espresso`/`maroon` stroke on cream, like the walking person with a coffee in the references.
2. Source: **Open Peeps** by Pablo Stanley (CC0, openpeeps.com) for people, recoloured to `espresso`. Download the SVGs into `public/illustrations/` and credit them on the Terms page. Check the licence page before using.
3. Use illustrations only on: gate, empty states, the runner "accepted" and "delivered" states, Discover › Introduction, and source tiles (small).
   **Until the Open Peeps files are added** (the team will add them later), those places use one Phosphor icon, Regular weight, 40–44 px in `maroon`, inside a 96 px `sand` circle. No illustration, no other decoration. The `EmptyState` component and the gate already work this way, so swapping in a drawing later changes one component.
4. **No AI-generated images or illustrations of any kind**, no stock 3D renders, no blob shapes, no abstract mesh backgrounds.
5. Food photos only if the team takes them; otherwise item tiles.

## 6. Motion

Short and functional only: 150–200 ms ease-out for sheets, tab changes and button press (scale 0.97). Stepper node fills when status changes. Respect `prefers-reduced-motion`. No parallax, no floating shapes, no typing effects, no confetti except one small burst allowed on "Delivered" for the runner.

## 7. Layout per portal

1. **Student:** 390 px design width. On wider screens centre a 430 px column on `cream` (no fake phone frame). Bottom bar and header always visible.
2. **Cafe and Admin:** desktop layout on `cream`, top header bar in `parchment`, content max 1440 px. Same tokens, same fonts, denser spacing (12/16). Queue columns are `parchment` panels with cards in `cream`.
3. Kiosk: full-screen `maroon` background with `cream` keypad; the one deliberately dark screen, because it stands in for a machine.

## 8. Writing

Short, specific, friendly, Indian-English campus voice. Name real places. Tell people what happens next and when ("Ready by 11:42 at the Cafe Delice counter"). Errors say what to do ("Top up ₹40 more to place this order"). No exclamation marks except "Enjoy!" on success. No buzzwords, no "Oops!", no "Something went wrong" without a next step.

## 9. Banned: AI-slop patterns

These are the recognisable fingerprints of generic AI-generated interfaces. None of them may appear anywhere in QuickX. Before finishing any screen, check it against this list.

**Colour**
1. Purple, violet or indigo anywhere; Tailwind default `indigo-500`/`violet-500` style colours.
2. Gradients of any kind: backgrounds, buttons, text (`background-clip: text`), borders.
3. Neon or many saturated colours competing; aurora or mesh blobs; glows; coloured box-shadows.
4. Dark mode or a dark theme (only the kiosk is dark, by design).
5. Mid-grey body text on low contrast.

**Type**
6. Inter, Geist, Space Grotesk, Instrument Serif, Poppins as defaults; a single italic serif accent word in a sans heading.
7. ALL-CAPS section labels and eyebrow badges above headings.

**Layout**
8. A centred hero with a badge pill above the H1.
9. Three identical cards in a row each with an icon on top; bento grids for no reason.
10. Rows of big stat numbers ("10k+ orders").
11. Cards inside cards inside cards; a box around every paragraph.
12. Coloured stripe on the left or top edge of cards; rainbow side tabs.
13. Status dots that do not map to a real state.
14. Generic rounded rectangle + soft grey drop shadow on every element.
15. Glassmorphism, frosted panels, backdrop blur.
16. Emoji used as icons in nav, headers or lists.
17. Floating 3D shapes, abstract blobs, sparkle icons for "AI".

**Copy and content**
18. "Seamless", "elevate", "unlock", "empower", "revolutionize", "next-level"; "Get Started" / "Learn More" as button text.
19. Placeholder people and brands ("John Doe", "Acme"). Use realistic Ahmedabad University names and the real cafe names.
20. Em-dash-heavy, over-punctuated microcopy.

**Library look**
21. Out-of-the-box shadcn/ui or default component-kit styling. Build our own components from section 4.

Sources for this list: Adrian Krebs, "Scoring 500 Show HN pages for AI design patterns" (adriankrebs.ch/blog/design-slop); The Fountain Institute, "7 Signs a UI Has Been Vibe Coded" (thefountaininstitute.com/blog/signs-vibe-coded-ui); 925studios, "AI Slop Fonts and Gradients" (925studios.co/blog/ai-slop-design-tells); Impeccable "Slop" patterns list (impeccable anti-patterns); superdesign.dev, "Why AI Design Looks Generic".

## 10. Review checklist (every screen)

Only palette tokens used. Two fonts only. No banned pattern. Thumb-reachable primary action. Works at 360 px width. Tap targets ≥ 44 px. Every state designed: loading (sand skeleton blocks, no spinners on full screens), empty, error, success. Real place and item names in all sample content.
