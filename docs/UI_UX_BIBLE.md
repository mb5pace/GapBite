# UI/UX BIBLE

The look is taken from the team's reference set (the "KAFE" coffee app shots on Pinterest): warm cream paper, one deep coffee-maroon, confident bold headings, pill buttons, a floating rounded tab bar, arch-topped item cards and thin hand-drawn line illustrations. It should feel like a printed cafe menu that came alive, not like a tech startup. Light mode only. Follow this file exactly; if something is not covered, choose the plainest option that fits it and add it here.

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

### Source colours, only for cafe tiles, menu headers and Cafe tickets

One colour for each place, used as the background of its tile on Home, of the header card on its menu page and of the header strip on its Cafe ticket (v1.0.0 Phase C1), with text in `cream`; and as an 8 px dot beside the place's name on the Cafe desk's switches and source filter. Nowhere else. Contrast of `cream` (`#FFFCDF`) on each:

| Token | Hex | Place | `cream` on it |
|---|---|---|---|
| `src-truly-indian` | `#4B2220` | Truly Indian (same as `maroon`) | 13.1:1 |
| `src-global-bistro` | `#6D4142` | Global Bistro (same as `mocha`) | 8.2:1 |
| `src-cafe-delice` | `#8F6A3E` | Cafe Delice | 4.7:1 |
| `src-greens-grains` | `#4F5E2A` | Greens and Grains | 6.8:1 |
| `src-vending` | `#371110` | UC Vending Machine (same as `espresso`) | 16.2:1 |

All pass AA (4.5:1) for normal text. The status words under a tile are on `cream`, never on these colours. The status dots (`olive`, `amber`, `brick`, `taupe`) are small and always sit next to their words.

Text on `cream`/`parchment` is `espresso` or `maroon`. Text on `maroon` is `cream`. Check WCAG AA contrast for any new pairing.

`taupe` does not reach AA as text (4.3:1 on `cream`, 3.9:1 on `parchment`, 3.6:1 on `sand`). Use it only for placeholder text, disabled controls (which WCAG exempts), borders and handles. Hints, captions and any other secondary or tertiary text use `mocha` (7:1 or better). Checked ratios: espresso on cream 16.2, maroon on cream 13.1, maroon on sun 9.0, mocha on cream 8.2, brick on cream 7.1, olive on cream 5.6; amber on parchment 3.1 is fine for icons and dots only, never for text.

## 2. Typography

1. **One family: Plus Jakarta Sans** (Google Fonts), weights 400, 500, 600, 700 and 800, for all text, headings and numbers. It reads as professional and calm; the earlier rounded display face read as playful, which is not the tone of a payments-and-orders app. Headings use 700 to 800, body text 400 to 500, buttons and labels 600 to 700.
2. **The one exception:** the QuickX wordmark on the gate screen keeps its chunky Grandstander (weight 800, loaded for this alone) because it is the logo. It is the class `font-wordmark`. Nothing else uses it, not even the portal headers.
3. Load with `next/font/google`. No other fonts. Still banned as defaults: Inter, Geist, Space Grotesk, Instrument Serif, Poppins.
4. **Scale (mobile) and weights.** The sizes are unchanged; the weights are new. Line height 1.25 for headings (1.1 at 72), 1.5 for text.

   | Use | Size | Weight |
   |---|---|---|
   | Greeting name, wallet balance | 32 | 800 |
   | Screen title | 24 | 800 |
   | Section title, card title | 18 | 700 |
   | Buttons, chips, labels | 16 or 14 | 600 to 700 |
   | Body | 16 | 400 to 500 |
   | Secondary text | 14 | 400 to 500 |
   | Caption | 12 | 400 to 500 |
   | Display (gate wordmark, Admin "show code") | 72 (32 on phones for the code) | 800 |

   Plus Jakarta Sans is wider than the faces it replaces, so a screen title that has a Back button sits on its own full-width line under the Back, Scan and wallet row. A title is never allowed to break inside a word.
5. Sentence case everywhere. No ALL-CAPS labels. Letter-spacing only on the access code and the 4-digit codes (token `tracking-code`).
6. Numbers that change (countdowns, balances) use `font-variant-numeric: tabular-nums`.

## 3. Shape, space, depth

1. Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40. Screen side padding 20 px on mobile.
   Icon sizes in the student portal: 20 or 24 px only. The only larger icons are the loading view's `CookingPot` (56 px) and the empty-state icon in its 96 px circle (40–44 px).
