# SCREENS

Build only these screens. Each line describes what is on screen, top to bottom. Visual rules come from UI_UX_BIBLE.md.

---

## Shared

**Gate `/`** — QuickX wordmark on the yellow brand panel (the only screen that uses the yellow full-bleed) with a simple Phosphor icon in a sand circle above it (until the Open Peeps illustration is added), one line "Food from UC, in your break.", code input with large letter-spaced characters, masked by default with a show/hide eye button inside the field, "Enter" pill button. Error text under the input.

**Identify `/identify`** — "Who's ordering?" AU number field, first-name field (first time only), "Continue". Link "I'm QuickX staff". Footer prototype note.

**Loading view** (all portals) — shown only while something is actually loading, never as a delay: a maroon cooking pot (Phosphor `CookingPot`, about 56 px) with three thin steam lines that rise and fade in a slow CSS loop, and "Your food is on the stove…" under it in mocha, on cream. Between pages in the student, Cafe and Admin portals the header (and the student bottom bar) stay and this fills the page area; for the first load after the gate (and after Identify) it covers the whole window from the moment the code is accepted until the first page arrives. With reduced motion the steam stands still. See UI_UX_BIBLE.md component 18.

---

## Student portal (mobile, 390 px)

Persistent **header** on every tab: left, on Home the campus (a map pin, "Ahmedabad University" and under it "University Centre (UC)"), on other pages the page title or a Back arrow; right, the **Scan** button (maroon circle, scan icon) and the wallet chip (`₹240`, tap → Wallet). Temp-session countdown chip when under 3 minutes.

The **Scan button badge** is a small sun circle with the number in espresso on the button's top right corner: how many delivery bags are ready at UC with nobody carrying them (your own orders are not counted). Hidden at 0. It is read every 10 seconds from `/api/runs/ready`, and not while the tab is hidden. The button's label reads "Scan a bag, 2 ready to deliver".

**Service banner** on every student screen, just under the header, only while Admin has switched the whole service off (Admin › Service): the message Admin wrote ("QuickX is not taking orders right now." by default), as a warning banner. It comes with the numbers the app already polls, so it appears and goes within a few seconds with no reload. Every place then reads "Not available" and no order can be placed.

Persistent **bottom bar**, floating, rounded: Home, Discover, Orders, Updates, Account. Active tab is a filled maroon circle with a cream icon; others are outline icons on parchment. Unread dot on Updates. Active-order dot on Orders.

### Home
1. **Greeting:** "Good evening, Riya" (the first name you gave, with a Staff badge for staff), under the header's campus row.
2. **Search field** "Search dishes or cafes", full width. It searches item names, descriptions, categories and cafe names across all five places. Results are grouped by cafe, each row tappable: the name opens that item on its cafe's menu (it scrolls to the item and highlights it), the round + adds it from here. A closed or unavailable item shows its reason ("Opens at 12:00", "Breakfast, until 11:00", "Not today") and a disabled +.
3. **Directly under the search field**, only when they apply: the service banner (Admin switched the service off), the low-balance banner (₹50–99) or the blocking one (under ₹50, "Top up to order"), and the closed notice. (only while a place is closed or paused, and only until it is dismissed): a small banner with one line for each such place, three at most, in menu order: "Global Bistro opens at 12:00.", "Truly Indian is not taking orders right now." (paused), "Cafe Delice is closed today (Diwali).", "Greens and Grains has closed for today." A round close button dismisses it for the rest of the browser session. It follows the live hours, so a line goes when that place opens. It stays quiet while the whole service is off (the service banner says so).
4. **Order progress card** (only if you have an order in progress): the order that is due first. Source and order ID; four equal segments with 4 px gaps (sand track, maroon fill) with a small label under each; one line below ("On the way to GICT ground floor lobby · by 18:38"). Delivery: Placed, Preparing, On the way, Delivered. Pickup and vending: Placed, Preparing, Ready at counter, Collected. A segment is full once its stage is reached. Preparing fills with the time since the cafe accepted over the prep time, On the way with the time since pickup over the walk, each stopping at 90% until the status really changes: the line never runs ahead of what has happened. A small walking figure sits at the end of the fill and bobs 2 px every 600 ms (still with reduced motion). A delivery that is ready but has no runner yet shows Preparing full and On the way empty. With two or more orders, a "+1 more" link goes to Orders. Tap the card for Order Detail.
5. **Cafes at UC** with the subtitle "Order your favourite meal": a 2-column grid of square tiles, each in its source colour with a small icon (CookingPot, Hamburger, Coffee, Leaf) and the cafe's name set in cream as our own wordmark. The UC Vending Machine spans the full width at the bottom (Storefront icon, a 2:1 tile). Under each tile: the name, then one status line with a dot: "Open now · Ready in about 10 min" (olive; "Ready now" for the vending machine), "Opens at 12:00" (amber), "Closed today", "Closed today (Diwali)" or "Closed for today" (brick), "Paused" (brick). The words follow the live hours; the estimate comes from `/api/status` every 15 seconds, and not while the tab is hidden. See BUSINESS_RULES.md "Ready estimate". A closed tile still opens its menu.
6. **Next break** strip: "Next break 11:50 · order by 11:38 for GICT" based on breaks and the user's default building.
7. **Popular at UC**: horizontal row of arch-topped item cards (bestseller tag), each with price and a round "+" button.

