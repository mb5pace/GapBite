# FLOWS

## Order status machine

```
PLACED ──accept──▶ ACCEPTED ──start──▶ PREPARING ──ready──▶ READY
  │                                                            │
  ├─buyer cancel─▶ CANCELLED                                   ├─(pickup) collect code ok──▶ COLLECTED
  └─cafe reject──▶ REJECTED                                    │
                                                               └─(delivery) scan accepted──▶ PICKED_UP ──handover code ok──▶ DELIVERED

Any of ACCEPTED, PREPARING, READY, PICKED_UP ──grace ended──▶ FAILED_LATE
```

Terminal statuses: `COLLECTED`, `DELIVERED`, `CANCELLED`, `REJECTED`, `FAILED_LATE`. Active = any other status. Each transition is a server function in `lib/orders.ts` that checks the current status and rejects anything not on this diagram.

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

## 3c. Staff from the counter

On a Ready delivery order in the Cafe portal, **Send with staff** opens a picker of staff IDs. Choosing one sets holder kind staff → `PICKED_UP`. Same buyer Update as above.

## 4. Handover

1. Runner reaches the drop point. Orders › Active shows their runs under "My runs" with building, buyer first name and a countdown to promised time.
2. Runner taps the run → **Enter handover code** popup (same popup component as Scan).
3. Buyer shows their 4-digit code. Runner types it.
4. Match → `DELIVERED`. Runner wallet +₹5 / +₹8 (students only). Runner sees "Delivered. ₹5 added to your wallet." Buyer Update: "Delivered at GICT. Enjoy!" Order moves to Past for both.
5. No match → "Code does not match", try again.

## 5. Late detection

There is no background job on the free tier. Lateness is evaluated lazily and idempotently by `lib/late.ts › sweepLate()`, called at the start of every cafe queue poll, every buyer/runner order poll and the admin dashboard. With at least one portal open, every order is checked every few seconds.

1. For each active delivery order with `promisedAt`: if `now ≥ promisedAt`, mark it **due** (display only, amber). If `now ≥ promisedAt + GRACE_MIN`, fail it.
2. Failing uses a one-time lock (`SET penalty:QX-4821 1 NX`) so refund and penalty run exactly once even if three devices poll at the same moment.
3. Apply the table in BUSINESS_RULES "Late delivery penalty". Write ledger entries and Updates for buyer and runner. Create a red alert in the cafe portal.
4. Ready delivery orders with no holder for 3 minutes get the amber "No runner yet" highlight in the cafe portal (display only).

## 6. Notifications (Updates tab)

Every status change and money event creates an Update for the affected users: `{ id, userId, orderId?, title, body, kind: "order" | "wallet" | "alert", at, read }`. The bottom bar shows an unread dot on Updates. Opening the tab marks all as read. Tapping an Update with an orderId opens that order.

## 7. Live sync

Clients poll. Student portal: active order and Updates every 4 s, everything else on navigation. Cafe portal: queue every 3 s. Admin: every 5 s. Polling pauses when the tab is hidden (Page Visibility API) to save free-tier requests.
