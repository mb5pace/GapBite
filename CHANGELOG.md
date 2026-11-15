# Changelog

Everything that changes in QuickX is written here, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the version numbers follow `docs/RELEASING.md`. Entries say what a student, the cafe desk or the team can now do, not which files changed.

## [Unreleased]

### Added
- **Home, redesigned.** The header shows the campus (a map pin, "Ahmedabad University", "University Centre (UC)") with Scan and your wallet on the right, then "Good evening, <name>" and a full-width search "Search dishes or cafes". Search covers dish names, descriptions, categories and cafe names across all five places; results are grouped by cafe, tapping one opens that dish on its menu, and a closed or unavailable dish says why. The service banner, wallet banners and closed-cafe notice sit right under the search.
- **Cafes at UC.** A grid of square tiles, each in its cafe's own colour with an icon and the name as lettering, and the vending machine across the bottom. Under each: the name and one line, such as "Open now · Ready in about 10 min", "Opens at 12:00", "Closed today (Diwali)" or "Paused". The "ready in" time counts the cafe's usual prep time plus 2 minutes for each order it is already making (rounded up to 5, at most 30) and refreshes every 15 seconds while the app is open.
- **Order progress on Home.** Your order in progress shows as four steps (Placed, Preparing, On the way, Delivered; or Ready at counter and Collected for pickup) with a little walker at the end of the fill. It only moves as the order really does: Preparing and On the way fill with elapsed time but stop at 90% until the cafe or runner updates the order. With two orders it shows the one due first and "+1 more".
- **Menu pages, redesigned.** Each cafe's page opens with its hours and "Ready in about N min" (or why it is closed), a search inside the cafe, and sticky category tabs that follow your scrolling. Dishes are cards with a veg mark, price, prep time and a picture with an Add button over its edge. Anything switched off, outside its time or sold out sits under an "Unavailable" tab with its reason. The vending machine keeps its machine look, with Drinks and Snacks tabs.
- **Opening hours.** Every place now has opening and closing times and open days. Truly Indian, Cafe Delice, Greens and Grains and the vending machine take orders 08:00 to 19:00, Global Bistro 12:00 to 19:00, Monday to Saturday. An order outside those hours is refused with a plain sentence ("Global Bistro opens at 12:00."), and the server, not the phone, decides.
- **Item times.** An item can have its own available-from and available-until time. The six breakfast items (Thepla, Poha, Upma and the three parathas) are available until 11:00. Kanda Poha at 10:30 for as soon as possible goes through; for the 11:50 break, or at 11:05, it is refused.
- **Holidays.** The Cafe can add a date with a note ("Diwali"); every place is closed that day.
- **Cafe portal › Hours and items.** One page to set each place's hours and open days, switch a place between Taking orders and Paused, add and remove holidays, set an item's times, and switch an item off for the day. Changes reach students within a few seconds and never touch orders already placed. The old Menu page address still works and goes here.
- **Admin › Service.** Admin can switch the whole service off with a message. Students see the message on every screen and no new order can be placed anywhere; orders already placed carry on.
- **Students see what is closed.** Home tiles say Open now, Opens at 12:00, Closed today, Closed today (Diwali), Closed for today or Paused. A small notice on Home lists closed places (one line each, three at most) until it is dismissed. Opening a closed place shows a sheet with the reason and when it opens; the menu can still be read but Add is off. Items outside their time sit at the bottom of the menu under "Unavailable now", and a cart item that became unavailable is flagged until it is removed.
- **Loading view.** A cooking pot with three lines of steam and "Your food is on the stove…" while a page is loading, in the student app, the Cafe desk and Admin. The steam stands still if the phone is set to reduce motion.
- **Matar Paneer Paratha with curd** (₹60) in Truly Indian's breakfast.
- Every menu item now has a category, ready for the menu redesign.

### Changed
- On Home the Closed and Paused labels are now red, "Opens at 12:00" amber and "Open now" green.
- QuickX now uses one font, Plus Jakarta Sans, for everything. Only the QuickX logo on the gate keeps its chunky letters. Screens were checked at 360 px, and long page titles such as "Checkout" no longer break mid-word.
- Break slots in Checkout grey out ("Closed" or "Not then") when the place is shut or an item is outside its time then, and the Next break strip on Home skips them and says why when nothing is left.
- In the Cafe header, "Menu" is now "Hours and items".

### Removed
- The 11:30 "morning" rule and the "Morning only" label. Breakfast is now an ordinary item time that the Cafe can change.

## [0.9.0] - 2026-11-13

Account and Discover are built, and the dev preview now keeps its own data. Production keeps working exactly as before: its orders, wallets and staff IDs are untouched.

