# BUSINESS RULES

Every number here goes into `lib/config.ts` as a named constant. All money is integer rupees.

## Delivery fee and runner earning (by zone)

| Mode | Zone | Buyer pays | Runner buddy earns | If staff delivers |
|---|---|---|---|---|
| Pickup at UC | any | ₹0 | – | – |
| Delivery | near (AG, GICT, SAS, AMSOM) | ₹5 | ₹5 | cafe keeps ₹5 |
| Delivery | far (VentureStudio, BK) | ₹10 | ₹8 | cafe keeps ₹10 |

The fee depends only on the zone, never on who ends up delivering, so the buyer sees the exact total at checkout. In the far zone the cafe keeps the ₹2 difference when a runner delivers. Runner earnings are real wallet rupees (there are no separate points). They are credited only when the delivery is confirmed with the correct handover code.

```ts
FEES = { pickup: 0, near: 5, far: 10 }
RUNNER_EARN = { near: 5, far: 8 }
```

## Wallet

1. Every user (student or staff) has one QuickX wallet. All payments come out of it: food plus delivery fee, in one debit at checkout.
2. Top-up is a mock UPI screen (amount chips ₹50, ₹100, ₹200, ₹500 or custom ₹10–₹2000). It always succeeds after a short fake "processing" step. No real payment.
3. New users start with ₹0. The Admin portal can add or take away money with a required note (for demos). An adjustment never takes a wallet below ₹0, and is at most ₹10,000 at a time.
4. `WALLET_MIN_TO_USE = 50`. If the balance is below ₹50, the user cannot place an order and cannot accept a run. They can still browse, top up and see their orders.
5. `WALLET_SUGGESTED = 100`. If the balance is ₹50–₹99, show a non-blocking banner: "Keep at least ₹100 in your wallet so orders never get stuck."
6. To place an order the balance must be at least ₹50 **and** at least the order total. After paying, the balance may drop below ₹50; that is fine.
7. The wallet can go negative, but only through a late-delivery penalty ("When grace ends", below). A negative wallet is below ₹50, so rule 4 blocks the user until they top up.
8. Every change writes a ledger entry: top-up, order payment, refund, runner earning, penalty, admin adjustment. The ledger is what Account › Wallet shows.

## Runner buddy rules

1. Any student with balance ≥ ₹50 can accept a run by scanning a Ready delivery order.
2. You cannot accept your own order.
3. Maximum 3 active runs at once (`MAX_ACTIVE_RUNS = 3`). Encourage runs to the same building; do not enforce it.
4. Only orders in status `READY` with mode `delivery` can be accepted. First valid scan wins; everyone else sees "Already taken".
5. On a correct handover code: order becomes `DELIVERED`, runner's wallet is credited with RUNNER_EARN for that zone.
6. Wrong handover code: show "Code does not match", allow retries, no penalty for wrong tries. (Too many wrong tries in a row pause the entry for a minute, so a code cannot be guessed. That is a limit, not a penalty.)
7. **Arrival ("I'm here").** At the drop point the holder taps "I'm here" on the run in Orders › My runs. Allowed only while the order is `PICKED_UP` and only by the holder. The server records `arrivedAt` (server time) and tells the buyer. An arrival at or before the promised time protects the holder at grace end (see "When grace ends"). Tapping again changes nothing.
8. Only the holder can enter the handover code for an order.

## Staff delivery

1. A staff user (ID `QX-STF-NN`) can accept runs from the same Scan popup; the button reads "Accept as staff delivery".
2. Staff have no run limit and no ₹50 requirement for runs.
3. Staff earn nothing to their wallet; the delivery fee stays with the cafe.
4. In the Cafe portal, staff at the counter can also tap "Send with staff" on a Ready order to assign it to staff without scanning.
5. Orders given to staff with "Send with staff" appear in that staff member's Orders › My runs, so they can tap "I'm here" and enter the handover code like a runner. Nothing is credited to a staff wallet.
6. `UNCLAIMED_ALERT_MIN = 3`: if a Ready delivery order has no runner after 3 minutes, the cafe portal highlights it as "No runner yet, send with staff?".

## Promised time and grace

