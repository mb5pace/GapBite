# ACCESS GUIDE

How to get into every part of QuickX on the deployed site. It holds no secret values, only the names of the settings that hold them.

Production site: **https://quickx-gapbite.vercel.app**

## 1. Every page and its link

| What | Link | Who can open it |
|---|---|---|
| Gate (type a code) | https://quickx-gapbite.vercel.app/ | anyone |
| Identify (who is ordering) | https://quickx-gapbite.vercel.app/identify | after a student code |
| Student Home | https://quickx-gapbite.vercel.app/home | a student or staff session that has identified |
| Cafe queue | https://quickx-gapbite.vercel.app/cafe | cafe session |
| Cafe vending stock | https://quickx-gapbite.vercel.app/cafe/vending | cafe session |
| Cafe kiosk (full screen) | https://quickx-gapbite.vercel.app/cafe/kiosk | cafe session |
| Cafe menu availability | https://quickx-gapbite.vercel.app/cafe/menu | cafe session |
| Cafe today totals | https://quickx-gapbite.vercel.app/cafe/today | cafe session |
| Admin codes | https://quickx-gapbite.vercel.app/admin | admin session |
| Admin staff | https://quickx-gapbite.vercel.app/admin/staff | admin session |
| Admin users and wallets | https://quickx-gapbite.vercel.app/admin/users | admin session |
| Admin live orders (every order in progress, refreshed every 5 seconds, Copy order ID, Reveal code) | https://quickx-gapbite.vercel.app/admin/orders | admin session |
| UI kit (every component) | https://quickx-gapbite.vercel.app/kit | admin session |
| Health check | https://quickx-gapbite.vercel.app/api/health | anyone (shows `"ok":true` when the database answers) |

Every page except the gate sends you back to the gate with "Your session has ended. Ask for a new code." if you have no session, or a session for a different portal. A student cannot open the cafe or admin pages, and the reverse.

## 2. What to type at the gate

There is one box on the gate. What you type decides which portal opens. The box hides what you type; the eye button shows it.

| Portal | Type this | Session lasts |
|---|---|---|
| **Student** (Home, ordering) | One of the five codes in the Vercel setting **QX_PERMANENT_CODES** (a list separated by commas). It works on any number of devices at once. | **8 hours** |
| **Student, with a temporary code** | A code from Admin › Codes (6 characters, shown like `K7Q-M2X`, typed without the dash, any case). It works **once**. | **15 minutes** from the moment it is used |
| **Cafe** (queue, vending, menu, today, kiosk) | The value of **QX_CAFE_PASSWORD** | **12 hours** |
| **Admin** (codes, staff, users, kit) | The value of **QX_ADMIN_PASSWORD** | **2 hours** |

Notes:
- After a student code, QuickX asks who is ordering: an AU number like `AU2340101` (the first time also a first name), or "I'm QuickX staff" and a staff ID.
- Do not use the example code `K7Q-M2X` from the gate screen as a real code.
- 30 wrong tries from one network in 10 minutes locks the gate for a few minutes. A correct code never counts as a wrong try. Phones on the campus Wi-Fi share one network, which is why the limit is generous.
- When a session ends you are sent to the gate. Orders already placed carry on and are still there when you come back with the same AU number.

**Where to find the values.** Vercel dashboard › the project › Settings › Environment Variables. Click the value to show it. If a variable is marked Sensitive, Vercel never shows it again: edit it, type a new value, save, and redeploy. Never paste these into chat, a ticket or the repository.

**One session per browser.** The session is a cookie named `qx_session`. Logging in as Admin in the same browser replaces the Cafe session. Use a different browser for each portal (for example Chrome for the Cafe desk, a private window or Firefox for Admin).

## 3. Create a delivery staff ID and log in with it on a phone

Staff IDs look like `QX-STF-01`, then `-02` and so on up to `-99`. They cannot be deleted.

