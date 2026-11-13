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

Staff can carry a delivery from the Cafe desk today. Scanning a bag with the phone and entering the buyer's handover code come in Phase 7.

## 4. Hand a temporary code to someone else

1. On the laptop, log in as Admin and open Admin › Codes. The pool always holds 6 unused codes.
2. Either click **Show a code** (or **Show big** on a row) to put one on the whole screen for them to read and type, or click **Copy** on a row and send it.
3. They open the gate on their own phone, type the code, then give their AU number (and first name the first time).
4. The moment it is used the code is burned: it cannot be used again on any device, their session lasts 15 minutes, and a new unused code appears in the pool.
5. Changed your mind or sent it to the wrong person: click **Revoke** on an unused code. To cut off a session that is running, click **End session** on that row.

A code nobody uses never expires. For a team phone that should stay logged in all day, use a permanent code instead.

## 5. Five-minute test: one pickup order and one staff delivery order

You need: the laptop with the Cafe desk, one phone, a staff ID (section 3), and the codes from section 2. Orders and wallet money you create stay in the database; there is no reset button until Phase 10.

**Before you start (once).**
- Laptop, Chrome: open the gate, type **QX_CAFE_PASSWORD**, you land on the queue. Click once anywhere on the page so the browser allows the new-order sound. The sound switch in the header says "Sound on".
- Phone: open the gate, type a code from **QX_PERMANENT_CODES**, give your AU number and first name. Tap the ₹ amount at the top (it opens your Wallet), tap **Top up**, pick ₹500, tap **Pay ₹500 with UPI** (a mock step, about 2 seconds, no real money).

**Pickup order (about 2 minutes).**
1. Phone: Home › **Cafe Delice** › tap **+** on Cold Coffee and on Chilli Garlic Cheese Sandwich › **View cart** › **Checkout**.
2. Phone: choose **Pick up at UC**, **As soon as possible**, tap **Pay ₹180 from wallet**. You land on the order page: steps, a large 4-digit code ("Show this code at the counter") and the promised time.
3. Laptop: within 3 seconds the order appears under **New**, highlighted for 5 seconds, with a soft chime. Click **Accept**. It moves to **Preparing**.
4. Phone (updates every few seconds): "Cafe Delice accepted your order". Open the **Updates** tab to see the same words.
5. Laptop: **Start preparing**, then **Mark ready**. The **bag slip** opens with a QR code and "PICKUP". Click **Print** to see the print preview, then **Close**. The card is now under **Ready**.
6. Phone: "Ready at the Cafe Delice counter". Read the 4-digit code.
7. Laptop: type the code into the four boxes on the card and click **Collect**. (A wrong code says "Code does not match.")
8. Phone: "Collected. Enjoy!" The order moves to **Past** on the Orders tab.

**Staff delivery order (about 2 minutes).**
1. Phone: Home › **Global Bistro** › **+** on Veg Burger › **View cart** › **Checkout**.
2. Phone: choose **Deliver to my building**, **GICT** (drop point, walk time and the ₹5 fee are shown), **As soon as possible**, tap **Pay ₹75 from wallet**.
3. Laptop: **Accept**, **Start preparing**, **Mark ready**. The bag slip says "Deliver to GICT, ground floor lobby". Close it.
4. Laptop: on the Ready card click **Send with staff**, then pick the staff ID you made (`QX-STF-01 · Ramesh`). The card moves to **Out for delivery**: "Carried by Ramesh · QuickX staff".
5. Phone: "Out for delivery to GICT" and "QuickX staff"; Updates shows "Picked up by QuickX staff."

The delivery order stays at "Out for delivery". The step that marks it Delivered (the runner or staff member typing your handover code) is Phase 7.

**Check the numbers (30 seconds).**
- Laptop: click **Today**. Two orders placed, one collected, one in progress, Cafe Delice revenue ₹180 (the page counts every order since midnight, so earlier tests add to these numbers).
- Phone: tap the ₹ amount at the top. The Wallet page lists the top-up and both payments, newest first, and the balance after the pickup and delivery is ₹500 − ₹180 − ₹75 = ₹245.

**Extras if you have time.**
- Cancel: place any order and tap **Cancel order** on the phone before the laptop accepts it. The money comes back and the page says so.
- Reject: place one, and on the laptop click **Reject**, pick a reason. The phone shows the reason and the refund.
- Vending: on the phone order a Paper Boat from **UC Vending Machine** (pick up), on the laptop click **Accept and ready**, then open **Vending › Open the kiosk**, type the phone's 4-digit code on the keypad and watch the slot light up.
- Menu: Menu › Cafe Delice › switch **Tea** off. The phone can no longer add it.
