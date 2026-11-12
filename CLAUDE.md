# QuickX — build rules (read this first, every session)

QuickX is Team GapBite's prototype: students at Ahmedabad University order from the four cafes and the vending machine at the University Centre (UC) and either collect it at UC or get it delivered to their building during a short class break, carried by a fellow student ("runner buddy") or by cafe staff.

This is a presentation prototype, not a production app. It must look finished and work end to end on real phones and a laptop at the same time, on free tiers only.

## Read order

Before writing any code, read these in order. They are the source of truth. If code and docs disagree, the docs win; if two docs disagree, stop and ask.

1. `docs/PRODUCT.md` — what we are building and what we are not
2. `docs/BUSINESS_RULES.md` — every number: fees, wallet floor, grace time, penalties
3. `docs/FLOWS.md` — order lifecycle and status machine
4. `docs/LOCATIONS.md` — UC, the six delivery buildings, zones, walk times
5. `docs/MENU.md` — all items and prices
6. `docs/ACCESS.md` — access codes, sessions, identity
7. `docs/SCREENS.md` — every screen in the three portals
8. `docs/UI_UX_BIBLE.md` — palette, type, components, banned patterns
9. `docs/ARCHITECTURE.md` — stack, folders, data model, API
10. `docs/BUILD_PLAN.md` — the phase you are on
11. `docs/DEMO_SCRIPT.md` — how it will be presented (read before polishing)

## Stack (do not change without asking)

Next.js (App Router) + TypeScript (strict) + Tailwind CSS, deployed on Vercel Hobby from this GitHub repo. One Upstash Redis database (added through the Vercel Marketplace, free tier) for all shared state. Polling, not websockets. No Supabase, no Firebase, no ORM, no auth library, no paid service. Full details in `docs/ARCHITECTURE.md`.

## Hard rules

1. Work phase by phase from `docs/BUILD_PLAN.md`. Finish and tick a phase before starting the next. Do not build ahead.
2. All money is integer rupees. Never floats. Never paise.
3. Every number in `BUSINESS_RULES.md` lives in `lib/config.ts` and is imported from there. No magic numbers in components or routes.
4. Menu and locations live in `data/` as typed TypeScript. Never hard-code an item name or price in a component.
5. Secrets (cafe password, admin password, permanent codes, session secret, Redis token) only in environment variables. Never commit them. Never send them to the browser. Keep `.env.example` updated with names only.
6. All Redis access is server-side, in `lib/`. Client components never import `lib/redis.ts`.
7. Every state change that touches money or order ownership must be atomic (see ARCHITECTURE.md "Concurrency"). Two runners scanning the same bag must never both get it.
8. Server time is the only clock. Never trust a timestamp from the browser.
9. Follow `UI_UX_BIBLE.md` exactly. Use only the palette tokens. Light mode only. No gradients, no glow, no emoji as icons, no dark mode, no purple. Read the banned list before building any screen.
10. No AI-generated images or illustrations. Use the illustration sources listed in the bible, real food photos only if the team supplies them, otherwise the item-initial tiles described there.
11. Student portal is mobile-first (design at 390 px wide). Cafe and Admin portals are laptop-first (1280 px), still usable on a tablet.
12. Copy is plain, short and specific to campus. No buzzwords ("seamless", "unlock", "elevate", "revolutionize"). Use real place names: UC, GICT, SAS, AMSOM, AG, BK, VentureStudio.
13. Prefer fewer dependencies. Ask before adding any package not listed in ARCHITECTURE.md.
14. After each phase: `npm run build` must pass with zero type errors, then commit with a clear message. Do not leave the app in a broken state on `main`, because Vercel deploys every push.

## Vocabulary

Source = one of the five places that sell: Truly Indian, Global Bistro, Cafe Delice, Greens and Grains, Vending Machine. Runner buddy = a student delivering someone else's order. Staff delivery = cafe staff delivering. Drop point = the fixed handover spot at each building. Handover code = 4-digit code the buyer shows the runner. Collect code = the same 4-digit code used for pickup at a counter or the vending kiosk. Promised time = when the order should reach the buyer. Grace = 5 extra minutes after the promised time before the order fails.

## When unsure

Ask. Do not invent a rule, a price, a screen or a field. If a doc is silent, write the question at the bottom of `docs/BUILD_PLAN.md` under "Open questions" and pick the simplest behaviour until answered.
