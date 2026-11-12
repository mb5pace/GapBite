# PRODUCT — QuickX

## One line

Order from any UC cafe or the vending machine in under a minute, and get it in your hands during a short break, either picked up at UC with a code or dropped at your building by a runner buddy or staff.

## The problem

Breaks between classes at Ahmedabad University are short. Walking from GICT, SAS, AMSOM, AG, BK or VentureStudio to the University Centre, queuing at a counter and walking back often takes longer than the break. Students skip food or come late to class. The vending machine needs cash or a card at the machine.

## The idea

All four UC cafes (Truly Indian, Global Bistro, Cafe Delice, Greens and Grains) and the UC vending machine on one ordering app with a prepaid QuickX wallet. Food is prepared before the student arrives. A student already walking from UC to a building can carry other people's orders there and earn money into their wallet. If no student picks it up, cafe staff deliver it. Every order has a promised time; if it is not delivered within 5 minutes of that, the system flags it, refunds the buyer and charges whoever was holding it.

## Three portals, one web app

1. **Student portal** (phone). Order, pay from wallet, track, collect or receive. The runner role lives inside it: a Scan button opens a popup that assigns a scanned bag to you, and later asks for the buyer's handover code. Staff use this same portal with a staff ID and a Staff badge.
2. **Cafe portal** (laptop at UC). One shared login for all five sources. Live order queue, status buttons, bag QR slips, late alerts, vending stock, and a vending kiosk screen that simulates the machine.
3. **Admin portal** (laptop, team only). Access codes, staff accounts, wallet adjustments, demo reset.

Everything sits behind an access code screen. No sign-up, no passwords for students; identity is the student's AU number.

## Users

Student buyer: in class until the break, wants food without losing the break. Runner buddy: a student already walking from UC to a building, happy to carry a few bags for wallet money. Cafe staff: run the counter, prepare, hand over bags, deliver when no runner takes it. Team admin (us): run the demo, hand out codes, reset data.

## What makes it QuickX and not a generic delivery app

Orders are tied to breaks and buildings, not addresses. Delivery is to a fixed drop point per building. Runners batch by building. A failed delivery is caught automatically with a 5-minute grace and a clear rule about who pays. The vending machine can be paid from the app with a collect code.

## In scope

Ordering from 5 sources, cart from one source at a time, pickup or delivery to 6 buildings, wallet with mock UPI top-up, runner scan-to-accept, handover codes, staff fallback, late detection and penalties, notifications feed, order history and refunds, cafe queue, vending stock and kiosk, admin code management, live sync across devices.

## Out of scope (do not build)

Real payments or UPI integration. Real login, OTP, email or SMS. Push notifications to the phone OS (in-app Updates feed only). Maps with live GPS. Ratings and reviews. Coupons and promo codes. Multiple cafes in one cart. Dark mode. Native app. Any feature not in SCREENS.md.

## Success for the presentation

Two or three phones and one laptop running the deployed link at once: a student orders on phone A, the order appears on the cafe laptop, staff mark it ready, a runner scans the bag on phone B, the buyer sees "picked up by runner buddy", the runner enters the handover code, both wallets update live. Then a second order is left undelivered and the panel watches it turn red, refund the buyer and charge the runner.
