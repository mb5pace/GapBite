# BUILD PLAN

Build in this order. One phase per session or per sitting. At the end of each phase: `npm run build` passes, the deployed preview works, tick the boxes, commit, push.

## Phase 0 — Project setup
- [x] Create Next.js app (App Router, TypeScript strict, Tailwind, ESLint) in the repo root
- [x] Install only: `@upstash/redis jose swr zod qrcode @yudiel/react-qr-scanner @phosphor-icons/react` (+ `@types/qrcode`)
- [x] Tailwind theme tokens and fonts from UI_UX_BIBLE.md §1–2; `globals.css` sets cream background
- [x] `lib/config.ts` with every constant from BUSINESS_RULES.md
- [x] `data/locations.ts`, `data/breaks.ts`, `data/menu.ts` from LOCATIONS.md and MENU.md
- [x] `lib/redis.ts` client, `.env.example`
- [x] `/api/health` route that writes and reads one Redis key (tested against a stand-in Redis only; confirm on the real one after the next box)
- [x] By hand: deploy to Vercel, add Upstash for Redis, add env vars, open `/api/health` and see `"ok":true`

## Phase 1 — Access
- [x] Gate screen, `/api/auth/login`, rate limit
- [x] Session cookie (`lib/session.ts`), `proxy.ts` (Next.js 16 name for `middleware.ts`)
- [x] Temp code pool fill and atomic burn (`lib/codes.ts`)
- [x] Identify screen (AU / staff), user records
- [x] Logout; temp-session countdown chip
- [x] Minimal Admin › Codes page so the team can get temp codes
- [x] Admin › Staff accounts (pulled forward from Phase 6): `/admin/staff`, Add staff creates the next `QX-STF-NN` from `qx:staff:seq`, Admin header links, Identify › "I'm QuickX staff" works and the role is `staff`
- [x] Team answers applied: 30 wrong tries per IP, masked gate input with eye button, first names with spaces, apostrophes and hyphens, Phosphor icon in a sand circle instead of illustrations

## Phase 2 — UI kit and student shell
- [x] Components from bible §4: buttons, icon button, chips, card, arch card, item tile, sheet, stepper, code boxes, banner, money, empty state
- [x] Student layout: header (greeting, Scan, wallet chip), floating bottom bar
- [x] A `/kit` page (admin-only) showing every component for visual review

## Phase 3 — Browse and cart
- [x] Home (sources, search, popular, next break strip)
- [x] Source menu pages, vending grid with stock
- [x] Cart (one source rule), cart bar, local cart state (in memory + sessionStorage wrapped in try/catch)

## Phase 4 — Wallet
- [x] Wallet page, mock UPI top-up sheet, ledger
- [x] Balance rules and banners (₹50 block, ₹100 suggestion)
- [x] Admin › Users and wallet adjust

## Phase 5 — Ordering
- [x] Checkout (mode, building, when, bill, pay)
- [x] Atomic place-order, server re-pricing, stock decrement
- [x] Order Detail with stepper and code box
- [x] Orders tab (Active/Past), cancel while PLACED
- [x] Updates feed and unread dot

## Phase 6 — Cafe portal
- [x] Queue columns with polling and sweepLate
- [x] Accept/reject/start/ready, bag slip with QR + print
- [x] Pickup collect by code
- [x] Send with staff (staff accounts already exist, see Phase 1)
- [x] Vending stock, kiosk, menu availability, Today

### Phase 6 check (quality pass before commit)
What was checked, and what it found and fixed.
- **Build:** `npm run build`, `npx tsc --noEmit` and `npm run lint` are clean. No formatter is set up in the repo (no Prettier or Biome), so none was run and none was added.
- **Code read** (every file under `app/`, `components/`, `lib/`, `data/`):
  - Removed leftovers that are real now: six "opens in the next phase" strings, `cafe.placeholder`, and the unused exports `msUntilExpiry`, `canUseWallet`, `BUILDING_IDS`, `SOURCE_IDS`.
  - Replaced one `as never` cast with a proper narrowing.
  - Moved numbers into `lib/config.ts`: three UI timings (`SEARCH_DELAY_MS`, `CLOCK_TICK_MS`, `MARK_READ_DELAY_MS`), the Home strip length, the Admin adjust presets, the default top-up chip and the input length limits (`INPUT_MAX`).
  - The cafe screens reuse `itemsBySource` and `VENDING_SLOTS` instead of filtering the menu again.
  - No `console.log`, no hex colour outside `globals.css`, no price or item name written in code, no `process.env` outside `lib/`.
  - Stale comments from earlier phases updated.
