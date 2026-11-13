# ARCHITECTURE

Goal: looks and behaves like a real multi-device app, costs ₹0, needs no maintenance beyond pushing to GitHub.

## Stack

| Part | Choice | Why |
|---|---|---|
| Framework | Next.js, App Router, TypeScript strict | One project for UI and API, first-class on Vercel |
| Styling | Tailwind CSS with tokens from UI_UX_BIBLE.md | Fast, consistent, no CSS files to manage |
| Hosting | Vercel Hobby, connected to this GitHub repo | Every push to `main` deploys; preview URL per branch |
| Shared state | Upstash Redis (Vercel Marketplace, free plan) via `@upstash/redis` | One click to add, env vars set automatically, no tables or migrations, works over HTTPS from serverless functions |
| Sessions | Signed JWT cookie with `jose` | No auth service needed |
| Data fetching | `swr` with `refreshInterval` for polling | Simple live updates, pauses when hidden |
| Validation | `zod` on every API input | Clear errors, safe inputs |
| QR create | `qrcode` (render to SVG data URL on the server) | Small, no canvas needed |
| QR scan | `@yudiel/react-qr-scanner` | Works in mobile browsers over HTTPS; always paired with manual order-ID entry |
| Icons | `@phosphor-icons/react` (Regular and Bold weights only) | Rounded, friendly line icons that match the references; not the default shadcn/Lucide look |
| Fonts | `next/font/google` (see bible) | Self-hosted automatically, no layout shift |

Nothing else without asking. No component library (no shadcn/ui, MUI, Chakra). Build the small set of components in the bible by hand.

Why Upstash and not "no database": single-use temporary codes, wallets and orders must be shared between phones and the cafe laptop. Without a shared store each device only sees itself. Upstash is a key-value store reached over HTTPS with two env vars; there is nothing to manage. Free-plan limits are far above what a demo uses, especially with polling paused on hidden tabs.

Why polling and not websockets: Vercel functions do not hold open connections. Polling every 3–4 seconds is reliable on stage and stays inside free limits.

Why lazy late-checks and not cron: Vercel Hobby cron runs at most once a day. `sweepLate()` runs inside the polls instead (see FLOWS.md §5).

## Folder structure

```
app/
  page.tsx                      gate
  identify/page.tsx
  (student)/
    layout.tsx                  header + bottom bar + runner popup provider
    home/page.tsx
    s/[sourceId]/page.tsx       menu and vending
    cart/page.tsx
    checkout/page.tsx
    o/[orderId]/page.tsx
    discover/page.tsx
    discover/[topic]/page.tsx   introduction | help | smart-vending | feedback | faq
    orders/page.tsx
    updates/page.tsx
    account/page.tsx
    account/[section]/page.tsx  wallet | profile | preferences | notifications | history | refunds | terms | feedback | support
  cafe/
    layout.tsx
    page.tsx                    queue
    vending/page.tsx
    kiosk/page.tsx
    menu/page.tsx
    today/page.tsx
  admin/
    layout.tsx
    page.tsx                    codes
    staff/page.tsx
    users/page.tsx
    orders/page.tsx
    demo/page.tsx
  api/
    auth/login/route.ts         POST code -> sets cookie, returns portal
    auth/identify/route.ts      POST AU/staff id + name
    auth/logout/route.ts
    me/route.ts                 GET user, wallet, prefs, unread count, session time left
    menu/route.ts               GET menu + availability + vending stock
    orders/route.ts             GET mine (orders + runs), POST create
    orders/[id]/route.ts        GET one (buyer, holder, cafe, admin only)
    orders/[id]/cancel/route.ts
    runs/preview/route.ts       POST scanned id -> preview or error
    runs/accept/route.ts        POST id -> atomic accept
    runs/handover/route.ts      POST id + code -> deliver
    wallet/route.ts             GET ledger
    wallet/topup/route.ts       POST amount
    updates/route.ts            GET list, POST mark-read
    prefs/route.ts
    feedback/route.ts
    cafe/queue/route.ts         GET (runs sweepLate first)
    cafe/orders/[id]/route.ts   POST action: accept|reject|start|ready|staff|collect
    cafe/alerts/route.ts        POST seen
    cafe/stock/route.ts
    cafe/availability/route.ts
    cafe/kiosk/route.ts         POST code -> dispense
    cafe/today/route.ts
    admin/codes/route.ts        GET, POST generate|revoke|end
    admin/staff/route.ts
    admin/users/route.ts
    admin/wallet/route.ts       POST adjust
    admin/demo/route.ts         POST seed|reset
proxy.ts          (Next.js 16 name for middleware.ts)
lib/
  config.ts       every number from BUSINESS_RULES.md (and ACCESS.md, FLOWS.md)
  env.ts          reads env text, forgiving stray spaces and quotes
  redis.ts        single client (reads KV_REST_API_* or UPSTASH_REDIS_REST_*)
  api.ts          { ok, data } / { ok: false, error } replies, AppError, zod body parsing
  http.ts         browser-side fetch helpers (401 sends the person back to the gate)
  session.ts      sign, verify the cookie (no Redis, so proxy.ts can use it)
  auth.ts         server checks for pages and API routes (also checks temp codes in Redis)
  gate.ts         what a typed code opens, rate limit
  codes.ts        pool fill, burn, revoke
  users.ts        user records, Identify, staff accounts
  wallet.ts       balance, ledger, one atomic Lua move (balance + ledger entry together)
  wallet-rules.ts ₹50 floor, ₹100 suggestion, top-up needed, top-up bounds (pure)
  me.ts           the shell's live numbers: name, balance, dots, session time
  order-types.ts  Order, status list, which steps each kind of order shows (pure)
  order-rules.ts  pricing from the menu, fee and walk lookups, break-slot cutoff, promised-time estimate (pure)
  orders.ts       place (one Lua script), read, list, cancel and refund; later transitions and guards
  late.ts         sweepLate
  updates.ts      Updates feed: push, unread count, mark read
  ids.ts          staff ids now; order ids and 4-digit codes with ordering
  format.ts       rupees (₹1,25,000), initials
  photos.ts       which item photos exist (list made at build time in next.config.ts)
  menu-rules.ts   morning cutoff, item status, max quantity, next break (pure)
  menu.ts         unavailable switches + vending stock read from Redis
  stock.ts        vending stock, created from startStock on first read
  cart.ts         cart rules on plain data: one source, 10 units, stock (pure)
  cart-store.ts   browser cart store: memory + sessionStorage per user
  search.ts       menu search across all five sources (pure)
  time.ts         IST formatting, promised time math
data/
  menu.ts  locations.ts  breaks.ts  copy.ts (shared UI strings)  order-copy.ts (order words, headlines, Update texts)
components/
  ui/             PillButton (+ PillLink), IconButton, Chip, Card, ArchCard, ItemTile, SourceGlyph, Stepper, Sheet, Input, CodeBoxes, Banner, Badge, EmptyState, Countdown, Money, LogoutButton
                  (Toggle waits for Phase 9, where Notifications uses it)
  kit/            KitGallery, the admin-only /kit page
  student/        Header, BottomBar, WalletChip, SessionChip (Phase 2); SourceTile, CartBar, OrderStrip (later)
  runner/         ScanButton, RunnerSheet (scan, preview, accept, handover)
  cafe/           QueueColumn, OrderCard, BagSlip, AlertCard
  admin/          CodeTable, ...
public/
  illustrations/  (see bible)
  food/           optional real photos <item-id>.jpg
```

