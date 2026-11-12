# MENU

Prices are in whole rupees, all items vegetarian, nothing above ₹120. These are realistic placeholders agreed by the team; correct any name or price in `data/menu.ts` only. `prep` is minutes from Accepted to Ready. An order's prep time is the highest `prep` among its items (items are made in parallel). Tags: `morning` = only orderable before 11:30, `bestseller` = shown on Home under "Popular at UC".

## Truly Indian (`truly-indian`)
Home-style Gujarati and North Indian.

| id | Item | ₹ | prep | tags |
|---|---|---|---|---|
| ti-thali | Gujarati Thali (2 sabzi, dal, rice, 3 rotli, salad) | 65 | 6 | bestseller |
| ti-combo-paneer | Chapati + Paneer Sabzi combo (3 chapati) | 80 | 5 | |
| ti-combo-mixveg | Chapati + Mix Veg combo (3 chapati) | 70 | 5 | |
| ti-sev-tameta | Sev Tameta Sabzi with 2 rotli | 55 | 5 | |
| ti-dal-rice | Dal Rice | 60 | 4 | |
| ti-aloo-paratha | Aloo Paratha with curd | 50 | 6 | |
| ti-paneer-paratha | Paneer Paratha with curd | 60 | 6 | |
| ti-thepla | Methi Thepla (3) with chhundo | 45 | 3 | morning |
| ti-poha | Kanda Poha | 40 | 3 | morning, bestseller |
| ti-upma | Upma | 40 | 3 | morning |
| ti-khaman | Khaman (plate) | 35 | 2 | |
| ti-roti | Extra Rotli (2) | 15 | 2 | |
| ti-chaas | Masala Chaas (buttermilk) | 20 | 1 | |
| ti-chai | Masala Chai | 15 | 2 | |

## Cafe Delice (`cafe-delice`)
Coffee, sandwiches, pancakes, juices.

| id | Item | ₹ | prep | tags |
|---|---|---|---|---|
| cd-espresso | Espresso | 60 | 2 | |
| cd-eye-opener | Eye Opener | 70 | 3 | |
| cd-double-eye | Double Eye Opener | 90 | 3 | |
| cd-cappuccino | Cappuccino | 80 | 3 | bestseller |
| cd-black-coffee | Black Coffee | 60 | 2 | |
| cd-cold-coffee | Cold Coffee | 90 | 3 | bestseller |
| cd-tea | Tea | 20 | 2 | |
| cd-cg-sandwich | Chilli Garlic Cheese Sandwich | 90 | 5 | |
| cd-ctc-sandwich | CTC Sandwich | 100 | 5 | |
| cd-veg-sandwich | Veg Grilled Sandwich | 80 | 5 | |
| cd-pancakes | Pancakes (3) with honey | 90 | 6 | |
| cd-lemonade | Fresh Lemonade | 50 | 2 | |
| cd-juice | Fresh Juice of the Day | 60 | 3 | |
| cd-fruit-bowl | Seasonal Fruit Bowl | 60 | 2 | |

## Global Bistro (`global-bistro`)
Biryani, Indo-Chinese, pasta, burgers.

| id | Item | ₹ | prep | tags |
|---|---|---|---|---|
| gb-veg-biryani | Veg Dum Biryani with raita | 100 | 6 | bestseller |
| gb-paneer-biryani | Paneer Biryani with raita | 120 | 6 | |
| gb-hakka | Veg Hakka Noodles | 90 | 6 | |
| gb-schezwan-rice | Schezwan Fried Rice | 90 | 6 | |
| gb-manchurian | Veg Manchurian (dry) | 90 | 6 | |
| gb-penne | Penne Arrabbiata | 110 | 7 | |
| gb-burger | Veg Burger | 70 | 5 | |
| gb-fries | French Fries | 60 | 4 | |
| gb-peri-fries | Peri Peri Fries | 70 | 4 | |
| gb-tikka-wrap | Paneer Tikka Wrap | 90 | 5 | bestseller |

