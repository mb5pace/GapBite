# DEMO SCRIPT (v1.0.0)

About 7 minutes. Devices: **Laptop** on the projector (Cafe portal; Admin in a second tab), **Phone A** buyer, **Phone B** runner. Both phones log in with permanent codes. Optional **Phone C** for a panel member with a temporary code.

## Before the presentation (5 minutes, off stage)
1. Laptop, Admin › Demo. Check the environment line says the one you mean to present on. On production it warns "This clears the live app."
2. **Reset all data** (type RESET, leave both boxes unticked so staff, hours and switches stay), then **Seed demo data**. Riya ₹300, Aarav ₹120, Meera ₹300, staff QX-STF-01 Ramesh, and two past delivered orders appear.
3. Admin › Service: QuickX is available. Cafe portal › Hours and items: Cafe Delice and Truly Indian taking orders.
4. Phone A: log in as `AU2340101` Riya. Phone B: log in as `AU2340102` Aarav. Add both to the home screen so they open full screen.
5. Laptop: Cafe portal › Queue open, sound on. Admin › Codes in the second tab with one unused temp code.
6. **About 7 minutes before step 7 below**, Admin › Demo › Late-test order: buyer Meera, runner Aarav. It is promised one minute later and fails when the 5-minute grace ends, so it settles on stage.

## Story

1. **Problem (20 s).** "A break is 10 minutes. UC to AMSOM and back, with a queue, does not fit."

2. **Home grid (40 s).** Phone A, Home. The Cafes at UC grid: each tile says Open now, Opens at HH:MM or Paused, and "Ready in about X min" from that cafe's own queue. Point at the past order under Orders › Past and its Order again button.

3. **Closed cafe and the breakfast cutoff (40 s).** Tap Global Bistro before 12:00: the sheet says when it opens and Add is off. Open Truly Indian: breakfast items (Kanda Poha, Upma, the parathas) are on until 11:00 and move to "Unavailable now" after it. If presenting after 11:00, show them there and say "the server refuses them too, not just the screen".

4. **Order and the progress line (60 s).** Phone A: Cafe Delice → Cold Coffee + Chilli Garlic Cheese Sandwich → Checkout → Deliver to GICT → As soon as possible → Pay. Back on Home the progress line shows Placed, with the walking figure on it. Keep Phone A visible: the figure moves along as the cafe works.

5. **The POS desk (60 s).** Laptop, Cafe portal › Queue. The ticket arrives under New with a chime, styled as a kitchen slip, coloured by age. Accept → Start preparing → Mark ready. Print the bag slip (80 mm) and show its QR. Phone A's line moves to Preparing, then waits for a runner.

6. **The runner (80 s).** Phone B: the Scan button shows a number, the ready bags waiting. Open it: grouped by building with what each earns. Scan the slip QR on the laptop → "You earn ₹5" → Accept. The ticket moves to Out for delivery with Aarav's name; Phone A's line moves to On the way. At "GICT", Phone B taps **I'm here**; Phone A gets the Update. Phone A shows the 4-digit code, Phone B types it: Delivered. Phone B's wallet +₹5 in the ledger.

7. **When it goes wrong (50 s).** The late-test order from before the talk is now past grace. Cafe portal: the red alert on the desk. Admin › Users: Meera refunded, Aarav's penalty in his ledger. "Nobody has to chase it; the rules decide who pays."

8. **Access (20 s).** Hand the panel the temp code from Admin › Codes; it works once and a new one takes its place.

9. **Close (10 s).** "Four cafes, a vending machine, six buildings, on free tiers, working on these phones right now."

## If something breaks
- Camera will not scan: "Type order ID instead" on the runner side, "Type the code" at the counter.
- Wi-Fi drops: laptop on a phone hotspot.
- Data looks wrong: Admin › Demo › Reset, then Seed (about 10 seconds), then make a fresh late-test order.
- The late order has not settled yet: refresh the Cafe Queue once; the server settles overdue orders on the next poll.
