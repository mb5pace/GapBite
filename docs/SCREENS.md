# SCREENS

Build only these screens. Each line describes what is on screen, top to bottom. Visual rules come from UI_UX_BIBLE.md.

---

## Shared

**Gate `/`** — QuickX wordmark on the yellow brand panel (the only screen that uses the yellow full-bleed) with a simple Phosphor icon in a sand circle above it (until the Open Peeps illustration is added), one line "Food from UC, in your break.", code input with large letter-spaced characters, masked by default with a show/hide eye button inside the field, "Enter" pill button. Error text under the input.

**Identify `/identify`** — "Who's ordering?" AU number field, first-name field (first time only), "Continue". Link "I'm QuickX staff". Footer prototype note.

---

## Student portal (mobile, 390 px)

Persistent **header** on every tab: left, greeting ("Good morning, Riya") or page title; right, the **Scan** button (maroon circle, scan icon) and the wallet chip (`₹240`, tap → Wallet). Temp-session countdown chip when under 3 minutes.

Persistent **bottom bar**, floating, rounded: Home, Discover, Orders, Updates, Account. Active tab is a filled maroon circle with a cream icon; others are outline icons on parchment. Unread dot on Updates. Active-order dot on Orders.

### Home
1. Greeting + name, wallet chip, Scan button (header).
2. Low-balance banner if ₹50–99, blocking banner if under ₹50 ("Top up to order").
3. **Active order strip** (only if the user has one): source, status word, mini stepper, promised time, tap → Order Detail.
4. Search field "Search poha, cold coffee, Paper Boat…" (searches all sources, results grouped by source).
5. **Order from** — five source tiles in a 2-column layout (vending spans full width at the bottom): name, one-line tagline, "Open" state (always open in the prototype), small line illustration.
6. **Next break** strip: "Next break 11:50 · order by 11:38 for GICT" based on breaks and the user's default building.
7. **Popular at UC** — horizontal row of arch-topped item cards (bestseller tag), each with price and a round "+" button.

### Source (menu) `/s/[sourceId]`
Back button, source name, tagline. Category chips if useful (e.g. Coffee, Sandwiches, Sweet). Item list: name, one-line description, price, prep "~5 min", "+" / stepper. Morning items after 11:30 show "Morning only". Unavailable items show "Not today". Sticky cart bar at the bottom when cart is not empty: "3 items · ₹210 · View cart".

### Vending `/s/vending`
Looks like the machine: a parchment panel with three shelves (A, B, C), three cells to a row, each cell showing slot code, item name, price, stock ("4 left" / "Sold out"), refreshed every few seconds. Tap to add one; a count badge shows how many are in the cart, and quantities are changed in the cart. Same sticky cart bar. A line at the top: "Pay here, then enter your code at the machine, or get it delivered."

### Cart `/cart`
Items with steppers and remove, source name, "Add more items" pill, subtotal. "Checkout" button.

### Checkout `/checkout`
Mode toggle (Pick up at UC / Deliver to my building). Building list (6 rows: short name, drop point, walk time, fee). When: "As soon as possible" or slot chips (disabled if too late). Bill: subtotal, delivery fee, total. Wallet: balance now and after. Promised time estimate. Big pill button "Pay ₹235 from wallet". Disabled reasons shown in plain words.

### Order Detail `/o/[orderId]`
Order ID, source, status headline ("Out for delivery to GICT"). **Vertical stepper** (Placed, Accepted, Preparing, Ready, Picked up, Delivered, or the pickup variant) with times. Large code box (4 digits) with the instruction line. Holder line ("Runner buddy: Aarav" / "QuickX staff"). Promised time with countdown; amber "Due now" when due, red when failed. While the holder has tapped "I'm here" and the order is `PICKED_UP`: a line "Runner is waiting at <drop point>" above the code. A `NO_SHOW` order reads "You missed your runner at <building>" with the instruction "Collect QX-4821 at the <source> counter with your code", keeps the code box and shows "Hold until HH:MM" while the buyer can still collect (`PICKUP_STALE_MIN`). Items and bill. Cancel button only while `PLACED`.

### Discover
List of five rows, each opening a simple content page: **Introduction** (what QuickX is, 3 short paragraphs with one illustration), **Help** (how to order, how pickup works, how delivery works), **Smart Vending** (how paying for the vending machine works, with a button "Open vending" → `/s/vending`), **Feedback** (textarea + 1–5 face rating, saved to Redis, thank-you state), **FAQ** (accordion: fees, wallet minimum, what happens if late, how runners earn, refunds).

### Orders
Two tabs: **Active** and **Past**. Active has two groups when relevant: "My orders" and "My runs". Run cards (students and staff, including orders given to staff with "Send with staff") show building, drop point, buyer first name, a countdown to the promised time (amber "Due now" once it passes), an **I'm here** button (becomes "Arrived" after it is tapped) and an **Enter code** button. Past shows terminal orders with status badge (Delivered, Collected, Cancelled, Rejected, Failed late, Missed delivery) and amount.

### Updates
Reverse-chronological feed grouped by Today / Earlier. Each row: small icon by kind, title, body, time. Unread rows have a maroon dot. Tapping opens the order if linked. Empty state with illustration: "Nothing yet. Your order updates show up here."