On the laptop:
1. Open https://quickx-gapbite.vercel.app/ and type the value of **QX_ADMIN_PASSWORD**. You land on Admin › Codes.
2. Click **Staff** in the header (https://quickx-gapbite.vercel.app/admin/staff).
3. Under "Staff member's first name" type the name, 2 to 20 letters (for example `Ramesh`), and click **Add staff**.
4. "Staff ID created" shows the new ID, for example `QX-STF-01`. Click **Copy** or read it out. The ID also stays in the "Staff accounts" list.

On the phone:
1. Open https://quickx-gapbite.vercel.app/ and type one of the codes from **QX_PERMANENT_CODES** (or a temporary code from Admin › Codes).
2. On "Who's ordering?" tap **I'm QuickX staff**.
3. Type the staff ID in "Your staff ID" (`QX-STF-01`) and tap **Continue**.
4. You land on Home with a **Staff** badge next to your name. Staff have a wallet like everyone else, and show up in the **Send with staff** list on the Cafe desk.

Staff carry deliveries in two ways. The Cafe desk can give a bag to them (**Send with staff**), or they can scan a bag themselves with **Scan a bag** and tap **Accept as staff delivery**. Either way the order shows under **Orders › My runs** on their phone, where they tap **I'm here** and **Enter code**. Staff deliveries earn nothing, and staff are not held to the ₹50 balance or the 3-run limit.

## 4. Hand a temporary code to someone else

1. On the laptop, log in as Admin and open Admin › Codes. The pool always holds 6 unused codes.
2. Either click **Show a code** (or **Show big** on a row) to put one on the whole screen for them to read and type, or click **Copy** on a row and send it.
3. They open the gate on their own phone, type the code, then give their AU number (and first name the first time).
4. The moment it is used the code is burned: it cannot be used again on any device, their session lasts 15 minutes, and a new unused code appears in the pool.
5. Changed your mind or sent it to the wrong person: click **Revoke** on an unused code. To cut off a session that is running, click **End session** on that row.

A code nobody uses never expires. For a team phone that should stay logged in all day, use a permanent code instead.

## 5. Five-minute test: a runner delivery, a staff delivery and a late order

You need: the laptop with the Cafe desk (Chrome, logged in with **QX_CAFE_PASSWORD**), a second browser or tab logged in as Admin on **Admin › Live orders** (https://quickx-gapbite.vercel.app/admin/orders), **two phones** (one is the buyer, one is the runner buddy; a laptop browser works as a stand-in), a staff ID (section 3) and the codes from section 2. Orders and wallet money you create stay in the database; there is no reset button until Phase 10.

**Before you start (once, 1 minute).**
- Laptop, Chrome: click once anywhere on the Cafe page so the browser allows the new-order sound. The sound switch says "Sound on".
- Buyer phone: open the gate, type a code from **QX_PERMANENT_CODES**, give your AU number and first name. Tap the ₹ amount at the top, tap **Top up**, pick ₹500, tap **Pay ₹500 with UPI** (a mock step, about 2 seconds, no real money).
- Runner phone: a different code and a different AU number. Top up ₹500 too (a runner needs at least ₹50 in the wallet to take a bag).
- Start the **late order first** (below, steps L1 to L3), because it needs a few minutes to run out. Do the two deliveries while it waits.

**A. Student runner delivery (about 2 minutes).**
1. Buyer phone: Home › **Global Bistro** › **+** on Veg Burger › **View cart** › **Checkout** › **Deliver to my building** › **GICT** › **As soon as possible** › **Pay ₹75 from wallet**. Keep the order page open: it shows a 4-digit code, "Show this code to your runner".
2. Laptop: **Accept**, **Start preparing**, **Mark ready**. The bag slip opens with a QR code. Close it. The card sits under **Ready**. (After 3 minutes with nobody taking it the card turns amber: "No runner yet, send with staff?")
3. Runner phone: Home › **Scan a bag**. Point the camera at the QR on the laptop, or tap **Type order ID instead**, type the order ID (for example `QX-4821`) and tap **Look up**. The preview says "Deliver to GICT, ground floor lobby", "Deliver by HH:MM" and "You earn ₹5". Tap **Accept run**.
4. Buyer phone: "Out for delivery to GICT", "Runner buddy: <name>". Laptop: the card moves to **Out for delivery**: "Carried by <name> · Runner buddy".
5. Runner phone: Orders tab › **My runs**. Tap **I'm here**. The buyer phone now says "Runner is waiting at ground floor lobby" and Updates says "Your runner is at GICT ground floor lobby. Show your code."
6. Runner phone: tap **Enter code**, type the buyer's 4 digits, tap **Confirm delivery**. A wrong code says "Code does not match" and lets you try again. The right code says "Delivered. ₹5 added to your wallet."
7. Check: the buyer's order is Delivered and in **Past**. The runner's wallet went up ₹5. The laptop card is gone from the queue. Admin › Live orders no longer lists it.

**B. Staff delivery (about 1.5 minutes).**
1. Buyer phone: order a Veg Burger to GICT again (same steps as A1). Laptop: **Accept**, **Start preparing**, **Mark ready**, close the bag slip.
2. Laptop: on the Ready card click **Send with staff** and pick the staff ID you made (`QX-STF-01 · Ramesh`). The card moves to **Out for delivery**: "Carried by Ramesh · QuickX staff".
3. Staff phone (log in with the staff ID, section 3): Orders tab › **My runs** shows the order with the building, drop point, the buyer's first name and a countdown. Tap **I'm here**, then **Enter code**, type the buyer's 4 digits, **Confirm delivery**. It says "Delivered." and no money is added.
4. Check: the buyer's order is Delivered, the card leaves the laptop queue, and nobody's wallet changed except the buyer's (₹75 paid).

**L. A late order (start it first; the failure comes about 12 minutes after you press Accept).**
1. Buyer phone: order a Veg Burger to GICT. Laptop: **Accept**, **Start preparing**, **Mark ready**. Note the **Promised** time on the card (about 7 minutes after you accepted it).
2. Runner phone: **Scan a bag**, type the order ID, **Accept run**. Then do **not** tap I'm here and do not enter the code.
3. Go and do A and B. At the promised time the order turns amber **Due now** in four places: the runner's My runs card, the laptop's Out for delivery card, the buyer's order page and Admin › Live orders.
4. Five minutes after the promised time the order fails by itself (no button, the next screen refresh settles it):
   - Laptop: a red card **Failed late**: "QX-… failed late: <runner> did not deliver it in time. ₹75 refunded." Click **Seen** to clear it.
   - Buyer phone: "Could not reach GICT in time", ₹75 back in the wallet, and an Update "Your order could not reach GICT in time. ₹75 has been refunded to your wallet."
   - Runner phone: ₹75 comes out of the wallet (it can go below zero, and then the runner must top up to ₹50 before taking another bag). Update: "Run QX-… was not delivered in time. ₹75 has been deducted from your wallet. The food is yours to keep."
5. Variations, if you have a few more minutes:
   - **Staff late:** do L1, then on the laptop **Send with staff** instead of step 2 and wait. The buyer is refunded, no wallet is debited, and the laptop shows a red **Staff returning QX-… to Global Bistro** card. Click **Returned** when the bag is back.
   - **Buyer no-show:** do L1 and L2, then on the runner phone tap **I'm here** before the promised time. Do not enter the code. When grace ends the laptop shows an amber **No-show** card: "Buyer did not collect QX-…, keep at counter", with a 30-minute hold and four boxes. The runner still earns ₹5, the buyer is not refunded, and the buyer's page says "You missed your runner at GICT. Collect QX-… at the Global Bistro counter with your code." Type the buyer's code into the four boxes and click **Collect** to hand the bag over.
   - **Never picked up:** accept an order on the laptop and then leave it. It fails with "nobody picked it up in time" and the buyer is refunded in full.

**Admin › Live orders** shows every one of these while it happens: the order ID in large type, its status, who carries it, the promised time with a countdown (amber when due) and when the runner tapped "I'm here". **Copy order ID** puts the ID on the clipboard, which is handy for typing it into the runner phone. **Reveal code** shows that one order's 4-digit code to the admin session only. That is a demo tool so you can finish a delivery without the buyer's phone in your hand; it is never part of the list the browser downloads.

**Check the numbers (30 seconds).**
- Laptop: click **Today**. It counts orders placed, finished, failed late and missed deliveries (no-shows), and the revenue (food only, for orders that finished; a no-show counts, because the buyer is not refunded).
- Each phone: tap the ₹ amount at the top. The Wallet page lists every top-up, payment, refund, earning and penalty, newest first.

**Extras if you have time.**
- Pickup: Home › **Cafe Delice** › **+** on Cold Coffee › **Checkout** › **Pick up at UC**. On the laptop **Accept**, **Start preparing**, **Mark ready**, then type the buyer's 4-digit code into the four boxes on the Ready card and click **Collect**. A wrong code says "Code does not match."
- Cancel: place any order and tap **Cancel order** on the phone before the laptop accepts it. The money comes back and the page says so.
- Reject: place one, and on the laptop click **Reject**, pick a reason. The phone shows the reason and the refund.
- Vending: on the phone order a Paper Boat from **UC Vending Machine** (pick up), on the laptop click **Accept and ready**, then open **Vending › Open the kiosk**, type the phone's 4-digit code on the keypad and watch the slot light up.
- Menu: Menu › Cafe Delice › switch **Tea** off. The phone can no longer add it.
