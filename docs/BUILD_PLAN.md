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
- [ ] Queue columns with polling and sweepLate
- [ ] Accept/reject/start/ready, bag slip with QR + print
- [ ] Pickup collect by code
- [ ] Send with staff (staff accounts already exist, see Phase 1)
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
- [ ] Admin demo tools (seed, reset), live orders view. Seed still creates `QX-STF-01 Ramesh`, but through the same `qx:staff:seq` counter and only if that ID does not exist yet, because staff can now be added by hand
- [ ] Every screen checked against bible §9 and §10
- [ ] Test on two real phones + laptop at the same time over the deployed URL
- [ ] Walk through DEMO_SCRIPT.md twice end to end

## Open questions
(Add questions here when a doc is silent. Keep the simplest behaviour until answered.)

Raised in Phase 5 (the docs were silent, simplest behaviour kept until answered):
- Checkout opens on "Deliver to my building" with GICT selected, because Preferences (Phase 9) cannot remember a default yet (`DEFAULT_MODE`, `DEFAULT_BUILDING` in `lib/config.ts`). Should pickup be the default instead?
- The time shown before the cafe accepts is an estimate: ASAP delivery = now + prep + walk + 2 min, ASAP pickup = now + prep. FLOWS says the promise is set at accept time, so Phase 6 will reset ASAP promises when the cafe accepts. A break slot keeps the slot time.
- Order IDs are random `QX-1000` to `QX-9999` (9,000 of them) and orders are never deleted. Plenty for a demo day. Admin › Demo reset (Phase 10) should clear orders so the IDs free up.
- A double tap on Pay, or a retry after a bad network, places one order: each Pay press carries a token that is remembered for 5 minutes (`IDEMPOTENCY_TTL_SEC`).
- The Orders tab shows your latest 60 orders (`ORDERS_LIST_MAX`). The dot on the Orders tab means "an order is in progress"; it goes out when the last one is finished.
- Updates older than today are listed under "Earlier" with "Yesterday 14:30" or "12 Nov 14:30".

Waiting on the team:
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
- The morning rule runs from 11:30 IST to midnight (so 00:00 to 11:29 morning items can be ordered). Server time decides; the phone only counts forward from the last server reading.
- A cart item that stops being orderable (switched off, morning cutoff, stock below the quantity) stays in the cart, is flagged in red, and Checkout is disabled until it is removed.
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