### Source (menu) `/s/[sourceId]`
The four cafes (the vending machine is below). The header has the Back arrow and the cafe's name, then a card in the cafe's colour with its tagline and one line: "Open 12:00–19:00 · Ready in about 10 min", or why it is not taking orders ("Global Bistro opens at 12:00.", "Cafe Delice is closed today (Diwali).", "... is not taking orders right now."). Then a search field "Search in <cafe>" (names, descriptions and categories of that cafe's items), and **sticky horizontal category tabs** in the order the categories appear in `data/menu.ts`, with a 3 px maroon underline on the open one and **Unavailable** last, only when something is unavailable. Tapping a tab scrolls to that section; scrolling the page moves the underline. A category with nothing available has no tab.

Each section has its heading and one card for each item. **Left:** a veg mark (olive square outline with an olive dot; every item at UC is vegetarian), the name (600), a one-line description in mocha, the price (700), and a small "Prep 6 min" badge (sand, with a timer icon). **Right:** a 96 px picture with a 16 px corner (the item's photo if the team added one, otherwise its initials), with an outlined **Add** button overlapping its bottom edge; once added it becomes a − 1 + stepper. The tap area of both is 44 px. Sticky cart bar at the bottom when the cart is not empty: "3 items · ₹210 · View cart".

**Unavailable** holds what is switched off for the day ("Not today"), outside its own time window ("Breakfast, until 11:00", "From 12:00") or sold out. Those cards are in taupe, each with its reason in a chip, and Add is off. When the whole cafe is closed or paused its items stay in their categories so the menu can still be read, with Add off.

**When the place is closed or paused** a small bottom sheet opens on arrival with a title ("Global Bistro is not open yet", "Cafe Delice is closed today", "Truly Indian has closed for today", "Cafe Delice is paused"), the reason ("Global Bistro opens at 12:00.", "Cafe Delice is closed today (Diwali)."), when it opens next ("Opens tomorrow at 08:00.", "Opens Monday at 08:00." a pause has no time, so it says "Check back in a little while.") and **Browse the menu**. After that the menu can still be read, with the same reason in a line above the list and every Add button disabled. If the place opens while the sheet is up, it goes on the next refresh. Sticky cart bar at the bottom when cart is not empty: "3 items · ₹210 · View cart".

### Vending `/s/vending`
Looks like the machine: a parchment panel with three shelves (A, B, C), three cells to a row, each cell showing slot code, item name, price, stock ("4 left" / "Sold out"), refreshed every few seconds. Tap to add one; a count badge shows how many are in the cart, and quantities are changed in the cart. Same sticky cart bar. A line at the top: "Pay here, then enter your code at the machine, or get it delivered." Under it, **Drinks** and **Snacks** tabs (shelves A and B, shelf C) that scroll to their shelves, with the same underline.

### Cart `/cart`
Items with steppers and remove, source name, "Add more items" pill, subtotal. "Checkout" button. An item that has become unavailable since it was added (switched off, its place closed or paused, outside its time window, sold out) stays in the cart, is flagged in red with the reason ("Kanda Poha is breakfast only, until 11:00."), and Checkout is disabled ("Fix the items marked below to continue.") until it is removed.

### Checkout `/checkout`
Mode toggle (Pick up at UC / Deliver to my building). Building list (6 rows: short name, drop point, walk time, fee). When: "As soon as possible" or slot chips. A chip is disabled when it is too late, when the place is closed at that time ("Closed") or when an item in the cart is outside its window then ("Not then"), with the reason in plain words underneath. Bill: subtotal, delivery fee, total. Wallet: balance now and after. Promised time estimate. Big pill button "Pay ₹235 from wallet". Disabled reasons shown in plain words.

### Order Detail `/o/[orderId]`
**Pickup and vending pickup** (while the order is not finished): an info strip on sand at the top with a Phosphor `Lightbulb`, "Show this screen to collect your order". Under it one card: the order ID (700) with a status badge on the right (Placed and Preparing amber, Ready olive, Collected olive; Cancelled, Rejected and Failed late brick), the cafe name with its icon, then a **QR code** 220 px wide, espresso on cream with its quiet zone kept, and under it the four code boxes and "Show this code at the counter" (or "... at the vending machine"). The QR holds `QX:COLLECT:<orderId>:<code>` (FLOWS.md "Collect QR"); it is drawn on the server and sent only in the buyer's own order reply. Once the order is collected or ended the strip and the QR go and the card keeps the ID, badge and cafe.

**Delivery orders** have no QR: the top shows the source, order ID and status headline, and the code box keeps "Show this code to your runner".

Both then show: status headline ("Out for delivery to GICT"). **Vertical stepper** (Placed, Accepted, Preparing, Ready, Picked up, Delivered, or the pickup variant) with times. Large code box (4 digits) with the instruction line. Holder line ("Runner buddy: Aarav" / "QuickX staff"). Promised time with countdown; amber "Due now" when due, red when failed. While the holder has tapped "I'm here" and the order is `PICKED_UP`: a line "Runner is waiting at <drop point>" above the code. A `NO_SHOW` order reads "You missed your runner at <building>" with the instruction "Collect QX-4821 at the <source> counter with your code", keeps the code box and shows "Hold until HH:MM" while the buyer can still collect (`PICKUP_STALE_MIN`). Items and bill. Cancel button only while `PLACED`.

### Discover
List of five rows, each opening a simple content page: **Introduction** (what QuickX is, 3 short paragraphs with one illustration), **Help** (how to order, how pickup works, how delivery works), **Smart Vending** (how paying for the vending machine works, with a button "Open vending" → `/s/vending`), **Feedback** (textarea + 1–5 face rating, saved to Redis, thank-you state), **FAQ** (accordion: fees, wallet minimum, what happens if late, how runners earn, refunds).

### Orders
A search field "Search dishes or cafes" at the top filters the orders already loaded (dish names, cafe name, order ID). Under it **Active (N)** and **Past (N)** tabs, text only, the open one maroon 700 with a 3 px maroon underline.

Active has two groups when relevant: "My runs" first, then "My orders". Run cards (students and staff, including orders given to staff with "Send with staff") show building, drop point, buyer first name, a countdown to the promised time (amber "Due now" once it passes), an **I'm here** button (becomes "Arrived" after it is tapped) and an **Enter code** button. My runs is hidden while searching.

**Order card** (both tabs, receipt style, the whole top part opens Order Detail): "University Centre (UC)" small in mocha with the status badge on the right (Delivered and Collected olive; Cancelled, Rejected and Failed late brick; Missed delivery amber; every status still in progress amber). Then the cafe name (700). A two-column row, "Ordered on" with the day and time on the left and "Order ID" on the right. The item lines ("1 × Aloo Paratha with curd") with the total on the right. One mode line: "Delivered to GICT" ("Delivery to GICT" while in progress), "Pickup at counter" or "Pickup at the vending machine".

On **Past** cards two buttons: **Share feedback** (outlined) opens the feedback sheet (faces and text, saved with this order ID) and **Order again** (filled maroon) puts the same items back in the cart if they can be ordered now and opens the cart. Items that cannot be ordered now are skipped, with a toast naming them ("Not added, not available right now: Kanda Poha."). If the cart holds another cafe's items, a sheet asks "Start a new cart from <cafe>?" first. The buttons sit side by side and stack on a narrow phone.

After the list: "You've reached the end of recent orders. Older ones are in Account › Order History." Empty states: Active "No orders in progress. Pick something from UC.", Past "No past orders yet. Finished orders show up here." (both with Browse the menu), and a search with no match "No orders match that. Try a dish, a cafe or an order ID." with Clear search.

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

**Ready to deliver (N)** below the camera (and below the typed-ID form): every delivery bag that is ready at UC with nobody carrying it, except your own orders, grouped by building ("GICT · Ground floor lobby"), near zone first, oldest first inside each group. Each row: the source name, "1 item · ready 4 min" ("ready just now" under a minute), and on the right the earning for that zone (₹5 or ₹8) or "Staff delivery" for staff. No buyer name, no code, no order ID. Rows are read-only: tapping one only shows "Scan this bag at the <source> counter to take it." There is no accept button; a bag is taken only by scanning it at the counter. A student under ₹50 sees "Top up to at least ₹50 to run." at the top of the list. With nothing waiting: "No bags are waiting for a runner right now." Read every 10 seconds, not while the tab is hidden.

---

## Cafe portal (laptop, 1280 px) `/cafe`

The Cafe desk is a **POS / kitchen display** (v1.0.0 Phase C1). Laptop-first at 1280 px, usable at 1024 px. Every touch target is at least 48 px.

**Sidebar** (fixed, `parchment`, 220 px wide from 1280 px, a 72 px icon rail from 1024 to 1279 px): the QuickX mark and "UC Cafe Desk" at the top; the pages as 48 px rows with a Phosphor icon and label (the open one filled maroon with cream text): **Queue** (with a sun count of new orders), **Vending**, **Hours and items**, **Today** and **Kiosk** (opens `/cafe/kiosk` full screen). At the bottom: the sound switch with "Click once to allow sound." until the browser allows it (on the rail, a small sun dot), **Log out**, and the version line (wide sidebar only).

**Top bar** (`parchment`), two rows. First: the page title, and one compact **Open / Paused switch per place**, each with the place's colour dot and short name (Truly, Bistro, Delice, Greens, Vending) and "Paused" in brick while paused. They are the same switches as Hours and items and take effect at once. Second: live **count chips** for New, Preparing, Ready, Out for delivery and Alerts (Alerts turns brick when there is one); each is a link to that column (or the alert bar) on the Queue. Then a large clock (HH:MM, the server's time) and the primary **Scan buyer QR** button.

**Source filter** (on the Queue, under the top bar): a segmented control, All, Truly Indian, Global Bistro, Cafe Delice, Greens and Grains, Vending, each with how many of its orders are on the queue. It also narrows the top bar's counts.

### Queue (default)
Four columns, **New**, **Preparing**, **Ready**, **Out for delivery**, filling the height of the window, each scrolling on its own, with its ticket count in the header (on a portrait tablet, under 1024 px, two by two). Alerts sit above them as one brick bar (see Alerts).

Each order is a **kitchen ticket** on cream:
- A header strip in the place's colour with cream text: the order ID large (24 px, 800) and the time it was placed ("18:21"); under it the place and its age, live ("4 min", "just now").
- A mode badge: "Pickup", or the building and drop point ("GICT · Ground floor lobby"). "Accepted" while it waits for Start preparing; a brick "Waiting" badge on a New ticket left too long.
- The item lines large (18 px, 600), "2 × Cold Coffee", with thin dotted lines between them.
- When (ASAP or "Break 11:50"), the promised time with a live countdown ("Due now" once it is reached), and on Out for delivery who carries it ("Aarav · Runner buddy") and "Runner at GICT" once they tapped I'm here.
- A printer button (prints the kitchen slip at once).
- One big action (56 px, full width), and sometimes a smaller one under it: **Accept** on New (vending: **Accept and ready**), with **Reject** small (reason picker); **Mark ready** on Preparing, with **Start preparing** small while it is only Accepted (Mark ready on an Accepted ticket starts it first); on a Ready delivery **Show slip**, with **Send with staff** small; on a Ready counter pickup **Collect** (opens Scan buyer QR for that order, with the 4-digit fallback); a Ready vending pickup says "Collect at the kiosk".
- **Age outlines**, all the way round, never a stripe: a New ticket gets a 2 px amber outline after `NEW_AMBER_MIN` (2) minutes and a 3 px brick outline with "Waiting" after `NEW_RED_MIN` (5); a delivery gets amber from `DUE_SOON_MIN` (2) minutes before its promised time and brick from the promised time until grace ends; a Ready delivery with no runner for 3 minutes keeps its amber "No runner yet, send with staff?". Pickups get no time outline (they never fail by themselves).
- A new order is highlighted in blush for 5 seconds with a soft chime (unless the sound is off).

### Scan buyer QR (dialog)
Opened from the top bar (any counter pickup) or from a pickup ticket's Collect (that order). Left, the camera (`QrScanner`) reading the buyer's QR, `QX:COLLECT:<orderId>:<code>`; right, **Type the code instead** with the four boxes and **Collect** (from the top bar the code alone collects the oldest Ready counter pickup with it). The answer is shown big: a green tick, "Collected", the order ID and its items; or one refusal: "Wrong code", "Not ready yet", "Already collected", "Collect this at the vending kiosk", "Order not found" (and "Too many wrong codes. Try again in a minute." after 5 wrong codes). **Scan the next one** and **Close**. Without a camera it says so and the code field is all there is.

### Alerts (one bar above the four columns)
One brick bar with cream text, a row per alert, each with its action. Each stays until a staff member acts on it.
- **Failed:** "Failed late · QX-4821 failed late: <why>. ₹X refunded." with **Seen**.
- **Staff returning:** "Staff returning QX-4821 to <source>" with **Returned** (the bag is back at the counter).
- **No-show:** "Buyer did not collect QX-4821, keep at counter", the hold time (`PICKUP_STALE_MIN`) with a countdown and the 4-digit **Collect** input for the buyer's code. When the hold ends the row says so and shows **Seen**.

### Kitchen slip (Show slip, and the printer button)
One layout on screen and on paper: "QuickX · UC", the order ID large, the place, "Placed 12:21", "Deliver to GICT · Ground floor lobby" or "PICKUP", the item lines with large quantities, when and "Promised by 12:39", and for a delivery the bag QR (`QX:ORDER:<id>`) with "Runners scan this to take the bag." A pickup slip has no QR. No slip ever shows the buyer's code. **Print** (and every ticket's printer button) uses the browser's print dialog with a print stylesheet for 80 mm thermal paper: 72 mm printable, one colour, no backgrounds, only the slip.

