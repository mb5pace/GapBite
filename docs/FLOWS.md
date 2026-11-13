# FLOWS

## Order status machine

```
PLACED ──accept──▶ ACCEPTED ──start──▶ PREPARING ──ready──▶ READY
  │                                                            │
  ├─buyer cancel─▶ CANCELLED                                   ├─(pickup) collect code ok──▶ COLLECTED
  └─cafe reject──▶ REJECTED                                    │
                                                               └─(delivery) scan accepted──▶ PICKED_UP ──handover code ok──▶ DELIVERED

PICKED_UP ──"I'm here" (holder only)──▶ stays PICKED_UP, arrivedAt recorded

Delivery orders only, once promisedAt + GRACE_MIN has passed (section 5):
  PICKED_UP and arrivedAt ≤ promisedAt ────────────────▶ NO_SHOW
  any other order in ACCEPTED, PREPARING, READY, PICKED_UP ──▶ FAILED_LATE
```

Terminal statuses: `COLLECTED`, `DELIVERED`, `CANCELLED`, `REJECTED`, `FAILED_LATE`, `NO_SHOW`. Active = any other status. (A `NO_SHOW` order can still be handed over at the counter for `PICKUP_STALE_MIN`; that is recorded as `collectedAt` and the status stays `NO_SHOW`.) Each transition is a server function in `lib/orders.ts` that checks the current status and rejects anything not on this diagram.

For vending orders the cafe portal shows a single "Mark ready" button (no Preparing step), because nothing is cooked: `PLACED → ACCEPTED → READY` can be done in one tap ("Accept and ready").

## Order record

```ts
interface Order {
  id: string;                 // "QX-4821"
  buyerId: string;            // "AU2340123" or "QX-STF-01"
  buyerName: string;
  sourceId: SourceId;
  items: { itemId: string; name: string; price: number; qty: number }[];
  mode: "pickup" | "delivery";
  buildingId?: BuildingId;    // delivery only
  when: "asap" | string;      // "asap" or slot "11:50"
  subtotal: number;
  fee: number;
  total: number;
  code: string;               // 4-digit handover / collect code (shown only to buyer)
  status: OrderStatus;
  holder?: { kind: "runner" | "staff"; id: string; name: string };
  prepMin: number;
  walkMin: number;
  promisedAt?: number;        // epoch ms, set at placement as estimate, fixed at accept
  arrivedAt?: number;         // epoch ms, set when the holder taps "I'm here" (PICKED_UP only)
  collectedAt?: number;       // epoch ms, a NO_SHOW bag handed to the buyer at the counter
  events: { at: number; status: OrderStatus; note?: string }[];
  createdAt: number;
  updatedAt: number;
}
```

## 1. Buyer places an order

1. Home › choose a source tile (four cafes or Vending).
2. Add items. Cart is per source (BUSINESS_RULES "One source per cart").
3. Cart › Checkout:
   1. Mode: **Pick up at UC** or **Deliver to my building**.
   2. If delivery: choose building (six options, showing short name, drop point, fee). Default from Preferences.
   3. When: **As soon as possible** or one of today's remaining break slots.
   4. Summary: subtotal, delivery fee, total, wallet balance after paying, promised time estimate.
   5. "Pay ₹X from wallet". Disabled with a reason if balance < ₹50 or < total, with a "Top up" link.
4. Server re-prices from `data/menu.ts` (never trust client prices), checks availability and vending stock, debits the wallet, creates the order as `PLACED`, writes a ledger entry and an Update "Order QX-4821 placed at Cafe Delice".
5. Buyer lands on Order Detail with the status tracker and the 4-digit code in a large box labelled "Show this code to your runner" (delivery) or "Show this code at the counter" (pickup) or "Enter this code at the vending machine" (vending pickup).

## 2. Cafe prepares

1. New order appears in the Cafe portal queue under **New** with a soft sound and a highlight for 5 seconds (sound can be muted).
2. Staff: **Accept** (or **Reject** with reason). On accept, `promisedAt` is fixed. Buyer Update: "Cafe Delice accepted your order."
3. **Start preparing** → `PREPARING`. Buyer Update: "Your order is being prepared."
4. **Mark ready** → `READY`. A bag slip appears with: order ID, source, items, building and drop point (or "PICKUP"), and a QR code encoding `QX:ORDER:QX-4821`. In the real world it would be printed and stapled to the bag. Buyer Update: "Your order is ready." (pickup: "Ready at the Cafe Delice counter.")

## 3a. Pickup at UC

