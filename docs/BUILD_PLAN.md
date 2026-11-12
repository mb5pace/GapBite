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
- [ ] Gate screen, `/api/auth/login`, rate limit
- [ ] Session cookie (`lib/session.ts`), `middleware.ts`
- [ ] Temp code pool fill and atomic burn (`lib/codes.ts`)
- [ ] Identify screen (AU / staff), user records
- [ ] Logout; temp-session countdown chip
- [ ] Minimal Admin › Codes page so the team can get temp codes

## Phase 2 — UI kit and student shell
- [ ] Components from bible §4: buttons, icon button, chips, card, arch card, item tile, sheet, stepper, code boxes, banner, money, empty state
- [ ] Student layout: header (greeting, Scan, wallet chip), floating bottom bar
- [ ] A `/kit` page (admin-only) showing every component for visual review

## Phase 3 — Browse and cart
- [ ] Home (sources, search, popular, next break strip)
- [ ] Source menu pages, vending grid with stock
- [ ] Cart (one source rule), cart bar, local cart state (in memory + sessionStorage wrapped in try/catch)

## Phase 4 — Wallet
- [ ] Wallet page, mock UPI top-up sheet, ledger
- [ ] Balance rules and banners (₹50 block, ₹100 suggestion)
- [ ] Admin › Users and wallet adjust

## Phase 5 — Ordering
- [ ] Checkout (mode, building, when, bill, pay)
- [ ] Atomic place-order, server re-pricing, stock decrement
- [ ] Order Detail with stepper and code box
- [ ] Orders tab (Active/Past), cancel while PLACED
- [ ] Updates feed and unread dot

## Phase 6 — Cafe portal
- [ ] Queue columns with polling and sweepLate
- [ ] Accept/reject/start/ready, bag slip with QR + print
- [ ] Pickup collect by code
- [ ] Send with staff; staff accounts in Admin
- [ ] Vending stock, kiosk, menu availability, Today

## Phase 7 — Runner
- [ ] Scan button + runner sheet (camera + manual entry)
- [ ] Preview and atomic accept, all error messages
- [ ] My runs in Orders, handover code entry, earning credit

## Phase 8 — Late handling
- [ ] Promised time math (`lib/time.ts`), countdowns, amber due state
- [ ] `sweepLate` with penalty lock, refunds, runner debit, alerts, Updates
- [ ] Unclaimed 3-minute highlight
- [ ] Test: let one run expire on purpose and check every wallet and screen

## Phase 9 — Account and Discover
- [ ] Profile, Preferences, Notifications, Order History, Refund Status, Terms, Feedback, Support
- [ ] Discover pages and FAQ

## Phase 10 — Demo polish
- [ ] Admin demo tools (seed, reset), live orders view
- [ ] Every screen checked against bible §9 and §10
- [ ] Test on two real phones + laptop at the same time over the deployed URL
- [ ] Walk through DEMO_SCRIPT.md twice end to end

## Open questions
(Add questions here when a doc is silent. Keep the simplest behaviour until answered.)

Waiting on the team:
- Real break times for the semester (placeholder list in `data/breaks.ts`).
- Real walk times (estimates in `data/locations.ts`).
- Real vending snack names loaded in the UC machine.

Raised in Phase 0 (simplest behaviour chosen, change if wrong):
- Slot cutoff: BUSINESS_RULES says a slot is selectable if `now + prep + walk + 5` is before it, with an unnamed 5. Added as `SLOT_LEAD_BUFFER_MIN = 5` in `lib/config.ts`. Is it meant to be BUFFER_MIN (2) instead?
- Uncollected pickups are "shown after 30 minutes" with no constant name. Added as `PICKUP_STALE_MIN = 30`.
- Home "Next break" strip: the example "next break 11:50, order by 11:38 for GICT" is 12 minutes before the break, with no formula given. Phase 3 will use `prep + walk + SLOT_LEAD_BUFFER_MIN` with the slowest prep of the user's last source, or 5 minutes if none.
- Redis keys: ACCESS.md writes `codes:temp`, ARCHITECTURE.md writes `qx:codes:temp`. Using the `qx:` prefix everywhere so Reset can scan safely.
- Next.js 16 renamed `middleware.ts` to `proxy.ts` (same behaviour). ARCHITECTURE.md says `middleware.ts`. Phase 1 will use `proxy.ts`.
- create-next-app 16 turned on `cacheComponents` and `partialPrefetching`. Switched off: QuickX has no cacheable pages, and the flag forces Suspense around every cookie read. Revisit only if Next makes it mandatory.
- Item names in MENU.md that carry a detail in brackets or after a comma are split into `name` and `description` in `data/menu.ts` (for example "Too Yumm Karare" + "Masala", which also matches DEMO_SCRIPT.md). Prices, prep, tags, slots and stock are exactly as in MENU.md.
- `/api/health` is public (no secrets or user data in it). Phase 1 proxy must leave it open, or move it behind the admin session once setup is done.
- Staff IDs must already exist to log in (ACCESS.md), but Admin › Staff is only built in Phase 6. Until then the Identify staff link will refuse every ID. Phase 10 seed data adds QX-STF-01.
- Slot orders for pickup: BUSINESS_RULES gives the slot rule for delivery. For pickup, Phase 5 will use walk 0 and promise the slot time.
- Late sweep and `PLACED`: `promisedAt` is only an estimate before the cafe accepts, and FLOWS says only ACCEPTED, PREPARING, READY and PICKED_UP can fail. Phase 8 will skip `PLACED` (the buyer can cancel, or the cafe can reject).
- Vending orders chosen for delivery: FLOWS describes one-tap "Accept and ready" for vending. Phase 6 will give delivery vending orders the same one-tap path and still print a bag slip.
- Open Peeps illustrations (UI_UX_BIBLE §5) need to be downloaded into `public/illustrations/` and the licence checked. Needs a person at a browser; raise before Phase 2 if the team wants them in the kit.
