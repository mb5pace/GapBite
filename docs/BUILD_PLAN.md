# BUILD PLAN

Build in this order. One phase per session or per sitting. At the end of each phase: `npm run build` passes, the deployed preview works, tick the boxes, commit, push.

## Phase 0 — Project setup
- [ ] Create Next.js app (App Router, TypeScript strict, Tailwind, ESLint) in the repo root
- [ ] Install only: `@upstash/redis jose swr zod qrcode @yudiel/react-qr-scanner @phosphor-icons/react` (+ `@types/qrcode`)
- [ ] Tailwind theme tokens and fonts from UI_UX_BIBLE.md §1–2; `globals.css` sets cream background
- [ ] `lib/config.ts` with every constant from BUSINESS_RULES.md
- [ ] `data/locations.ts`, `data/breaks.ts`, `data/menu.ts` from LOCATIONS.md and MENU.md
- [ ] `lib/redis.ts` client, `.env.example`
- [ ] Deploy to Vercel, add Upstash, add env vars; a `/api/health` route that writes and reads one Redis key

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
- Real break times for the semester (placeholder list in `data/breaks.ts`).
- Real walk times (estimates in `data/locations.ts`).
- Real vending snack names loaded in the UC machine.