- **Client code never reaches the server:** an import-graph check over all 58 client components found none that reaches `lib/redis.ts`, `node:crypto`, `jose` or `next/headers`, directly or through another file.
- **Security:**
  - All 23 API routes check their portal session on the server (cafe routes cafe, admin routes admin, the rest student); a script confirmed it for every handler, and a test confirmed 401 without a session and 403 for a student or admin session on all 10 cafe routes.
  - No cafe response carries a 4-digit code, buyer ID, name or price. Only the buyer's own order routes return `code`.
  - **Found and fixed:** an unexpected Redis error was logged with its full message, and an Upstash message ends with the command it ran, including Lua arguments (typed access codes, an order's 4-digit code). `handle()` now logs only the name and the reason (`logSafeMessage`).
  - No env value in the client bundles, rendered pages, the login reply or the server logs. The session cookie is HttpOnly and SameSite=Lax and holds only portal, code type and expiry (plus the code for a temp session). The kit gallery no longer ships a sample permanent code.
  - Every wallet and ownership change is one Lua script (place, refund, move money, advance). Redis writes outside Lua are user and staff creation, rate-limit counters, pool codes, stock set-up and refill, and the availability set: none holds money or order ownership.
- **UI** (bible sections 9 and 10): a browser audit read computed styles on 51 screens (student at 360 px, cafe at 1280 and 820, Admin at 1280, sheets and dialogs open). Palette tokens only, two fonts, no gradients, blur or emoji, shadows only on the bottom bar and sheets, WCAG AA contrast, 44 px tap targets, accessible names, no sideways scroll. **Found and fixed:** a shadow on the toast; Checkout's "Change items" link and the Wallet ledger's order links were under 44 px (a ledger row about an order is now one link); the cafe queue had no page heading; the kit gallery showed status colours as text; the kiosk was cut off at 1280×800 (now two columns); the cafe header broke its buttons onto two lines on a tablet. Loading, empty and error states exist on every cafe screen (skeletons, "Nothing cooking." and the like, a banner when the queue cannot be reached).
- **Flows** (stand-in Redis, wallet, ledger, stock and Updates compared after every step): pickup, delivery sent with staff, vending through the kiosk, buyer cancel while PLACED, cafe reject. All pass, including two laptops tapping the same button at once (one wins) and cancel against reject (one refund).
- **Totals:** unit tests 110; API suites 480 (integration 135, wallet 71, orders 109, cafe 125, flows 40); browser suites 479 (access 52, shell 65, browse and cart 73, wallet 62, ordering 88, cafe 111, and 28 for `docs/ACCESS_GUIDE.md` followed step by step), plus the 51-screen style audit.

## Phase 7 — Runner
- [x] Scan button + runner sheet (camera + manual entry)
- [x] Preview and atomic accept, all error messages
- [x] My runs in Orders (students and staff, including Send with staff), I'm here, handover code entry, earning credit
- [x] Admin › Live orders with Reveal code (pulled forward from Phase 10)

## Phase 8 — Late handling
- [x] Promised time math (`lib/time.ts`, `lib/late-rules.ts`), countdowns, amber due state in buyer, runner, cafe and Admin views
- [x] `sweepLate` with penalty lock: `FAILED_LATE` (runner debited, staff, before pickup) and `NO_SHOW`, refunds, Updates
- [x] Cafe alert cards (Seen, Returned, no-show collect), 3-minute "No runner yet" highlight
- [x] Settle the two old staff orders QX-2959 and QX-3846 on the first sweep (tested with orders of the same shape: sent with staff, overdue by hours, in nobody's run list)
- [x] Test: let each kind of late order expire on purpose and check every wallet, ledger entry, Update and screen

## Phase 9 — Account and Discover
- [x] Profile, Preferences, Notifications, Order History, Refund Status, Terms, Feedback, Support
- [x] Discover pages and FAQ

## Phase 10 — Demo polish
(The demo tools, the quality pass and the real-device test are carried into v1.0.0 Phase C below.)
- [ ] Admin demo tools (seed, reset). (Live orders was pulled forward to Phase 7.) Seed still creates `QX-STF-01 Ramesh`, but through the same `qx:staff:seq` counter and only if that ID does not exist yet, because staff can now be added by hand
- [ ] Every screen checked against bible §9 and §10
- [ ] Test on two real phones + laptop at the same time over the deployed URL
- [ ] Walk through DEMO_SCRIPT.md twice end to end

## v1.0.0

Three sessions, in order. Everything is built on the `dev` branch and tested on the dev preview link (Redis prefix `qxdev:`). Main is production and only changes through a release, which the team does itself.

### Phase A: rules, data and foundations
- [x] **1. One professional font.** Plus Jakarta Sans (400, 500, 600, 700, 800) for all text, headings and numbers, `tabular-nums` kept on prices, balances and countdowns. Grandstander stays only for the QuickX wordmark on the gate. UI_UX_BIBLE section 2 updated. Every screen checked at 360 px.
- [x] **2. Menu data.** Required `category` on every item, new item Matar Paneer Paratha (`ti-matar-paneer-paratha`, ₹60, prep 6), and the old `morning` tag and 11:30 rule removed everywhere (config, server, UI text, docs, tests). MENU.md updated.
- [x] **3. Opening hours, item windows, holidays.** Defaults in `data/hours.ts`, live values in one Redis hash, pure rules shared by browser and server. The ordering rule (a to f) is enforced in place-order on the server with plain refusal messages. Break slot chips and the Home "Next break" strip respect hours and item windows. Orders already placed are never affected.
- [x] **4. Pause switches.** Per source "Taking orders / Paused" (Cafe portal). Service-wide "QuickX available / not available" with an editable message, only from the new Admin › Service page, with a banner on every student screen. Neither touches active orders.
- [x] **5. Cafe "Hours and items" page.** Per source hours, open days and pause; holidays; per-item available-from / until and the "Available today" switch (moved here). Validation, instant effect for students.
- [x] **6. Closed states for students.** Home tile labels, a dismissible once-per-session notice, a sheet when a closed or paused source is opened (Add disabled), "Unavailable now" at the bottom of a menu, and the cart flagging items that became unavailable.
- [x] **7. Loading view.** CookingPot icon with CSS steam and "Your food is on the stove…", used by the student, Cafe and Admin route groups, reduced motion respected, no artificial delay.
- [x] **8. Docs, changelog, tests.** BUSINESS_RULES, MENU, SCREENS, ARCHITECTURE, UI_UX_BIBLE and CHANGELOG (Unreleased) updated. Tests for Sunday and holiday closed, Global Bistro before and after 12:00, breakfast cutoffs, paused source, service off, active orders unaffected, and hours edited in the Cafe portal changing what students can order on the next poll. All earlier suites pass. build, tsc and lint clean.

### Phase B: student redesign (later session)
- [x] **Home in SmartQ style.** Location line "Ahmedabad University · UC" with a pin, search, a square cafe tile grid with Open now / Opens at HH:MM / Paused and "Ready in about X min" from that cafe's queue, Popular at UC.
- [x] **Order progress line on Home.** Four parts tied to the real status (delivery: Placed, Preparing, On the way, Delivered; pickup: Placed, Preparing, Ready at counter, Collected) with the Phosphor `PersonSimpleWalk` icon standing on the current part and a gentle walking bob, reduced motion respected, "+1 more" for a second order.
- [x] **Menu pages in SmartQ style.** Category tabs including Unavailable, search, cards with a veg dot, description, price, a "Prep N min" badge, the photo on the right if there is one, an outlined Add button.
- [x] **Order Detail.** A large QR plus the 4-digit code and "Show this screen to collect your order" for pickup and vending.
- [x] **Orders tab like the SmartQ Past screen.** Search, underlined Active / Past tabs, cards with status badge, date and time, order ID, items with prices, Share feedback and Order again, an end-of-list line.
- [x] **Scan button number badge.** A read-only list of ready delivery bags grouped by building (cafe, building, earning, waiting time). Tapping a row only says "Scan this bag at the <source> counter to take it"; nothing can be claimed remotely.
- [x] **Add to home screen.** Web manifest, icons, cream splash, standalone display.
- [x] **Visual polish pass** at 360 px.
  Every student screen (gate, identify, Home, the five menus, cart, checkout, order detail for pickup and delivery, Orders Active and Past, Updates, Wallet, Account and its sections, Discover, the runner sheet) was checked at 360 and 390 px with a script that measures spacing against the bible scale, icon sizes, cards inside cards, tap targets and the number of filled primary buttons on screen. Fixes:
  - **Icons only 20 or 24 px.** To 24 px (were 22, 30, 32 or 36): Wallet and Updates row icons, header Back arrow, search magnifier, cafe tile icon, Next break clock, gate eye button, Account and Discover row icons, feedback faces. To 20 px (were 14, 18 or 24): stepper minus and plus, Log out, the Prep badge timer, banner icons.
  - **Spacing only from the scale (4, 8, 12, 16, 20, 24, 32, 40 px).** 2 px paddings, gaps and nudges became 4 px or were removed (Prep badge, staff badge, arch card tag, unavailable reason pill, tall chip, Discover page lines, search result lines, nav row hints, banner icon, Home pin, stepper inner padding); 6 px gaps became 8 px (progress line labels); the status dot sits centred in a 20 px line box instead of a 6 px nudge; the gate and Identify pages use 40 px instead of 64 and 48.
  - **Orders card buttons.** "Share feedback" no longer wraps inside its pill: the two buttons sit side by side when both labels fit on one line and stack full width on narrower phones.
  - Already clean, no change needed: one filled primary per screen (the cart bar counts as the screen's action on menus), no cards inside cards, every tap target at least 44 px, no banned pattern from bible section 9, page headers the same on every sub-page (Back, title, Scan, wallet chip).

### Phase C: Cafe portal as a kitchen display, demo tools, release (later session)
- [ ] **Cafe portal redesigned as a POS / kitchen display.** Fixed left sidebar (Queue, Vending, Hours and items, Today); top bar with live status counts, per-source open / paused switches and the clock; tickets styled as kitchen order slips with large item lines and big action buttons; ticket colour by age (normal, amber, red); "Scan buyer QR" for pickups; printable kitchen slip; large touch targets.
- [ ] **Phase 10 demo tools.** Seed, reset (only the current environment's key prefix), and a late-test order.
- [ ] **Final quality pass** and a real two-phone plus laptop test.
- [ ] **DEMO_SCRIPT.md** updated.
- [ ] **Release v1.0.0** (done by the team, not by the build session).

## Open questions
(Add questions here when a doc is silent. Keep the simplest behaviour until answered.)

Raised in v1.0.0 Phase B2 (the brief was silent, simplest behaviour kept until answered):
- **QR lifetime.** The collect QR (and the "Show this screen" strip) shows while a pickup is Placed, Accepted, Preparing or Ready. Once it is collected, cancelled, rejected or failed, the server stops sending it and the card keeps only the ID, badge and cafe. A no-show only happens to deliveries, which never have a QR, so its counter collection still uses the 4 digits.
- **Badge words on pickup cards.** Ready reads "Ready to collect" (the existing word); Placed and Accepted are amber like Preparing.
- **Share feedback and Order again** are on Past cards only. An order still in progress has nothing to rate yet and is already on its way.
- **Order again** opens the cart once something is added, so the student sees what went in. "Keep my cart" on the replace question leaves everything as it was. Quantities are capped by the usual cart rules (10 units, vending stock).
- **Orders search** matches dish names, the cafe name and the order ID. My runs is hidden while a search is typed (the search is about your own orders).
- **Ready list leaves out the order ID** as well as the buyer and the code, so a typed ID cannot be taken from the list without going to the counter. "Minutes since ready" is counted from the server's time when the cafe marked it ready. Staff never see the top-up note.
- **Home-screen icon.** The "Q" is drawn from a ring and a tail (no font file needed at build time), cream on maroon; the maskable icon keeps the mark inside the safe circle.

Raised in v1.0.0 Phase B1 (the brief was silent, simplest behaviour kept until answered):
- **Vending tile** is full width at 2:1, not 1:1 (a 1:1 tile that wide would fill the screen). Its status line says "Open now · Ready now" because its prep time is 0.
- **Ready estimate** rounds up to a multiple of 5, so a result that is already a multiple of 5 stays as it is (10 stays 10). The tile's words (Open now, Closed today, Paused) come from the live hours, refreshed every 4 seconds with the rest of the app; only the "Ready in about N min" part waits for the 15-second `/api/status` answer, so a tile never contradicts its Add buttons.
- **Progress line stages.** A segment is full once its stage is reached (Placed is full the moment the order exists). Only Preparing and On the way fill over time, and they stop at 90%. A delivery that is Ready but has no runner shows Preparing full and On the way empty. Home shows one card (the order due first) and "+N more", so the old two-card strip is gone.
- **Unavailable tab** holds only item-level reasons (switched off, outside its own time, sold out). When a whole cafe is closed or paused, its items stay in their categories (the menu is still worth reading) with Add off, and the header line says why.
- **No veg field.** Every item at UC is vegetarian (docs/MENU.md), so the veg mark is on every item and the menu data has no new field.
- **Add button** is a full 44 px outlined pill beside the picture, so the visible button and its tap area are the same size.
- **Home header** wraps "Ahmedabad University" onto two lines on a 360 px phone rather than cutting it, because the Scan button and the wallet chip need their room.
- **Search** keeps matching the cafe name, so typing "delice" lists every Cafe Delice dish, and the order progress card stays visible above the results.

Raised in v1.0.0 Phase A (the brief or the docs were silent, simplest behaviour kept until answered):
- **Home notice and "once per session".** The notice stays away once it is dismissed, for the rest of that browser session (until the tab is closed). If it is never dismissed it shows again each time Home opens. It is not shown again just because a different place closes later in the same session.
- **All places closed.** The notice lists the first three closed places in menu order, one line each (the brief says "max three"); it does not summarise. On a Sunday or a holiday the "Next break" strip carries the "Nothing is open right now. Truly Indian opens tomorrow at 08:00." line.
- **A pause has no end time.** The closed-place sheet for a paused place says "Check back in a little while." and no time. A paused place stays "Paused" outside its hours too.
- **Clearing a default window.** An item that has a default window (breakfast, until 11:00) and whose two times are both cleared in the Cafe portal means "no limit" and overrides the default. "Back to default" puts the default back.
- **Holidays in the past** can be added and removed (harmless); the list is not trimmed.
- **Time fields** are the browser's own time control, so a phone may show 12-hour time ("07:00 PM"). The value stored and sent is always 24-hour "HH:MM" on 5-minute steps.
- **Vending** follows the same hours and pauses as the cafes (08:00 to 19:00, Monday to Saturday) and has its own card in Hours and items.
- **Not-found status inside the student app.** An address that does not exist (an unknown account section, Discover topic or place, or an order that is not yours) shows the same "We could not find that page" screen as before, but its HTTP status is now 200 instead of 404, because the student loading view starts each page's response before the page decides. Nothing about an order is revealed either way, and nobody indexes this app, so it was left as it is. Outside the student portal (`/nothing-here`) it is still a real 404. A loading view at the root was left out on purpose: it would also have turned the "session ended" redirect (307) into a 200.

Raised in Phase 6 (the docs were silent, simplest behaviour kept until answered):
- The source filter tabs sit above the columns, not in the header: with the pages, the clock, the sound switch and Logout there is no room for six tabs on one row at 1280 px. The header has Queue, Vending, Menu and Today.
- FLOWS has four columns and a "Start preparing" button but no Accepted column, so an accepted order waits in Preparing with an "Accepted" label and a Start preparing button. Mark ready comes after that.
- Reject reasons are four: "An item ran out", "Kitchen is closed", "Too many orders", "Something else". The buyer reads: "<Source> could not make order QX-… because <reason>. ₹X has been refunded to your wallet."
- Send with staff tells the buyer exactly "Picked up by QuickX staff." (FLOWS wording). It does not add "On the way to GICT" as the runner version does.
- A vending pickup is collected only at the kiosk. Its Ready card says "Waiting for the buyer at the vending kiosk." and has no Collect box. If two ready vending pickups share a code, the older one is dispensed first.
- The kiosk locks for a minute after 5 wrong codes (`KIOSK_RATE_LIMIT`) so nobody can walk up and guess. While locked even the right code is refused, as at the gate.
- The amber "due" border, the 3-minute "no runner yet" highlight and the red failed-order cards were left for Phase 8, and are built there.
- Staff delivery stops at "Out for delivery" until Phase 7 adds the handover code entry that marks an order DELIVERED.
- Browsers only allow sound after one tap on the page, so the desk shows "Click once on this page so the browser allows sound." beside the sound switch until then.
- Today: "orders placed" counts orders placed since IST midnight. Revenue is the food subtotal of finished orders. Delivery fees kept = the whole fee for a staff delivery, the fee minus the runner's earning for a runner delivery. Refunds count cancelled, rejected and failed orders.
- The Toggle (planned for Phase 9) was needed now for "Available today", so it is built and in the kit. `Sheet` has a centred variant for laptop dialogs.
- The full-screen kiosk has a "Back to the cafe desk" link and a Full screen button, since it has no header.

Raised in Phase 7 (the docs were silent, simplest behaviour kept until answered):
- **Handover code guessing:** 8 wrong codes in a row on one order pause the entry for a minute (`HANDOVER_RATE_LIMIT`). A 4-digit code with free retries could otherwise be guessed by whoever holds the bag. It is not a penalty.
- **Extra refusal line:** scanning a finished or cancelled order says "That order is closed." (FLOWS has no line for it). A new order says "Not ready yet"; one on its way says "Already taken by someone else".
- **Runner and staff Updates do not link to the order** (the order page belongs to the buyer). The earning Update is "Delivered. ₹5 added to your wallet."
- **Drop point wording:** "GICT ground floor lobby" (the building, then the drop point in lower case) everywhere a runner or buyer is told where to go, as in FLOWS 3b.
- **Camera:** the runner sheet asks for the rear camera and falls back to any camera (a laptop has none at the back). The QR decoder file is served from our own site (`public/scanner/zxing_reader.wasm`, zxing-wasm 3.1.6) so scanning does not need a CDN. Copy it again if `@yudiel/react-qr-scanner` is upgraded.
- **Run lists:** `qx:runs:live:<id>` is the source for My runs and the 3-run limit. A check that runs when the lists are read adds any held order the list is missing, so orders the cafe gave to staff before runs existed still appear.
- **The Orders tab dot** also lights while you carry a run, not only while you have an order of your own.
- **Escape in sheets** now works wherever focus is (it used to need focus inside the sheet).

Raised in Phase 8 (the docs were silent, simplest behaviour kept until answered):
- **Grace, to the second:** an order is overdue when the server's time is at or after the promised time + 5 minutes (`GRACE_MIN`). An on-time "I'm here" is one at or before the promised time; arriving exactly on the minute counts as on time.
- **No-show beats late:** if the holder tapped "I'm here" on time, the order is a no-show whoever carries it, even when the buyer was the one who was late. A runner who arrives after the promised time is late (rule 2c) even if they were waiting when grace ended.
- **No-show money:** the buyer is not refunded and the order counts as revenue on Cafe › Today. A student runner is paid the usual ₹5 (₹8 far zone); staff earn nothing. The bag stays at the source counter and the vending items are **not** put back (the bag exists).
- **Failed-late stock:** when the food is not kept by a runner (staff late, or late before pickup), vending items go back into the machine count. When a student runner keeps the food, they do not.
- **A cafe alert stays until someone acts:** failed-late alerts need **Seen**; staff-returning alerts need **Returned**; a no-show needs the buyer's code (**Collect**) or, once the 30-minute hold ends, **Seen**. Seen is refused while the buyer can still collect ("The buyer can still collect it until HH:MM.").
- **Collecting a no-show bag** only stamps `collectedAt` and sends "Collected. Enjoy!"; the status stays `NO_SHOW` and no money moves.
- **Buyer page for a no-show:** shows the code and "Hold until HH:MM" while the hold is open, then "The hold on QX-NNNN has ended. Nothing was refunded."
- **Wallet below zero:** a runner who was late can go negative. They cannot take another run until they top up to ₹50 (existing rule).
- **Polling:** the sweep runs at most once a second, at the start of the cafe queue poll, the buyer's order list and order page, the runner's runs and Admin › Live orders, so it does not need a cron job.
- **SWR note for later screens:** a `refreshInterval` function must be defined outside the component if the component re-renders every second (it restarts SWR's timer otherwise). `OrderView` does this in `pollEvery`.

Raised in Phase 9 (the docs were silent, simplest behaviour kept until answered):
- **Default time** has two choices, As soon as possible and Next break. "Next break" means the first break still open when Checkout opens (it follows the mode and building), and falls back to as soon as possible when none is. Picking a time yourself on Checkout wins over the preference for that visit.
- **Sounds are off by default.** The chime plays only while QuickX is open, only after one tap on the page, and a phone on silent stays silent. Order updates and Wallet updates are cosmetic and say "Not connected yet".
- **Preferences are saved on the server**, so they follow a person to any phone. They have an explicit Save button; the notification switches save as you flip them. A damaged stored value is read as far as it goes and the rest falls back to the defaults.
- **Order History** shows finished orders (the same list as Orders › Past) and finished runs. A run shows what it did to the wallet, read from the ledger (which keeps the last 100 lines), so an old run may show no amount. Runs still being carried stay in Orders › My runs.
- **Refund Status** is read from the order records: cancelled, rejected and failed-late orders, always the full total, always to the wallet. A no-show is not a refund. It reads the user's most recent 60 orders, like Orders.
- **Feedback** is saved with the sender's ID and role, so the team can follow up. There is no screen for reading it yet; it is the Redis list `feedback`. One per person per 10 seconds, 500 characters, last 500 kept. A reader in Admin could be added in Phase 10.
- **Support** has generic UC help desk text (ask at the cafe counter or the UC help desk) because no help desk hours or place are in the docs. The team contact is a visible placeholder.
- **Terms and Conditions** is short plain text written for the prototype (not legal advice), with the Open Peeps credit placeholder and the icon and font credits.
- **My Profile** changes the first name by the same rules as Identify. Orders already placed keep the name they had. The ID and role cannot be changed.
- **Log out** on Account asks first (a confirm sheet). The Cafe and Admin headers keep the plain Logout button.
- **The FAQ reads every number from `lib/config.ts` and the building list**, so it cannot disagree with the app.

Waiting on the team:
- UC help desk hours and place, and the team's contact details, for the Support page.
- Real break times for the semester (placeholder list in `data/breaks.ts`).
- Real walk times (estimates in `data/locations.ts`).
- Real vending snack names loaded in the UC machine.
- Open Peeps illustration files, to be added later into `public/illustrations/` (check the licence page first). Not blocking: until then the gate and empty states use a Phosphor icon in a sand circle.

## Decisions (answered, or accepted by the team as written)

Numbers and rules
- `SLOT_LEAD_BUFFER_MIN = 5` and `PICKUP_STALE_MIN = 30` are correct and stay in `lib/config.ts`.
- Rate limit is 30 wrong tries per IP per 10 minutes, because phones on the campus Wi-Fi share one IP. A correct code is never counted as a wrong try. While an IP is over the limit, every try is refused.
- Home "Next break" strip (Phase 3): order-by time is the break time minus `prep + walk + SLOT_LEAD_BUFFER_MIN`, using the slowest prep of the user's last source, or 5 minutes if there is none.
- Slot orders for pickup (Phase 5): walk is 0 and the promise is the slot time.
- Late sweep (Phase 8) skips `PLACED` orders; the buyer can cancel or the cafe can reject.
- Vending orders chosen for delivery (Phase 6): same one-tap "Accept and ready" path, and a bag slip is still printed.

Access and identity
- The gate input is masked by default, with a show/hide eye button.
- Permanent codes reach the Admin page masked (`K7••••`). The full code is fetched only when an admin taps Reveal or Copy, and only with an admin session.
- Temp code lifecycle: a used code is `active` for 15 minutes; Logout or Admin › End session makes it `burned`; one whose 15 minutes ran out shows as burned. `usedBy` is filled in when Identify finishes.
- Any redirect from a protected page to the gate shows "Your session has ended. Ask for a new code.", including for someone who never logged in.
- Identify asks for a first name only the first time. First names: letters, spaces, apostrophes and hyphens, 2 to 20 characters, tidied to a capital after each space, apostrophe or hyphen.
- Staff accounts are created in Admin › Staff (Phase 1). Staff IDs run `QX-STF-01` to `QX-STF-99` and staff cannot be deleted.
- The server ignores stray spaces, new lines and quotes around env values (`lib/env.ts`), and accepts `QX_PERMANENT_CODES` separated by commas, spaces or new lines.

Build and stack
- Redis keys all start with `qx:`.
- Next.js 16 calls `middleware.ts` `proxy.ts`; the project uses `proxy.ts`. `cacheComponents` is off.
- `/api/health` is public (no secrets or user data in it).
- Item names in MENU.md that carry a detail in brackets or after a comma are split into `name` and `description` in `data/menu.ts`. Prices, prep, tags, slots and stock are exactly as in MENU.md.
- The student shell and `/cafe` are stubs until Phase 2 and Phase 6. `PillButton`, `Input`, `Badge`, `Countdown`, `EmptyState` and `LogoutButton` are the first UI-kit pieces.
- The countdown chip reads the session cookie's expiry. `/api/me` waits until there is a wallet to return (Phase 4).
- A 72 px display size and a `tracking-code` letter-spacing token were added to the bible, for the gate wordmark and Admin's "show code" mode.
- The four `QX_*` variables exist for Production only. Login on a preview URL needs them added for Preview too.

Phase 2 (UI kit and shell), accepted by the team
- Hints and secondary text use `mocha`; `taupe` stays for placeholders, disabled controls, borders and handles (see the bible for the contrast numbers).
- Food photos: `next.config.ts` lists `public/food/*.jpg` at build time and `ItemTile` only requests photos on that list, so missing photos cause no 404s. Add photos, push, and the next build picks them up.
- The five tabs, the wallet chip and `/account/[section]` pointed at stub pages until their phases. Log out lives on the Account page.
- The Scan button opens a placeholder sheet until the runner sheet (Phase 7). The unread and active-order dots stay off until Phase 5 has data.
- `Toggle` waits for Phase 9 (Notifications). The selected tall-capsule chip is filled maroon.
- `/kit` is served at `/kit`, admin only, and is not linked from the Admin header.

Phase 3 (browse and cart), accepted by the team
- Next break strip: prep comes from the slowest item of the source in the cart, or 5 minutes (`DEFAULT_PREP_MIN`) with an empty cart, because there is no order history until Phase 5. The building is GICT (`DEFAULT_BUILDING`) until Preferences exist in Phase 9. If the nearest break can no longer be made, the strip shows the next one that can; after the last one it says "No more breaks today."
- Category chips on the source menu are skipped: menu items have no category field in MENU.md, and none was invented.
- Vending cells add one unit per tap. Removing and changing quantity happen in the cart, because a stepper does not fit a 44 px tap target in a three-column grid.
- ~~The morning rule runs from 11:30 IST to midnight.~~ Replaced in v1.0.0 Phase A: there is no morning tag and no 11:30 rule. Breakfast is a normal item window ("Breakfast, until 11:00") set in `data/hours.ts` and editable in the Cafe portal. Server time still decides; the phone only counts forward from the last server reading.
- A cart item that stops being orderable (switched off, its place closed or paused, outside its time window, stock below the quantity) stays in the cart, is flagged in red, and Checkout is disabled until it is removed.
- `/checkout` is a placeholder until Phase 5. The header gets a Back button and a title on sub-pages; long titles wrap to two lines.
- Vending stock is created in Redis (`qx:stock`) from `startStock` the first time anyone reads it, so Phase 5's atomic decrement always finds a number.
- Cafe "Unavailable today" switches are read from `qx:unavailable` now; the Cafe portal that writes them is Phase 6.

Phase 4 (wallet), accepted by the team
- Each ledger entry also stores `balance` (the balance right after it), on top of `{ at, type, amount, orderId?, note? }` in ARCHITECTURE.md. It makes the Admin ledger and any check easy.
- A wallet only goes negative through a late-delivery penalty (rule 7), so an Admin adjustment may not take a balance below ₹0. It can lift a negative balance, and a negative balance can only be raised, never pushed lower. One adjustment is at most ₹10,000 either way (`ADMIN_ADJUST_MAX`), and the note is required, 3 to 120 characters.
- The fake UPI step is 1.5 s (`TOPUP_PROCESSING_MS`) and the money is added by the server after it. Closing the sheet during the fake step cancels it and nothing is added. Staff can top up like anyone else.
- `/api/me` returns `unread: 0`, `activeOrder: false` and `prefs: null` until Phases 5 and 9 have that data. The header chip and the two tab-bar dots read it live, every 4 s.
- Home banners: under ₹50 "Top up to order ...", ₹50 to ₹99 "Keep at least ₹100 ...", nothing at ₹100 or more. The wallet chip shows an amber dot under ₹50. A negative balance shows a proper minus (−₹30).
- Admin › Users lists everyone who has identified themselves (newest first, up to 50), searchable by part of an AU number, staff ID or name, and refreshes every 5 s so wallets can be watched live. Quick-fill buttons +₹100, +₹300, +₹500 are a demo convenience.
- Late-delivery penalties, order payments, refunds and runner earnings will use the same `moveMoney` function in `lib/wallet.ts`. A penalty passes no floor, so it can go negative.

Phase 7 and 8 (runner and late handling), team decisions
- **I'm here (a):** the holder (runner buddy or staff) taps it at the drop point on a run in Orders › My runs. Server records `arrivedAt`; the buyer gets "Your runner is at <building> <drop point>. Show your code." Only while `PICKED_UP`, only by the holder.
- **Buyer no-show (b):** `arrivedAt ≤ promisedAt` and not delivered when grace ends → new terminal status `NO_SHOW`. Runner (students only) still earns `RUNNER_EARN`; buyer is not refunded; the bag goes back to the source counter; amber cafe card; the buyer can still collect with the same code for `PICKUP_STALE_MIN`.
- **Late by a runner buddy (c):** `FAILED_LATE`, buyer refunded in full, runner debited the full total (can go negative), no earning, runner keeps the food.
- **Late by staff (d):** `FAILED_LATE`, buyer refunded in full, nobody debited, the cafe absorbs it, red cafe alert "Staff returning QX-NNNN to <source>" with a **Returned** button.
- **Late before pickup (e):** `FAILED_LATE`, buyer refunded in full, the cafe absorbs it.
- **Admin › Live orders (f)** is pulled forward from Phase 10. **Reveal code is a demo tool**: it shows one order's 4-digit code to an admin session, checked on the server, never in the list reply. Remove or hide it before real use.

Phase 5 (ordering), accepted by the team
- Checkout opens on "Deliver to my building" with GICT selected until Preferences (Phase 9) can remember a default. Confirmed by the team.
- The time shown before the cafe accepts is an estimate (ASAP delivery = now + prep + walk + 2 min, ASAP pickup = now + prep). Confirmed by the team: the cafe resets an ASAP promise when it accepts (accept time + prep + walk + 2 min for delivery, accept time + prep for pickup), in Phase 6. A break slot keeps the slot time.
- Order IDs are random `QX-1000` to `QX-9999` (9,000 of them) and orders are never deleted. Plenty for a demo day. Admin › Demo reset (Phase 10) should clear orders so the IDs free up.
- A double tap on Pay, or a retry after a bad network, places one order: each Pay press carries a token that is remembered for 5 minutes (`IDEMPOTENCY_TTL_SEC`).
- The Orders tab shows your latest 60 orders (`ORDERS_LIST_MAX`). The dot on the Orders tab means "an order is in progress"; it goes out when the last one is finished.
- Updates older than today are listed under "Earlier" with "Yesterday 14:30" or "12 Nov 14:30".