### Vending
The stock as the machine's slot grid, a row per shelf (A, B, C): each slot shows its code large, the item and price, "7 left" or "Sold out", and 48 px − and + buttons. **Refill all** and **Open the kiosk** at the top.

### Kiosk `/cafe/kiosk`
Full-screen machine face for the laptop beside the vending machine (the one dark screen): "Enter your QuickX code" with a numeric keypad, then a dispensing state that highlights each slot being released, then "Collect below". Wrong code: "Code not found or already used." **Scan QR** next to the keypad opens the camera for the buyer's collect QR (vending pickups only; a counter pickup is told "Collect this at the Cafe Delice counter."), with **Use the keypad** to go back.

### Hours and items `/cafe/hours`
In the POS shell the place cards sit two by two from 1280 px. One page for when each place takes orders and which items can be ordered. A save confirms in words at the top ("Truly Indian: hours saved.") and reaches students on their next poll, a few seconds. Orders already placed are never touched. (The old `/cafe/menu` address redirects here.) If Admin has switched the whole service off, a warning at the top says so.
1. **Places.** One card per place (all five, including the vending machine): what students see right now ("Right now: Open now"), a **Taking orders / Paused** switch (applies at once, confirms in words), **Opens** and **Closes** times, **Open days** as Mon to Sun toggles, and **Save hours**. Times are on 5-minute steps and closing must be after opening; at least one day must stay on. A wrong value is refused with a sentence and nothing is sent. "Not saved yet" shows while a card has edits.
2. **Holidays.** Add a date and a short note ("Diwali"); the list is sorted earliest first, shows the date in words, and each row has Remove. On a holiday every place is closed.
3. **Items.** Chips pick the place. Each item row shows its price, its current window ("Breakfast, until 11:00 · Default", "No time limit · Default", "… · Changed"), **Available from** and **Available until** times (leave one or both empty for no limit), **Save times**, **Back to default** (when it differs from the default) and the **Available today** switch (moved here from the old Menu page). Until must be after from. Clearing both times on an item that has a default window means "no limit"; Back to default restores the default.