2. Radius: pills fully rounded; cards 24; inputs 9999 (pill) or 16 for multi-line; sheets 28 on top corners. Do not round everything to the same radius.
3. **Arch card:** item cards in "Popular at UC" have a tall arch top (top corners radius = half the width) like the "Your Cravings" row in the reference.
4. Depth by colour, not shadow. Cards are `parchment` on `cream`. Allowed shadow, only on the floating bottom bar and sheets: `0 6px 20px rgba(55,17,16,0.12)`. No other shadows, no coloured shadows, no glow, no blur, no glassmorphism.
5. Borders: 1.5 px `espresso` outline is allowed on secondary pill buttons and the code boxes (the reference uses thick dark outlines). Otherwise no borders.

## 4. Components

1. **Primary pill button:** `maroon` fill, `cream` Plus Jakarta Sans 700 text, height 56, with an optional round `cream` circle holding a `maroon` arrow at the right end (reference "I'm In →"). Full width at the bottom of checkout and sheets.
2. **Secondary pill:** `sand` fill, `espresso` text; or outline variant with the 1.5 px border.
3. **Icon button:** 44 px circle, `maroon` fill + `cream` icon (primary, e.g. Scan, notifications) or `sand` fill + `espresso` icon.
4. **Bottom bar:** floating 12 px above the bottom safe area, 20 px side margins, `parchment`, fully rounded, five 48 px circles. Active = `maroon` circle, `cream` Bold icon. Inactive = `sand` circle, `espresso` Regular icon. Labels hidden; use `aria-label`.
5. **Chips:** pill, `sand` default, `blush` + `maroon` text when selected. Day/slot chips use the tall capsule (min 64 px high); the selected capsule is filled `maroon` with `cream` text so it stands out in a row, and a slot that is too late is disabled.
6. **Stepper (order tracker):** vertical, a thick `maroon` rail with round icon nodes like the reference delivery screen; done = filled `maroon`, current = filled with a `sun` ring, upcoming = `sand`. Time on the right.
7. **Code boxes:** four separate rounded boxes, Plus Jakarta Sans 700 at 32, outline 1.5 px.
8. **Sheet:** bottom sheet on `parchment`, drag handle, 28 radius. Used for the runner popup, top-up, confirmations. No centred modals on mobile.
9. **Item tile (no photo):** a `sand` square with 20 radius showing the item's initials (e.g. "CC" for Cold Coffee) in Plus Jakarta Sans 700 `maroon`, plus a tiny source glyph in the corner. Real photos replace it when the team adds them.
10. **Banner:** `parchment` strip with an icon and one sentence; amber left icon for warnings, never a coloured side stripe.
11. **Money:** `₹240` with no decimals, Indian digit grouping (`₹1,250`). Credits in `olive` with `+`, debits in `brick` with `−`.
12. **Empty states:** one line illustration, one sentence, one action.
13. **Due and alert states (Phase 8):** a card that is due, or a Ready delivery with no runner for 3 minutes, gets a 2 px `amber` ring all round (a full border, never a side stripe) and, where there is room, a small amber warning icon. Alert cards pinned above the cafe queue are `cream` with a 2 px ring: `brick` for a failed order or a bag being brought back, `amber` for a no-show. The colour is the ring and the icon only; the words stay in `espresso`, so contrast is never a problem. Same rule as the Banner: amber is never used as text.
14. **List row (Phase 9):** the Account and Discover rows: `parchment` card, 44 px `sand` icon circle, bold title, a `mocha` hint line and a caret. At least 64 px tall; the whole row is the tap target. A row that opens a sheet (Log out) is the same row as a button.
15. **Accordion (Phase 9):** the FAQ. `parchment` cards; the title row is the button (at least 56 px) with a caret that turns when open and `aria-expanded`, so the state is not shown by colour alone. Any number can be open.
16. **Face rating (Phase 9):** five 56 px circles, worst to best (Phosphor smileys). The chosen one is filled on `blush`. It is one radio group with arrow-key support.
17. **Text area (Phase 9):** like the Input: `sand`, no border, a visible label, a hint, an error line and a character counter when there is a limit.
18. **Loading view (v1.0.0):** shown only while something is actually loading, never as a delay. The Phosphor `CookingPot` in `maroon`, 56 px, with three thin `taupe` steam lines that rise about 20 px and fade in a 3-second loop (CSS only, staggered), and "Your food is on the stove…" under it in `mocha` body text, on `cream`. The icon's own three vent marks are cut off so the moving steam is the only steam. The student, Cafe and Admin route groups use it between pages with their header (and the student bottom bar) kept in place; the gate and Identify cover the window with it from the moment a code is accepted until the first page arrives. With reduced motion the steam stands still. No mascot, no illustration, no wording borrowed from another app.
19. **Cafe tile (B1):** a square (1:1, 20 radius) in the place's source colour, a 24 px Phosphor icon in `cream` top left (CookingPot, Hamburger, Coffee, Leaf; Storefront for vending), and the place's name bottom left as a wordmark: Plus Jakarta Sans 800 at the title size, `cream`, no logo from anywhere. The vending tile spans the full width at 2:1. Under it: the name (600, sentence case) and one status line with a 8 px dot.
20. **Order progress line (B1):** four equal segments, 4 px gaps, 8 px high, `sand` track and `maroon` fill, each stage's label under it in the caption size (the current one 600 in `espresso`, the rest `mocha`). A 20 px Phosphor `PersonSimpleWalk` in `maroon` sits at the end of the fill and bobs 2 px up and down every 600 ms; it stands still with reduced motion. The fill follows the real status only.
21. **Category tabs (B1):** sticky under the header, text only, 24 px apart, the open one `maroon` 700 with a 3 px `maroon` underline, the rest `mocha` 500. Horizontal scroll, no scrollbar.
22. **Menu item card (B1):** a 96 px picture (16 radius) on the right with an outlined pill **Add** (1.5 px `maroon` border, `cream` fill, `maroon` text, 44 px high) overlapping its bottom edge; on the left the veg mark (a 16 px `olive` square outline with an 8 px `olive` dot), the name 600, the description in `mocha`, the price 700 with tabular figures, and a `sand` pill "Prep 6 min" with a Phosphor `Timer`. In the Unavailable section the text is `taupe`, a `sand` chip carries the reason in `espresso`, and Add is `taupe` and off. These cards are disabled content, the one place `taupe` is used for item text (the reason chip stays at full contrast).