### Account
Profile card at top (name, AU or staff ID, Staff badge if staff, wallet balance). Then rows: **Wallet**, **My Profile**, **Preferences**, **Notifications**, **Order History**, **Refund Status**, **Terms and Conditions**, **Feedback**, **Support**, **Logout**.
1. **Wallet:** balance, Top up (mock UPI sheet: amount chips, "Pay with UPI" → 1.5 s processing → success), ledger list with type, amount (+/−), order link, time.
2. **My Profile:** name (editable), ID (read-only), role.
3. **Preferences:** default building, default mode (pickup/delivery), default "when" (ASAP). Saved to Redis.
4. **Notifications:** toggles (order updates, wallet updates, sounds). Only "sounds" has an effect; others are cosmetic and say so.
5. **Order History:** same list as Orders › Past, plus runs, with filters All / Orders / Runs.
6. **Refund Status:** every refund with reason (cancelled, rejected, failed late) and "Refunded to wallet" state.
7. **Terms and Conditions:** short static text including the prototype disclaimer.
8. **Feedback:** same as Discover › Feedback.
9. **Support:** UC help desk text, team contact placeholder, FAQ link.
10. **Logout:** confirm sheet.

### Runner popup (global component, bottom sheet)
States: **Scanning** (camera view + "Type order ID instead" link) → **Preview** (order summary, destination, earning, Accept) → **Accepted** (confirmation with deliver-by time) or an **Error** line. Handover mode: 4 large digit boxes, "Confirm delivery", result state.

---

## Cafe portal (laptop, 1280 px) `/cafe`

Header: "QuickX · UC Cafe Desk", source filter tabs (All, Truly Indian, Global Bistro, Cafe Delice, Greens and Grains, Vending), sound toggle, clock, Logout.

### Queue (default)
Four columns: **New**, **Preparing**, **Ready**, **Out for delivery**. Cards show order ID, source, items with quantities, mode badge (Pickup / building short name), "when", promised time with live countdown, age. Amber border when due, or when a Ready delivery order has had no runner for 3 minutes ("No runner yet, send with staff?"). Red and amber alert cards sit pinned above the columns (see Alerts). Card buttons by column: New → Accept / Reject (reason picker); Preparing → Mark ready; Ready (delivery) → Show bag slip, Send with staff; Ready (pickup) → Collect (4-digit input); Out for delivery → holder name and kind, countdown. 

### Alerts (pinned above the four columns)
Each stays until a staff member acts on it.
- **Red, failed:** "QX-4821 failed late: <why>. ₹X refunded." with **Seen**.
- **Red, staff returning:** "Staff returning QX-4821 to <source>" with **Returned** (the bag is back at the counter).
- **Amber, no-show:** "Buyer did not collect QX-4821, keep at counter", the hold time (`PICKUP_STALE_MIN`) with a countdown and the 4-digit **Collect** input for the buyer's code. When the hold ends the card says so and shows **Seen**.

### Bag slip (modal)
Printable layout: big QR, order ID, source, items, building + drop point or PICKUP, promised time. "Print" uses the browser print dialog with a print stylesheet.

### Vending
Two parts: **Stock** table (slot, item, stock, +/− buttons, "Refill all") and **Kiosk** button that opens `/cafe/kiosk`.

### Kiosk `/cafe/kiosk`
Full-screen machine face for the laptop beside the vending machine: "Enter your QuickX code" with a numeric keypad, then a dispensing state that highlights each slot being released, then "Collect below". Wrong code: "Code not found or already used."

### Menu availability
List of all items for the selected source with an "Available today" switch.

### Today
Totals: orders, delivered, collected, failed, revenue by source, fees kept, refunds. Plain table, no charts needed.

---

## Admin portal (laptop) `/admin`

Header: "QuickX Admin", links **Codes**, **Staff**, **Users** and **Live orders** (the open page uses the selected chip colours), Logout.

1. **Codes:** permanent codes (masked, reveal, copy). Temporary pool table: code, status (unused / active with time left / burned / revoked), used by, used at. Buttons: Copy, Revoke (unused), End session (active), Generate now (refill). A large "show code" mode to display one unused code in big type for someone to type in.
2. **Staff** (`/admin/staff`): "Add staff" takes a first name and creates the next ID (`QX-STF-01`, `QX-STF-02`, …), shown clearly with a Copy button and a line saying how they sign in. Below it, the list of staff (ID, name, Copy). Empty state: Phosphor icon in a sand circle, "No staff yet. Add the first person above."
3. **Users and wallets:** search by AU/staff ID, see balance and ledger, "Adjust" (+/− amount with a required note).
4. **Live orders** (`/admin/orders`, pulled forward from Phase 10): every active order, refreshed every 5 s. Each row: the order ID in large type, source, status, mode, building and drop point (delivery), holder name and kind (runner buddy or staff), promised time with a countdown (amber when due), and when the holder tapped "I'm here". Each row has **Copy order ID** and **Reveal code**. Reveal code shows that one order's 4-digit code (it is fetched on tap, only with an admin session, checked on the server, and is never part of the list reply); tap again to hide. Reveal code is a demo tool.
5. **Demo tools:** "Seed demo data" (creates users AU2340101 Riya ₹300, AU2340102 Aarav ₹120, AU2340103 Meera ₹300, staff QX-STF-01 Ramesh, and 2 past delivered orders), "Create late-test order" (picks a buyer and a runner, creates a delivery order already `PICKED_UP` by that runner with the promised time 1 minute from now, so the grace runs out about 6 minutes later on stage), "Reset all data" (orders, wallets, users, updates, stock; keeps codes and staff unless ticked) with typed confirmation `RESET`.