### Today
Five large number tiles on top: orders placed, delivered, collected, failed late, revenue. Then **Revenue by source** (finished orders and revenue per place, with the total) and **Everything else today** (in progress, missed deliveries, cancelled or rejected, refunds, delivery fees kept) side by side. No charts.

---

## Admin portal (laptop) `/admin`

Header: "QuickX Admin", links **Codes**, **Staff**, **Users**, **Live orders** and **Service** (the open page uses the selected chip colours), Logout.

1. **Codes:** permanent codes (masked, reveal, copy). Temporary pool table: code, status (unused / active with time left / burned / revoked), used by, used at. Buttons: Copy, Revoke (unused), End session (active), Generate now (refill). A large "show code" mode to display one unused code in big type for someone to type in.
2. **Staff** (`/admin/staff`): "Add staff" takes a first name and creates the next ID (`QX-STF-01`, `QX-STF-02`, …), shown clearly with a Copy button and a line saying how they sign in. Below it, the list of staff (ID, name, Copy). Empty state: Phosphor icon in a sand circle, "No staff yet. Add the first person above."
3. **Users and wallets:** search by AU/staff ID, see balance and ledger, "Adjust" (+/− amount with a required note).
4. **Live orders** (`/admin/orders`, pulled forward from Phase 10): every active order, refreshed every 5 s. Each row: the order ID in large type, source, status, mode, building and drop point (delivery), holder name and kind (runner buddy or staff), promised time with a countdown (amber when due), and when the holder tapped "I'm here". Each row has **Copy order ID** and **Reveal code**. Reveal code shows that one order's 4-digit code (it is fetched on tap, only with an admin session, checked on the server, and is never part of the list reply); tap again to hide. Reveal code is a demo tool.
5. **Service** (`/admin/service`): the only place the whole service is switched. A **QuickX is available** switch, the **message** students read while it is off (up to 140 characters, default "QuickX is not taking orders right now."), **Save message**, and a preview of the banner students will see. Switching it off asks first ("Turn the service off? Nobody can place a new order until you turn it back on. Orders already placed carry on."); switching it on, or changing the message, does not. While it is off every student screen shows the banner, every place reads "Not available" and the server refuses all new orders. Active orders are not touched.
6. **Demo tools:** "Seed demo data" (creates users AU2340101 Riya ₹300, AU2340102 Aarav ₹120, AU2340103 Meera ₹300, staff QX-STF-01 Ramesh, and 2 past delivered orders), "Create late-test order" (picks a buyer and a runner, creates a delivery order already `PICKED_UP` by that runner with the promised time 1 minute from now, so the grace runs out about 6 minutes later on stage), "Reset all data" (orders, wallets, users, updates, stock; keeps codes and staff unless ticked) with typed confirmation `RESET`.