## 5. Illustrations and imagery

1. Thin line drawings in `espresso`/`maroon` stroke on cream, like the walking person with a coffee in the references.
2. Source: **Open Peeps** by Pablo Stanley (CC0, openpeeps.com) for people, recoloured to `espresso`. Download the SVGs into `public/illustrations/` and credit them on the Terms page. Check the licence page before using.
3. Use illustrations only on: gate, empty states, the runner "accepted" and "delivered" states, Discover › Introduction, and source tiles (small).
   **Until the Open Peeps files are added** (the team will add them later), those places use one Phosphor icon, Regular weight, 40–44 px in `maroon`, inside a 96 px `sand` circle. No illustration, no other decoration. The `EmptyState` component and the gate already work this way, so swapping in a drawing later changes one component.
4. **No AI-generated images or illustrations of any kind**, no stock 3D renders, no blob shapes, no abstract mesh backgrounds.
5. Food photos only if the team takes them; otherwise item tiles.

## 6. Motion

Short and functional only: 150–200 ms ease-out for sheets, tab changes and button press (scale 0.97). Stepper node fills when status changes. Respect `prefers-reduced-motion`. The loading view's steam (3 s) and the little walker on the Home progress line (600 ms bob, 2 px) are the only looping animations, both CSS only, and both stop under reduced motion. No parallax, no floating shapes, no typing effects, no confetti except one small burst allowed on "Delivered" for the runner.

## 7. Layout per portal