1. **As soon as possible:** promised time = time the cafe accepts + prep time + walk time to the building + `BUFFER_MIN` (2). Before acceptance, show the estimate from placement time.
2. **For a break slot:** promised time = the slot time. A slot can be chosen only if `now + prep + walk + SLOT_LEAD_BUFFER_MIN` (5) is before the slot; otherwise it is greyed out.
3. **Pickup:** promised time = accept + prep. Pickup orders never fail automatically; uncollected pickups are shown to the cafe after `PICKUP_STALE_MIN` (30) minutes and can be closed manually.
4. `GRACE_MIN = 5`. At the promised time, a delivery order that is not yet delivered turns amber ("Due now") in the buyer, runner, cafe and Admin views. At promised time + 5 minutes, if it is still not `DELIVERED`, it is settled by "When grace ends" below. The promised time is fixed when the cafe accepts and never moves again.

## When grace ends

Grace ends at the promised time + `GRACE_MIN`. Only delivery orders in `ACCEPTED`, `PREPARING`, `READY` or `PICKED_UP` are checked (`PLACED` is skipped: the buyer can cancel or the cafe can reject; pickups never fail by themselves). Each order is settled exactly once. The first row that fits wins.

| # | Situation when grace ends | Order becomes | Buyer | Holder | Cafe |
|---|---|---|---|---|---|
| 1 | `PICKED_UP`, and the holder tapped "I'm here" at or before the promised time (`arrivedAt ≤ promisedAt`) | `NO_SHOW` (terminal) | **no refund**: the buyer missed the delivery | a student runner **still earns** RUNNER_EARN; staff earn nothing | the bag goes back to the source counter; amber card "Buyer did not collect QX-NNNN, keep at counter" |
| 2 | `PICKED_UP`, held by a student runner buddy, no on-time arrival | `FAILED_LATE` | full refund to the wallet (food + fee) | wallet **debited the full order total** (can go negative), no earning; **keeps the food**, they paid for it | red alert card with "Seen" |
| 3 | `PICKED_UP`, held by staff, no on-time arrival | `FAILED_LATE` | full refund | no wallet is debited; staff bring the bag back to the cafe | the cafe absorbs it; red alert card "Staff returning QX-NNNN to <source>" with a "Returned" button |
| 4 | Nobody picked it up yet (`ACCEPTED`, `PREPARING` or `READY`) | `FAILED_LATE` | full refund | – | the cafe absorbs it; red alert card with "Seen" |

After a failure or no-show the handover code stops working, except as row 1 says below.

**Buyer no-show (row 1).** The buyer keeps the same 4-digit code and can collect the bag at the source counter for `PICKUP_STALE_MIN` minutes after the no-show. The cafe types the code into the amber card to hand it over. When that time is over the card says the hold ended and can be dismissed with "Seen". Nothing is refunded in either case. If a vending item was in the bag, its stock is not returned.

**Stock.** A vending order that fails in row 3 or 4 puts its items back into the machine count with the refund (the bag stays with the cafe). In row 2 the runner keeps the food, so nothing goes back. No-show returns nothing.

**Messages.**
- Buyer, rows 2 to 4: "Your order could not reach GICT in time. ₹X has been refunded to your wallet."
- Buyer, row 1: "You missed your runner at GICT. Collect QX-NNNN at the <source> counter with your code."
- Student runner, row 2: "Run QX-NNNN was not delivered in time. ₹X has been deducted from your wallet. The food is yours to keep."
- Staff, row 3: "QX-NNNN ran out of time. Please bring it back to <source>."
- Student runner, row 1: "Buyer did not show up for QX-NNNN. ₹X has been added to your wallet. Please bring the bag back to <source>." Staff, row 1: "Buyer did not show up for QX-NNNN. Please bring the bag back to <source>."
- Buyer, when the holder taps "I'm here": "Your runner is at GICT ground floor lobby. Show your code."

Because a penalty can be larger than the runner's balance, the runner's wallet can go negative (see Wallet rule 7).

## Opening hours, holidays and pauses

Whether a student can order right now is decided by the places' opening hours, holidays, pauses, per-item time windows and one service-wide switch. There is no "morning" tag and no 11:30 rule. Every time is IST, on 5-minute steps, and the server's clock decides. The defaults are in `data/hours.ts`; the live values are one Redis hash (`hours`) that the Cafe portal edits (Hours and items), and the service switch is a second hash (`service`) that only Admin › Service edits. A change applies to students on their next poll.

