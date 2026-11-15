# SCREENS

Build only these screens. Each line describes what is on screen, top to bottom. Visual rules come from UI_UX_BIBLE.md.

---

## Shared

**Gate `/`** — QuickX wordmark on the yellow brand panel (the only screen that uses the yellow full-bleed) with a simple Phosphor icon in a sand circle above it (until the Open Peeps illustration is added), one line "Food from UC, in your break.", code input with large letter-spaced characters, masked by default with a show/hide eye button inside the field, "Enter" pill button. Error text under the input.

**Identify `/identify`** — "Who's ordering?" AU number field, first-name field (first time only), "Continue". Link "I'm QuickX staff". Footer prototype note.

**Loading view** (all portals) — shown only while something is actually loading, never as a delay: a maroon cooking pot (Phosphor `CookingPot`, about 56 px) with three thin steam lines that rise and fade in a slow CSS loop, and "Your food is on the stove…" under it in mocha, on cream. Between pages in the student, Cafe and Admin portals the header (and the student bottom bar) stay and this fills the page area; for the first load after the gate it fills the window. With reduced motion the steam stands still. See UI_UX_BIBLE.md component 18.

---

## Student portal (mobile, 390 px)

Persistent **header** on every tab: left, greeting ("Good morning, Riya") or page title; right, the **Scan** button (maroon circle, scan icon) and the wallet chip (`₹240`, tap → Wallet). Temp-session countdown chip when under 3 minutes.

**Service banner** on every student screen, just under the header, only while Admin has switched the whole service off (Admin › Service): the message Admin wrote ("QuickX is not taking orders right now." by default), as a warning banner. It comes with the numbers the app already polls, so it appears and goes within a few seconds with no reload. Every place then reads "Not available" and no order can be placed.

Persistent **bottom bar**, floating, rounded: Home, Discover, Orders, Updates, Account. Active tab is a filled maroon circle with a cream icon; others are outline icons on parchment. Unread dot on Updates. Active-order dot on Orders.