1. **Student:** 390 px design width. On wider screens centre a 430 px column on `cream` (no fake phone frame). Bottom bar and header always visible.
2. **Cafe and Admin:** desktop layout on `cream`, same tokens, same fonts, denser spacing (12/16). Admin has a top header bar in `parchment`, content max 1440 px. The **Cafe desk is a POS** (v1.0.0 Phase C1): a fixed `parchment` sidebar (220 px from 1280 px, a 72 px icon rail below that) with 48 px rows, the open one filled `maroon` with `cream` text; a `parchment` top bar; every touch target at least 48 px (PillButton, Chip and Toggle have a `desk` size of 48 px; a ticket's main action is the `ticket` size, at least 56 px, growing if its words wrap). The kitchen slip prints in one colour, `espresso`, on 80 mm paper. Queue columns are `parchment` panels with kitchen tickets in `cream`.
   **POS tickets (exception).** A kitchen ticket may carry an outline that shows its age, all the way round (never a side or top stripe): a 2 px `amber` outline when a New ticket has waited `NEW_AMBER_MIN` (2) minutes or a delivery is due within `DUE_SOON_MIN` (2) minutes or a Ready delivery has had no runner for 3 minutes; a 3 px `brick` outline when a New ticket has waited `NEW_RED_MIN` (5) minutes (with a `brick` "Waiting" badge) or a delivery is past its promised time, through grace. Its header strip is in the place's source colour. The alerts are one `brick` bar with `cream` text above the columns. The Today page may open with a row of large number tiles (orders, delivered, collected, failed, revenue): real counts for the desk, the one allowed exception to banned pattern 10.
3. Kiosk: full-screen `maroon` background with `cream` keypad; the one deliberately dark screen, because it stands in for a machine.

## 8. Writing

Short, specific, friendly, Indian-English campus voice. Name real places. Tell people what happens next and when ("Ready by 11:42 at the Cafe Delice counter"). Errors say what to do ("Top up ₹40 more to place this order"). No exclamation marks except "Enjoy!" on success. No buzzwords, no "Oops!", no "Something went wrong" without a next step.

## Colour consistency

The team saw different greys on different phones and browsers. These rules make QuickX render the same palette everywhere. They are checked by a test that renders the app in light, in dark and in Chrome's forced dark mode and compares the pixels.

1. **Light only, said twice.** `<meta name="color-scheme" content="only light">` in the page head (set in `app/layout.tsx`) and `color-scheme: only light` on `:root`. Browsers that force dark mode on websites (Chrome Android "Darken websites", Samsung Internet, Opera, Edge) then leave the app alone. `only` matters: `light` without it is still darkened. There is no `dark:` variant and no `prefers-color-scheme` query anywhere in the code.
2. **Address bar.** `<meta name="theme-color" content="#FFFCDF">` (also in `app/layout.tsx`). A `<meta>` tag cannot read a CSS token, so this one hex value is written outside `globals.css`; it is `cream`.
3. **Plain sRGB only.** Every colour is a hex value from section 1, defined once in `globals.css`. No named or Tailwind default colours (`gray`, `slate`, `white`, `black`, ...: the default palette is switched off), no `oklch`, `oklab` or `color-mix`, and **no opacity modifiers on palette colours** (`bg-maroon/50`, `text-espresso/70`, `opacity-50`). A tint blends differently on different backgrounds and screens. If a lighter shade is needed, use an existing token or ask. The one translucent colour is `scrim`, the dim layer behind sheets and dialogs: `#37111066` (espresso at 40%), written as plain sRGB with alpha so every browser blends it the same way. The one shadow is `shadow-float` (section 3).
4. **Tailwind's reset is our own copy.** `app/preflight.css` is Tailwind's preflight with its `color-mix` placeholder rule removed, imported next to Tailwind's theme and utilities in `globals.css`. The placeholder colour is `taupe`. After a Tailwind upgrade, copy the file again and remove that one rule again.
5. **Explicit colours on the page and on controls.** `html` and `body` set `cream` and `espresso`. `input`, `textarea` and `select` set `appearance: none`, `sand` and `espresso`; `button` sets `appearance: none`, a transparent background and inherited text colour (every button styles itself from the tokens). Autofill is painted `sand` with `espresso` text, not the browser's yellow or blue. `-webkit-tap-highlight-color: transparent`, `accent-color` and `caret-color` are `maroon`, text selection is `blush`, scrollbars use `taupe` on `cream`.
6. **Every page paints its own background.** `html` and `body` are `cream` on every route, so no browser white or grey shows through the gate, Identify, the kiosk (`maroon`, set on its own container) or the missing-page and error pages. `app/not-found.tsx`, `app/(student)/not-found.tsx`, `app/error.tsx` and `app/global-error.tsx` replace Next's built-in pages, which are hard-coded white and black and swap on dark phones.
7. **How to check.** Chrome DevTools › Rendering › Emulate CSS media feature `prefers-color-scheme: dark`, then turn on the flag `chrome://flags/#enable-force-dark` (Auto Dark Mode for Web Contents) and reload: nothing may change. Known limit: with that flag on and the system theme *light*, Chrome darkens every site whatever it declares; real phones only offer "Darken websites" with a dark theme, which is the case the app handles.

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
