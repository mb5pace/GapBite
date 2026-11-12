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

Waiting on the team:
- Real break times for the semester (placeholder list in `data/breaks.ts`).
- Real walk times (estimates in `data/locations.ts`).
- Real vending snack names loaded in the UC machine.
- Open Peeps illustration files, to be added later into `public/illustrations/` (check the licence page first). Not blocking: until then the gate and empty states use a Phosphor icon in a sand circle.

Raised in Phase 2 (simplest behaviour chosen, change if wrong):
- The five tabs and the wallet chip point at pages that arrive later, so Discover, Orders, Updates, Account and `/account/[section]` are stub pages with an empty state. Log out moved from the Home stub to the Account stub, where it will stay.
- The wallet chip reads the balance from Redis, so it shows ₹0 until the wallet exists (Phase 4). An amber dot means under ₹50.
- The Scan button opens a placeholder sheet until the runner sheet (Phase 7).
- The unread dot on Updates and the active-order dot on Orders exist and are shown in `/kit`, but stay off in the live shell until Phase 5 has data for them.
- `Toggle` is listed in ARCHITECTURE.md but not in the Phase 2 list or bible §4, so it waits for Phase 9 (Notifications).
- Tall-capsule chip: the bible only says the capsule "can" be used for slots. The selected capsule is filled maroon.
- `/kit` lives at `/kit` (mapped to the admin portal in `proxy.ts`, and checked again on the page). It is not linked from the Admin header.
- The header title comes from the path (tab names and Account sections). Later pages that need their own title or a back button (source menu, cart, checkout, order detail) extend `titleFor` in `components/student/Header.tsx`.
- `taupe` fails WCAG AA as text (4.3:1 on cream). Hints and secondary text now use `mocha`. Placeholders (taupe, as the bible says) are about 3.6:1 on sand. Say if you want placeholders darker.
- Item tiles try `public/food/<item-id>.jpg` and fall back to initials, so until photos exist the browser shows harmless 404s for them. If that noise matters, Phase 3 can list the photos on the server instead.

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