### Home
1. Greeting + name, wallet chip, Scan button (header).
2. Low-balance banner if ₹50–99, blocking banner if under ₹50 ("Top up to order").
3. **Active order strip** (only if the user has one): source, status word, mini stepper, promised time, tap → Order Detail.
4. **Closed notice** (only while a place is closed or paused, and only until it is dismissed): a small banner with one line for each such place, three at most, in menu order: "Global Bistro opens at 12:00.", "Truly Indian is not taking orders right now." (paused), "Cafe Delice is closed today (Diwali).", "Greens and Grains has closed for today." A round close button dismisses it for the rest of the browser session. It follows the live hours, so a line goes when that place opens. It stays quiet while the whole service is off (the service banner says so).
5. Search field "Search poha, cold coffee, Paper Boat…" (searches all sources, results grouped by source).
6. **Order from** — five source tiles in a 2-column layout (vending spans full width at the bottom): small line illustration, name, one-line tagline and a status badge that follows the live hours: **Open now**, **Opens at 12:00**, **Closed today**, **Closed today (Diwali)** (the holiday's note), **Closed for today** (after closing time) or **Paused**. A long status wraps onto a second line inside the tile instead of running out of it. Tapping a closed tile still opens its menu (see Source).
7. **Next break** strip: "Next break 11:50 · order by 11:38 for GICT" based on breaks and the user's default building.
8. **Popular at UC** — horizontal row of arch-topped item cards (bestseller tag), each with price and a round "+" button.

### Source (menu) `/s/[sourceId]`
Back button, source name, tagline. Category chips if useful (e.g. Coffee, Sandwiches, Sweet). Item list: name, one-line description, price, prep "~5 min", "+" / stepper. Under the tagline a status badge (same words as the Home tile). An item the cafe switched off shows "Not today"; a sold-out vending item shows "Sold out". An item outside its own time window is not in the main list: it is listed at the bottom under **Unavailable now**, with its reason under the name ("Breakfast, until 11:00") and a disabled Add button. (Phase B moves these into an Unavailable tab.)

**When the place is closed or paused** a small bottom sheet opens on arrival with a title ("Global Bistro is not open yet", "Cafe Delice is closed today", "Truly Indian has closed for today", "Cafe Delice is paused"), the reason ("Global Bistro opens at 12:00.", "Cafe Delice is closed today (Diwali)."), when it opens next ("Opens tomorrow at 08:00.", "Opens Monday at 08:00." a pause has no time, so it says "Check back in a little while.") and **Browse the menu**. After that the menu can still be read, with the same reason in a line above the list and every Add button disabled. If the place opens while the sheet is up, it goes on the next refresh. Sticky cart bar at the bottom when cart is not empty: "3 items · ₹210 · View cart".

### Vending `/s/vending`
Looks like the machine: a parchment panel with three shelves (A, B, C), three cells to a row, each cell showing slot code, item name, price, stock ("4 left" / "Sold out"), refreshed every few seconds. Tap to add one; a count badge shows how many are in the cart, and quantities are changed in the cart. Same sticky cart bar. A line at the top: "Pay here, then enter your code at the machine, or get it delivered."

### Cart `/cart`
Items with steppers and remove, source name, "Add more items" pill, subtotal. "Checkout" button. An item that has become unavailable since it was added (switched off, its place closed or paused, outside its time window, sold out) stays in the cart, is flagged in red with the reason ("Kanda Poha is breakfast only, until 11:00."), and Checkout is disabled ("Fix the items marked below to continue.") until it is removed.

### Checkout `/checkout`
Mode toggle (Pick up at UC / Deliver to my building). Building list (6 rows: short name, drop point, walk time, fee). When: "As soon as possible" or slot chips. A chip is disabled when it is too late, when the place is closed at that time ("Closed") or when an item in the cart is outside its window then ("Not then"), with the reason in plain words underneath. Bill: subtotal, delivery fee, total. Wallet: balance now and after. Promised time estimate. Big pill button "Pay ₹235 from wallet". Disabled reasons shown in plain words.

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
3. **Preferences:** default building (the six buildings), default way to get it (pickup / delivery) and default time (As soon as possible / Next break). Saved to Redis with an explicit Save button. Checkout starts from them (the time stays on the preference until you pick one yourself; "Next break" is the first break still open, or as soon as possible if none is), and the Next break strip on Home uses the default building, or "for pickup" with no walk when pickup is the default.
4. **Notifications:** toggles (order updates, wallet updates, sounds), saved the moment they flip. Only "sounds" has an effect: a soft chime when a new Update arrives while QuickX is open (off by default); the other two say "Not connected yet".
5. **Order History:** same list as Orders › Past, plus finished runs (where it went, how it ended, and what it did to your wallet), with filters All / Orders / Runs.
6. **Refund Status:** every refund with reason (cancelled, rejected, failed late) and "Refunded to wallet" state.
7. **Terms and Conditions:** short static text including the prototype disclaimer.
8. **Feedback:** same as Discover › Feedback.
9. **Support:** UC help desk text, team contact placeholder, FAQ link.
10. **Logout:** confirm sheet.

### Runner popup (global component, bottom sheet)
States: **Scanning** (camera view + "Type order ID instead" link) → **Preview** (order summary, destination, earning, Accept) → **Accepted** (confirmation with deliver-by time) or an **Error** line. Handover mode: 4 large digit boxes, "Confirm delivery", result state.

---

## Cafe portal (laptop, 1280 px) `/cafe`

Header: "QuickX · UC Cafe Desk", the pages (**Queue**, **Vending**, **Hours and items**, **Today**), sound toggle, clock, Logout. (Phase C replaces this header with a sidebar.)

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

### Hours and items `/cafe/hours`
One page for when each place takes orders and which items can be ordered. A save confirms in words at the top ("Truly Indian: hours saved.") and reaches students on their next poll, a few seconds. Orders already placed are never touched. (The old `/cafe/menu` address redirects here.) If Admin has switched the whole service off, a warning at the top says so.
1. **Places.** One card per place (all five, including the vending machine): what students see right now ("Right now: Open now"), a **Taking orders / Paused** switch (applies at once, confirms in words), **Opens** and **Closes** times, **Open days** as Mon to Sun toggles, and **Save hours**. Times are on 5-minute steps and closing must be after opening; at least one day must stay on. A wrong value is refused with a sentence and nothing is sent. "Not saved yet" shows while a card has edits.
2. **Holidays.** Add a date and a short note ("Diwali"); the list is sorted earliest first, shows the date in words, and each row has Remove. On a holiday every place is closed.
3. **Items.** Chips pick the place. Each item row shows its price, its current window ("Breakfast, until 11:00 · Default", "No time limit · Default", "… · Changed"), **Available from** and **Available until** times (leave one or both empty for no limit), **Save times**, **Back to default** (when it differs from the default) and the **Available today** switch (moved here from the old Menu page). Until must be after from. Clearing both times on an item that has a default window means "no limit"; Back to default restores the default.

### Today
Totals: orders, delivered, collected, failed, revenue by source, fees kept, refunds. Plain table, no charts needed.

---

## Admin portal (laptop) `/admin`

Header: "QuickX Admin", links **Codes**, **Staff**, **Users**, **Live orders** and **Service** (the open page uses the selected chip colours), Logout.

1. **Codes:** permanent codes (masked, reveal, copy). Temporary pool table: code, status (unused / active with time left / burned / revoked), used by, used at. Buttons: Copy, Revoke (unused), End session (active), Generate now (refill). A large "show code" mode to display one unused code in big type for someone to type in.
2. **Staff** (`/admin/staff`): "Add staff" takes a first name and creates the next ID (`QX-STF-01`, `QX-STF-02`, …), shown clearly with a Copy button and a line saying how they sign in. Below it, the list of staff (ID, name, Copy). Empty state: Phosphor icon in a sand circle, "No staff yet. Add the first person above."
3. **Users and wallets:** search by AU/staff ID, see balance and ledger, "Adjust" (+/− amount with a required note).
4. **Live orders** (`/admin/orders`, pulled forward from Phase 10): every active order, refreshed every 5 s. Each row: the order ID in large type, source, status, mode, building and drop point (delivery), holder name and kind (runner buddy or staff), promised time with a countdown (amber when due), and when the holder tapped "I'm here". Each row has **Copy order ID** and **Reveal code**. Reveal code shows that one order's 4-digit code (it is fetched on tap, only with an admin session, checked on the server, and is never part of the list reply); tap again to hide. Reveal code is a demo tool.
5. **Service** (`/admin/service`): the only place the whole service is switched. A **QuickX is available** switch, the **message** students read while it is off (up to 140 characters, default "QuickX is not taking orders right now."), **Save message**, and a preview of the banner students will see. Switching it off asks first ("Turn the service off? Nobody can place a new order until you turn it back on. Orders already placed carry on."); switching it on, or changing the message, does not. While it is off every student screen shows the banner, every place reads "Not available" and the server refuses all new orders. Active orders are not touched.
6. **Demo tools:** "Seed demo data" (creates users AU2340101 Riya ₹300, AU2340102 Aarav ₹120, AU2340103 Meera ₹300, staff QX-STF-01 Ramesh, and 2 past delivered orders), "Create late-test order" (picks a buyer and a runner, creates a delivery order already `PICKED_UP` by that runner with the promised time 1 minute from now, so the grace runs out about 6 minutes later on stage), "Reset all data" (orders, wallets, users, updates, stock; keeps codes and staff unless ticked) with typed confirmation `RESET`.