**Defaults.**

| Place | Open | Days |
|---|---|---|
| Truly Indian, Cafe Delice, Greens and Grains, UC Vending Machine | 08:00 to 19:00 | Monday to Saturday |
| Global Bistro | 12:00 to 19:00 | Monday to Saturday |

Sunday is closed for every place. A window is half-open: "08:00 to 19:00" accepts orders from 08:00:00 to 18:59:59, and "until 11:00" stops at 11:00:00.

**Item windows.** Any item may have an available-from and/or an available-until time (the Cafe sets them per item). A missing from means "from the place's opening", a missing until means "until it closes". The six breakfast items (Methi Thepla, Kanda Poha, Upma, Aloo Paratha, Paneer Paratha, Matar Paneer Paratha) default to "until 11:00" and read "Breakfast, until 11:00". The Cafe can change a window, or clear it ("no limit").

**Holidays.** A list of dates (YYYY-MM-DD) with a short note ("Diwali"). On a holiday every place is closed, whatever the day of the week. The list starts empty and the Cafe adds and removes dates.

**Pauses.** Each place has a "Taking orders / Paused" switch (Cafe portal). Paused means no new orders for that place, now, with no end time. The whole service has a "QuickX available / not available" switch with a message (default "QuickX is not taking orders right now."), set only from Admin › Service. When it is off every student screen shows the message and no order can be placed.

**The ordering rule.** An order is placed only if all of these hold. The server checks them in place-order, in this order, and the first one that fails refuses the order with its sentence. The screens mirror the same rule and grey things out, but the server has the final say.

| | Rule | Refusal (examples) |
|---|---|---|
| a | The QuickX service is available | the Admin message |
| b | The place is not paused | "Truly Indian is not taking orders right now." |
| c | Today is an open day for the place and not a holiday | "Cafe Delice is closed today." / "Cafe Delice is closed today (Diwali)." |
| d | The current time is within the place's hours | "Global Bistro opens at 12:00." / "Cafe Delice has closed for today." |
| e | The target time is within the place's hours | "Cafe Delice closes at 19:00, so this order would not be ready in time." |
| f | For every item, the current time and the target time are both inside that item's window | "Kanda Poha is breakfast only, until 11:00." / "Tea is available from 12:00." |

The **target time** is when the order should reach the buyer: the ASAP promised-time estimate, or the chosen break slot. So Kanda Poha at 10:30 for as soon as possible (arriving about 10:40) is allowed, at 10:50 for the 11:50 break is refused, and at 11:05 is refused.

**Orders already placed are never affected.** Hours, pauses, holidays and the service switch only stop *new* orders. An order that exists keeps moving through the normal flow (accept, prepare, ready, carry, deliver, late handling), and a retry of the same checkout press that already made an order returns that order even if the place has just closed.

**Break slots.** A break in Checkout is greyed out ("Closed" or "Not then") when the place is closed at that time or an item in the cart is outside its window then, with the plain reason underneath. The Home "Next break" strip skips such breaks and, when none is left, says why ("Global Bistro opens at 12:00.", "Nothing is open right now. Truly Indian opens tomorrow at 08:00.").

## Cancellations

1. Buyer can cancel only while status is `PLACED` (before the cafe accepts): full refund.
2. Cafe can reject a `PLACED` order (for example, item ran out): full refund, buyer notified with the reason.
3. After `ACCEPTED`, no cancellation by the buyer. (A late or missed delivery is settled by "When grace ends".)
4. Refunds return vending stock if the item was not dispensed.

## Other limits

1. One source per cart. Adding from another source asks: "Start a new cart from Cafe Delice? Your Truly Indian cart will be cleared."
2. Maximum 10 units per order.
3. Whether something can be ordered right now depends on opening hours, holidays, pauses and per-item time windows. There is no separate morning rule and no 11:30 cutoff any more. See "Opening hours, holidays and pauses" below.
4. Order IDs look like `QX-4821` (4 random digits, unique). Handover and collect codes are 4 digits and different from the order ID.