### Added
- **Account** is now a real page: your name, ID, a Staff badge if you are staff, and your wallet balance, then Wallet, My Profile, Preferences, Notifications, Order History, Refund Status, Terms and Conditions, Feedback, Support and Log out (it asks first).
- **My Profile**: change your first name.
- **Preferences**: choose a default building, pickup or delivery, and as soon as possible or next break. Checkout starts from them, and the Next break strip on Home counts from your default building (or says "for pickup").
- **Notifications**: three switches. Sounds plays a soft chime when a new Update arrives while QuickX is open (off until you turn it on). The other two say they are not connected yet.
- **Order History**: your finished orders and the deliveries you carried, with All, Orders and Runs, and what each run did to your wallet.
- **Refund Status**: every refund with why it happened and the total.
- **Terms and Conditions** and **Support**: what this prototype is, the credits, the UC help desk, and a place for the team's contact details.
- **Feedback**: pick a face from 1 to 5 and add a comment, from Account or Discover.
- **Discover**: Introduction, Help, Smart Vending (with a button into the machine) and a FAQ on fees, the wallet minimum, late and missed deliveries, runner earnings, refunds and the 4-digit code.

### Changed
- The dev preview now keeps its own orders, wallets, staff IDs and codes, separate from production, so testing on the dev link can never touch real data. Production is unchanged.
- `/api/health` now also says which environment it is (`production`, `preview` or `local`) and which key prefix it uses, so a deployment can be checked without logging in.

## [0.8.0] - 2026-11-13

First tagged version. It covers everything built in Phases 0 to 8: ordering from the four cafes and the vending machine, the cafe desk, runner buddies, and what happens when an order is late.

### Added

**Getting in**
- One box at the gate. A permanent campus code opens the student app for 8 hours, a one-time temporary code from Admin opens it for 15 minutes, the cafe password opens the Cafe desk for 12 hours and the admin password opens Admin for 2 hours. After too many wrong tries from one network the gate locks for a few minutes.
- Students say who is ordering with their AU number (and a first name the first time). QuickX staff use a staff ID. Admin can create staff IDs and hand out temporary codes.

**Ordering (student app)**
- Browse Truly Indian, Global Bistro, Cafe Delice, Greens and Grains and the UC vending machine, search the whole menu, see live vending stock, and see morning items only in the morning. Home shows the next class break and when to order by.
- A cart for one place at a time. Checkout lets you pick up at UC or have it delivered to one of the six buildings (the drop point, walk time and ₹5 fee are shown), as soon as possible or for a chosen break, and pay from your wallet.
- A wallet with a mock UPI top-up, a ₹50 minimum, a ledger of every payment, refund, earning and penalty, and banners when your balance is low.
- Follow each order on a step tracker with a 4-digit code to show at the counter or to your runner. Cancel until the cafe accepts it. An Updates feed with an unread dot says what happened and when. Cancelled, rejected and late orders are refunded in full.

**Cafe desk**
- A live queue (New, Preparing, Ready, Out for delivery) with a soft chime for new orders, source filters and a clock. Accept or reject with a reason, start preparing, mark ready, and print a bag slip with a QR code.
- Hand a pickup order over by typing the buyer's code. Give a delivery to a staff member with Send with staff.
- Vending stock counts, a full-screen kiosk where the buyer types their code, switches to turn menu items off for the day, and a Today page with orders, refunds and revenue.

**Runner buddies and staff deliveries**
- Any student with ₹50 in their wallet can scan a bag's QR code (or type the order ID), see what they will earn (₹5 nearby, ₹8 for the far buildings), and take it. Two people scanning the same bag at once never both get it. A student can carry up to 3 runs.
- On the run: tap I'm here at the drop point (the buyer sees "Runner is waiting"), then type the buyer's 4-digit code to hand over. The runner is paid on delivery.
- QuickX staff can deliver in the same way, from a scan or from Send with staff. They earn nothing and have no limit.

**When an order is late**
- Every delivery has a promised time and 5 minutes of grace. Past the promised time it turns amber ("Due now") for the buyer, the runner, the cafe and Admin.
- A late runner buddy: the buyer is refunded in full, the runner's wallet is charged the full amount (it can go below zero) and the runner keeps the food. Late staff or an order nobody picked up: the buyer is refunded and the cafe absorbs it.
- A buyer who never shows up after the runner arrived on time: the runner is still paid, the buyer is not refunded, and the bag is held at the counter for 30 minutes. The buyer can still collect it with the same code.
- The cafe sees red cards for failed orders and bags being brought back (Seen, Returned) and an amber card for a no-show (Collect). A bag with no runner for 3 minutes is highlighted.

**For the team**
- Admin pages for temporary codes, staff IDs, users and wallets, and Live orders: every order in progress, refreshed every 5 seconds, with Copy order ID and a Reveal code button for demos.
- A small version line ("QuickX v0.8.0 · abc1234") at the bottom of Account and in the Cafe and Admin headers, so everyone can tell which build they are on.
- A steps guide for testing a runner delivery, a staff delivery and a late order in about five minutes (`docs/ACCESS_GUIDE.md`).

### Changed
- The colours look the same on every phone and laptop, including phones set to dark mode or "darken websites".

[Unreleased]: https://github.com/mb5pace/GapBite/compare/v0.9.0...dev
[0.9.0]: https://github.com/mb5pace/GapBite/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/mb5pace/GapBite/releases/tag/v0.8.0
