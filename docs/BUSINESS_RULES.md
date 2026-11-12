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
3. New users start with ₹0. The Admin portal can add money (for demos).
4. `WALLET_MIN_TO_USE = 50`. If the balance is below ₹50, the user cannot place an order and cannot accept a run. They can still browse, top up and see their orders.
5. `WALLET_SUGGESTED = 100`. If the balance is ₹50–₹99, show a non-blocking banner: "Keep at least ₹100 in your wallet so orders never get stuck."
6. To place an order the balance must be at least ₹50 **and** at least the order total. After paying, the balance may drop below ₹50; that is fine.
7. The wallet can go negative, but only through a late-delivery penalty (below). A negative wallet is below ₹50, so rule 4 blocks the user until they top up.
8. Every change writes a ledger entry: top-up, order payment, refund, runner earning, penalty, admin adjustment. The ledger is what Account › Wallet shows.

## Runner buddy rules

1. Any student with balance ≥ ₹50 can accept a run by scanning a Ready delivery order.
2. You cannot accept your own order.
3. Maximum 3 active runs at once (`MAX_ACTIVE_RUNS = 3`). Encourage runs to the same building; do not enforce it.
4. Only orders in status `READY` with mode `delivery` can be accepted. First valid scan wins; everyone else sees "Already taken".
5. On a correct handover code: order becomes `DELIVERED`, runner's wallet is credited with RUNNER_EARN for that zone.
6. Wrong handover code: show "Code does not match", allow retries, no penalty for wrong tries.

## Staff delivery

1. A staff user (ID `QX-STF-NN`) can accept runs from the same Scan popup; the button reads "Accept as staff delivery".
2. Staff have no run limit and no ₹50 requirement for runs.
3. Staff earn nothing to their wallet; the delivery fee stays with the cafe.
4. In the Cafe portal, staff at the counter can also tap "Send with staff" on a Ready order to assign it to staff without scanning.
5. `UNCLAIMED_ALERT_MIN = 3`: if a Ready delivery order has no runner after 3 minutes, the cafe portal highlights it as "No runner yet, send with staff?".

## Promised time and grace

1. **As soon as possible:** promised time = time the cafe accepts + prep time + walk time to the building + `BUFFER_MIN` (2). Before acceptance, show the estimate from placement time.
2. **For a break slot:** promised time = the slot time. A slot can be chosen only if `now + prep + walk + 5` is before the slot; otherwise it is greyed out.
3. **Pickup:** promised time = accept + prep. Pickup orders never fail automatically; uncollected pickups are shown to the cafe after 30 minutes and can be closed manually.
4. `GRACE_MIN = 5`. At the promised time, the order turns amber ("Due now") in both buyer and cafe views. At promised time + 5 minutes, if not `DELIVERED`, it fails.

## Late delivery penalty (when grace ends)

Whoever is holding the order when grace ends is responsible.

| Holder at grace end | Order becomes | Buyer | Responsible party |
|---|---|---|---|
| Runner buddy (status `PICKED_UP`) | `FAILED_LATE` | full refund to wallet (food + fee) | runner wallet debited by the full order total; no earning |
| Staff (status `PICKED_UP`, staff) | `FAILED_LATE` | full refund | cafe absorbs it; no wallet debited |
| No one yet (`ACCEPTED`, `PREPARING`, `READY`) | `FAILED_LATE` | full refund | cafe absorbs it |

After failing, the handover code stops working. The cafe portal shows a red alert card that stays until a staff member taps "Seen". The buyer gets an Update: "Your order could not reach GICT in time. ₹X has been refunded to your wallet." The runner gets: "Run QX-4821 was not delivered in time. ₹X has been deducted from your wallet."

Because a penalty can be larger than the runner's balance, the runner's wallet can go negative (see Wallet rule 7).

## Cancellations

1. Buyer can cancel only while status is `PLACED` (before the cafe accepts): full refund.
2. Cafe can reject a `PLACED` order (for example, item ran out): full refund, buyer notified with the reason.
3. After `ACCEPTED`, no cancellation by the buyer.
4. Refunds return vending stock if the item was not dispensed.

## Other limits

1. One source per cart. Adding from another source asks: "Start a new cart from Cafe Delice? Your Truly Indian cart will be cleared."
2. Maximum 10 units per order.
3. Morning items cannot be ordered after 11:30.
4. Order IDs look like `QX-4821` (4 random digits, unique). Handover and collect codes are 4 digits and different from the order ID.