1. Buyer comes to the counter and shows the code.
2. Staff type the 4 digits into the order card in the Cafe portal (or into the queue's "Collect" box). Match → `COLLECTED`. Buyer Update: "Collected. Enjoy!"
3. Vending pickup: buyer opens the kiosk screen (Cafe portal › Vending kiosk, shown on the laptop beside the machine), enters the code, sees the slots dispense, order becomes `COLLECTED`.

## 3b. Runner buddy picks up

1. A student at UC taps the **Scan** button (always visible in the Student portal header).
2. Camera opens. They scan the bag slip QR, or type the order ID if the camera fails.
3. Popup shows: order ID, source, item count, destination building and drop point, promised time, and "You earn ₹5". Button: **Accept run** (staff: **Accept as staff delivery**).
4. Server checks, atomically: status is `READY`, mode is delivery, no holder, not the scanner's own order, scanner balance ≥ ₹50 (students), scanner has < 3 active runs (students). First valid accept wins.
5. On success → `PICKED_UP`, holder set. Popup shows "Run accepted. Take it to GICT ground floor lobby by 11:47." Cafe card moves to **Out for delivery** with the runner's name. Buyer Update: "Picked up by runner buddy Aarav. On the way to GICT." (staff: "Picked up by QuickX staff.")
6. Failure messages, one line each: "Already taken by someone else", "Not ready yet", "This is your own order", "Top up to at least ₹50 to run", "You already have 3 active runs", "This order is for pickup at UC".
7. Scanning several bags in a row is the batching: each scan is its own accept.
8. A run (including one given to staff with "Send with staff", 3c) then shows in Orders › My runs until it is delivered or settled.

## 3c. Staff from the counter

On a Ready delivery order in the Cafe portal, **Send with staff** opens a picker of staff IDs. Choosing one sets holder kind staff → `PICKED_UP`. Same buyer Update as above.

## 4. Handover

1. Runner reaches the drop point. Orders › Active shows their runs under "My runs" with building, drop point, buyer first name and a countdown to promised time (amber "Due now" once it passes).
2. Runner taps **I'm here**. Allowed only while the order is `PICKED_UP` and only by the holder. The server records `arrivedAt` and the buyer gets an Update: "Your runner is at GICT ground floor lobby. Show your code." The buyer's Order Detail shows "Runner is waiting at Ground floor lobby". The button turns into "Arrived" and cannot be tapped again.
3. Runner taps **Enter code** → the **Enter handover code** popup (same popup component as Scan).
4. Buyer shows their 4-digit code. Runner types it.
5. Match, and the order is still `PICKED_UP` and held by this person → `DELIVERED`. Runner wallet +₹5 / +₹8 (students only; staff earn nothing). The delivery and the credit are one atomic step. Runner sees "Delivered. ₹5 added to your wallet." (staff: "Delivered."). Buyer Update: "Delivered at GICT. Enjoy!" Order moves to Past for both and leaves the cafe's Out for delivery column.
6. No match → "Code does not match", try again. After several wrong tries in a row the entry pauses for a minute.

## 5. Late detection

There is no background job on the free tier. Lateness is evaluated lazily and idempotently by `lib/late.ts › sweepLate()`, called at the start of every cafe queue poll, every buyer and runner order poll and the Admin Live orders poll. With at least one portal open, every order is checked every few seconds. (It runs at most once a second, however many screens are polling.)

1. For each active **delivery** order with `promisedAt` in `ACCEPTED`, `PREPARING`, `READY` or `PICKED_UP`: if `now ≥ promisedAt`, it is **due** (display only, amber, in the buyer, runner, cafe and Admin views). If `now ≥ promisedAt + GRACE_MIN`, it is settled. `PLACED` and pickup orders are never swept.
2. Settling is **one atomic step** that checks the order is still in the state the sweep saw, takes the one-time penalty lock (`SET qx:penalty:QX-4821 NX`) and does everything in BUSINESS_RULES "When grace ends": the order status and indexes, the buyer's refund and ledger entry, the holder's debit or earning and ledger entry, vending stock, the Updates and the cafe alert. If three devices poll at the same moment, one of them wins and the others change nothing.
3. Which outcome: `PICKED_UP` with `arrivedAt ≤ promisedAt` → `NO_SHOW`. Otherwise, a student runner → `FAILED_LATE` with the runner debited; staff → `FAILED_LATE`, nobody debited; no holder yet → `FAILED_LATE`, the cafe absorbs it.
4. Cafe alert cards, pinned above the four columns and kept until a staff member acts:
   - red "failed" card with **Seen** (rows 2 and 4);
   - red "Staff returning QX-4821 to Cafe Delice" with **Returned**, which marks the bag back at the counter (row 3);
   - amber "Buyer did not collect QX-4821, keep at counter" with the buyer's code entry (**Collect**) until the hold ends, then **Seen** (row 1).
5. Ready delivery orders with no holder for 3 minutes (`UNCLAIMED_ALERT_MIN`) get the amber "No runner yet, send with staff?" highlight in the cafe portal (display only).
6. An order the sweep finds already in a later state (delivered a moment ago, cancelled) is left alone.

## 6. Notifications (Updates tab)

Every status change and money event creates an Update for the affected users: `{ id, userId, orderId?, title, body, kind: "order" | "wallet" | "alert", at, read }`. The bottom bar shows an unread dot on Updates. Opening the tab marks all as read. Tapping an Update with an orderId opens that order.

The words, for the ordering, run and late events (buyer unless said otherwise):

| Event | Update |
|---|---|
| Runner buddy accepts | "Picked up by runner buddy Aarav. On the way to GICT." (staff: "Picked up by QuickX staff.") |
| Holder taps I'm here | "Your runner is at GICT ground floor lobby. Show your code." |
| Delivered | "Delivered at GICT. Enjoy!" Runner (student): "Delivered. ₹5 added to your wallet." |
| Failed late | "Your order could not reach GICT in time. ₹X has been refunded to your wallet." |
| Failed late, student runner | "Run QX-4821 was not delivered in time. ₹X has been deducted from your wallet. The food is yours to keep." |
| Failed late, staff | "QX-4821 ran out of time. Please bring it back to Cafe Delice." |
| No-show | "You missed your runner at GICT. Collect QX-4821 at the Cafe Delice counter with your code." Student runner: "Buyer did not show up for QX-4821. ₹5 has been added to your wallet. Please bring the bag back to Cafe Delice." Staff: "Buyer did not show up for QX-4821. Please bring the bag back to Cafe Delice." |

## 7. Live sync

Clients poll. Student portal: active order and Updates every 4 s, everything else on navigation. Cafe portal: queue every 3 s. Admin: every 5 s. Polling pauses when the tab is hidden (Page Visibility API) to save free-tier requests.
