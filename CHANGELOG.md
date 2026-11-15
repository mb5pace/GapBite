# Changelog

Everything that changes in QuickX is written here, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the version numbers follow `docs/RELEASING.md`. Entries say what a student, the cafe desk or the team can now do, not which files changed.

## [Unreleased]

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