## Redis keys

All values JSON unless noted. Prefix everything with `qx:` so reset can scan safely.

| Key | Type | Content |
|---|---|---|
| `qx:user:<id>` | string | `{ id, name, role: "student"|"staff", createdAt }` |
| `qx:users` | set | all user ids |
| `qx:staff:seq` | counter | last staff number |
| `qx:wallet:<id>` | integer string | balance in rupees (use INCRBY/DECRBY) |
| `qx:ledger:<id>` | list (LPUSH) | `{ at, type, amount, orderId?, note? }`, keep last 100 |
| `qx:prefs:<id>` | string | preferences |
| `qx:order:<orderId>` | string | Order (FLOWS.md) |
| `qx:orders:active` | sorted set | orderId scored by createdAt |
| `qx:orders:done` | sorted set | terminal orders |
| `qx:orders:by:<userId>` | sorted set | buyer's orders |
| `qx:orders:live:<userId>` | set | buyer's orders that are not finished yet (drives the Orders tab dot and the Home strip) |
| `qx:idem:<userId>:<token>` | string, TTL 300 | order id placed for this checkout press, so a double tap or retry places one order |
| `qx:runs:by:<userId>` | sorted set | orders this user carried |
| `qx:lock:order:<orderId>` | string NX | accept lock |
| `qx:penalty:<orderId>` | string NX | late penalty applied once |
| `qx:updates:<userId>` | list | Updates, keep last 50 |
| `qx:unread:<userId>` | integer | unread count |
| `qx:alerts` | list | cafe red alerts |
| `qx:stock` | hash | slot -> count |
| `qx:unavailable` | set | item ids off today |
| `qx:codes:temp` | hash | code -> record (ACCESS.md) |
| `qx:ratelimit:<ip>` | integer, TTL 600 | wrong code tries |
| `qx:feedback` | list | feedback entries |

## Concurrency

Use `redis.eval` (Lua) or `MULTI` for every multi-step money or ownership change, so it is all-or-nothing:
1. **Place order:** check balance ≥ ₹50 and ≥ total, decrement stock for vending, debit wallet, write order, add to indexes, push ledger.
2. **Accept run:** `SET qx:lock:order:<id> <userId> NX`; if it fails → "Already taken". Then re-read status, set holder and `PICKED_UP`.
3. **Handover:** check status `PICKED_UP` and code, set `DELIVERED`, credit runner, move index.
4. **Fail late:** `SET qx:penalty:<id> 1 NX` first; only the winner refunds and debits.
5. **Burn temp code:** Lua script that flips `unused → active` only if still unused, then adds a new code.

## API conventions

Every route: verify session for the right portal, parse body with zod, call one `lib/` function, return `{ ok: true, data }` or `{ ok: false, error: "plain sentence for the user" }` with a proper status code. Never return another user's handover code: only the buyer sees `code`.

## Time

Store epoch ms from the server. Display in IST (`Asia/Kolkata`) as `11:47`. Break slots are interpreted as today's date in IST.

## Deploy

1. Push to GitHub `main`. Import the repo in Vercel (Hobby). Framework preset Next.js.
2. Vercel › Storage / Marketplace › add **Upstash for Redis** (free plan) and connect it to the project. This sets the Redis env vars.
3. Add `QX_PERMANENT_CODES`, `QX_CAFE_PASSWORD`, `QX_ADMIN_PASSWORD`, `QX_SESSION_SECRET` in Project Settings › Environment Variables for Production and Preview.
4. Redeploy. Open `/`, log in as admin, the temp pool fills itself, run "Seed demo data".
5. Local dev: `vercel env pull .env.local`, then `npm run dev`. Camera scanning needs HTTPS, so test scanning on the Vercel preview URL, not on `localhost` from a phone.