## Greens and Grains (`greens-grains`)
Bowls, salads, smoothies, light snacks.

| id | Item | ₹ | prep | tags |
|---|---|---|---|---|
| gg-quinoa | Quinoa Veg Bowl | 110 | 4 | |
| gg-paneer-bowl | Paneer Salad Bowl | 110 | 4 | bestseller |
| gg-greek | Greek Salad | 100 | 3 | |
| gg-millet | Millet Khichdi Bowl | 90 | 4 | |
| gg-sprouts | Sprouts Chaat | 50 | 2 | |
| gg-hummus | Hummus with Veg Sticks | 90 | 2 | |
| gg-parfait | Fruit Yogurt Parfait | 80 | 2 | |
| gg-smoothie | Banana Oat Smoothie | 90 | 3 | |
| gg-cooler | Mint Cucumber Cooler | 60 | 2 | |
| gg-chikki | Peanut Chikki Bar | 20 | 0 | |

## UC Vending Machine (`vending`)
Prep is 0 for every item. Each item has a machine slot and a stock count. Stock goes down when an order is placed and back up if that order is refunded before it is dispensed. Sold-out slots show "Sold out" and cannot be added. Snack names below are representative; the team should match them to what is actually loaded in the machine.

| slot | id | Item | ₹ | start stock |
|---|---|---|---|---|
| A1 | v-pb-aamras | Paper Boat Aamras | 25 | 8 |
| A2 | v-pb-jaljeera | Paper Boat Jaljeera | 25 | 8 |
| A3 | v-pb-kokum | Paper Boat Kokum | 25 | 6 |
| A4 | v-pb-aampanna | Paper Boat Aam Panna | 25 | 6 |
| A5 | v-pb-kalakhatta | Paper Boat Jamun Kala Khatta | 25 | 6 |
| A6 | v-pb-anar | Paper Boat Anar | 25 | 5 |
| B1 | v-coke | Coca-Cola (tin) | 50 | 10 |
| B2 | v-sprite | Sprite (tin) | 50 | 10 |
| B3 | v-fanta | Fanta (tin) | 50 | 10 |
| C1 | v-ty-karare | Too Yumm Karare, Masala | 20 | 8 |
| C2 | v-ty-multigrain | Too Yumm Multigrain Chips, Classic Salted | 20 | 8 |
| C3 | v-ty-veggie | Too Yumm Veggie Stix | 20 | 6 |
| C4 | v-ty-bhoot | Too Yumm Bhoot Chips | 20 | 6 |
| C5 | v-ty-rings | Too Yumm Rings, Cheese | 20 | 6 |
| C6 | v-ty-makhana | Too Yumm Makhana, Peri Peri | 20 | 5 |

## Data shape (`data/menu.ts`)

```ts
export type SourceId = "truly-indian" | "global-bistro" | "cafe-delice" | "greens-grains" | "vending";
export interface MenuItem {
  id: string;
  sourceId: SourceId;
  name: string;
  price: number;        // integer rupees
  prepMin: number;
  tags: ("morning" | "bestseller")[];
  slot?: string;        // vending only, e.g. "B2"
  startStock?: number;  // vending only
  description?: string; // one short line, optional
}
export interface Source { id: SourceId; name: string; tagline: string; kind: "cafe" | "vending"; }
```

Cafe staff can mark any item "Unavailable today" from the Cafe portal. That flag lives in Redis, not in this file.

## Images

No AI-generated food images. Until the team adds real photos to `public/food/<item-id>.jpg`, every item shows the initial tile described in UI_UX_BIBLE.md. `next.config.ts` lists the `.jpg` files in `public/food/` at build time (env `NEXT_PUBLIC_FOOD_PHOTOS`, read through `lib/photos.ts`), and `ItemTile` only asks for a photo that is on that list, so there are no 404s for missing photos. Add photos, push, and the next build picks them up. If a listed photo fails to load, the tile stays.
