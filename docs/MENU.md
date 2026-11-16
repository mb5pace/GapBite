# MENU

Prices are in whole rupees, all items vegetarian, nothing above ₹120. These are realistic placeholders agreed by the team; correct any name or price in `data/menu.ts` only. `prep` is minutes from Accepted to Ready. An order's prep time is the highest `prep` among its items (items are made in parallel). Tag: `bestseller` = shown on Home under "Popular at UC". `category` groups the items on a menu page.

## Truly Indian (`truly-indian`)
Home-style Gujarati and North Indian.

| id | Item | ₹ | prep | category | tags |
|---|---|---|---|---|---|
| ti-thepla | Methi Thepla (3) with chhundo | 45 | 3 | Breakfast |  |
| ti-poha | Kanda Poha | 40 | 3 | Breakfast | bestseller |
| ti-upma | Upma | 40 | 3 | Breakfast |  |
| ti-aloo-paratha | Aloo Paratha with curd | 50 | 6 | Breakfast |  |
| ti-paneer-paratha | Paneer Paratha with curd | 60 | 6 | Breakfast |  |
| ti-matar-paneer-paratha | Matar Paneer Paratha with curd | 60 | 6 | Breakfast |  |
| ti-thali | Gujarati Thali (2 sabzi, dal, rice, 3 rotli, salad) | 65 | 6 | Meals and Combos | bestseller |
| ti-combo-paneer | Chapati + Paneer Sabzi combo (3 chapati) | 80 | 5 | Meals and Combos |  |
| ti-combo-mixveg | Chapati + Mix Veg combo (3 chapati) | 70 | 5 | Meals and Combos |  |
| ti-sev-tameta | Sev Tameta Sabzi with 2 rotli | 55 | 5 | Meals and Combos |  |
| ti-dal-rice | Dal Rice | 60 | 4 | Meals and Combos |  |
| ti-roti | Extra Rotli (2) | 15 | 2 | Meals and Combos |  |
| ti-khaman | Khaman (plate) | 35 | 2 | Snacks |  |
| ti-chaas | Masala Chaas (buttermilk) | 20 | 1 | Drinks |  |
| ti-chai | Masala Chai | 15 | 2 | Drinks |  |

## Cafe Delice (`cafe-delice`)
Coffee, sandwiches, pancakes, juices.

| id | Item | ₹ | prep | category | tags |
|---|---|---|---|---|---|
| cd-espresso | Espresso | 60 | 2 | Coffee |  |
| cd-eye-opener | Eye Opener | 70 | 3 | Coffee |  |
| cd-double-eye | Double Eye Opener | 90 | 3 | Coffee |  |
| cd-cappuccino | Cappuccino | 80 | 3 | Coffee | bestseller |
| cd-black-coffee | Black Coffee | 60 | 2 | Coffee |  |
| cd-cold-coffee | Cold Coffee | 90 | 3 | Coffee | bestseller |
| cd-tea | Tea | 20 | 2 | Tea and Drinks |  |
| cd-lemonade | Fresh Lemonade | 50 | 2 | Tea and Drinks |  |
| cd-juice | Fresh Juice of the Day | 60 | 3 | Tea and Drinks |  |
| cd-cg-sandwich | Chilli Garlic Cheese Sandwich | 90 | 5 | Sandwiches |  |
| cd-ctc-sandwich | CTC Sandwich | 100 | 5 | Sandwiches |  |
| cd-veg-sandwich | Veg Grilled Sandwich | 80 | 5 | Sandwiches |  |
| cd-pancakes | Pancakes (3) with honey | 90 | 6 | Sweet and Fruit |  |
| cd-fruit-bowl | Seasonal Fruit Bowl | 60 | 2 | Sweet and Fruit |  |

## Global Bistro (`global-bistro`)
Biryani, Indo-Chinese, pasta, burgers.

| id | Item | ₹ | prep | category | tags |
|---|---|---|---|---|---|
| gb-veg-biryani | Veg Dum Biryani with raita | 100 | 6 | Biryani | bestseller |
| gb-paneer-biryani | Paneer Biryani with raita | 120 | 6 | Biryani |  |
| gb-hakka | Veg Hakka Noodles | 90 | 6 | Chinese |  |
| gb-schezwan-rice | Schezwan Fried Rice | 90 | 6 | Chinese |  |
| gb-manchurian | Veg Manchurian (dry) | 90 | 6 | Chinese |  |
| gb-penne | Penne Arrabbiata | 110 | 7 | Pasta and Burgers |  |
| gb-burger | Veg Burger | 70 | 5 | Pasta and Burgers |  |
| gb-tikka-wrap | Paneer Tikka Wrap | 90 | 5 | Pasta and Burgers | bestseller |
| gb-fries | French Fries | 60 | 4 | Sides |  |
| gb-peri-fries | Peri Peri Fries | 70 | 4 | Sides |  |

## Greens and Grains (`greens-grains`)
Bowls, salads, smoothies, light snacks.

| id | Item | ₹ | prep | category | tags |
|---|---|---|---|---|---|
| gg-quinoa | Quinoa Veg Bowl | 110 | 4 | Bowls |  |
| gg-paneer-bowl | Paneer Salad Bowl | 110 | 4 | Bowls | bestseller |
| gg-millet | Millet Khichdi Bowl | 90 | 4 | Bowls |  |
| gg-greek | Greek Salad | 100 | 3 | Salads and Snacks |  |
| gg-sprouts | Sprouts Chaat | 50 | 2 | Salads and Snacks |  |
| gg-hummus | Hummus with Veg Sticks | 90 | 2 | Salads and Snacks |  |
| gg-parfait | Fruit Yogurt Parfait | 80 | 2 | Salads and Snacks |  |
| gg-chikki | Peanut Chikki Bar | 20 | 0 | Salads and Snacks |  |
| gg-smoothie | Banana Oat Smoothie | 90 | 3 | Smoothies and Coolers |  |
| gg-cooler | Mint Cucumber Cooler | 60 | 2 | Smoothies and Coolers |  |

## UC Vending Machine (`vending`)
Prep is 0 for every item. Each item has a machine slot and a stock count. Stock goes down when an order is placed and back up if that order is refunded before it is dispensed. Sold-out slots show "Sold out" and cannot be added. Snack names below are representative; the team should match them to what is actually loaded in the machine.

| slot | id | Item | ₹ | category | start stock |
|---|---|---|---|---|---|
| A1 | v-pb-aamras | Paper Boat Aamras | 25 | Drinks | 8 |
| A2 | v-pb-jaljeera | Paper Boat Jaljeera | 25 | Drinks | 8 |
| A3 | v-pb-kokum | Paper Boat Kokum | 25 | Drinks | 6 |
| A4 | v-pb-aampanna | Paper Boat Aam Panna | 25 | Drinks | 6 |
| A5 | v-pb-kalakhatta | Paper Boat Jamun Kala Khatta | 25 | Drinks | 6 |
| A6 | v-pb-anar | Paper Boat Anar | 25 | Drinks | 5 |
| B1 | v-coke | Coca-Cola (tin) | 50 | Drinks | 10 |
| B2 | v-sprite | Sprite (tin) | 50 | Drinks | 10 |
| B3 | v-fanta | Fanta (tin) | 50 | Drinks | 10 |
| C1 | v-ty-karare | Too Yumm Karare, Masala | 20 | Snacks | 8 |
| C2 | v-ty-multigrain | Too Yumm Multigrain Chips, Classic Salted | 20 | Snacks | 8 |
| C3 | v-ty-veggie | Too Yumm Veggie Stix | 20 | Snacks | 6 |
| C4 | v-ty-bhoot | Too Yumm Bhoot Chips | 20 | Snacks | 6 |
| C5 | v-ty-rings | Too Yumm Rings, Cheese | 20 | Snacks | 6 |
| C6 | v-ty-makhana | Too Yumm Makhana, Peri Peri | 20 | Snacks | 5 |

## Data shape (`data/menu.ts`)

```ts
export type SourceId = "truly-indian" | "global-bistro" | "cafe-delice" | "greens-grains" | "vending";
export interface MenuItem {
  id: string;
  sourceId: SourceId;
  name: string;
  price: number;        // integer rupees
  prepMin: number;
  category: string;     // required: the part of the source's menu it sits under, exactly as in the tables
  tags: "bestseller"[];
  slot?: string;        // vending only, e.g. "B2"
  startStock?: number;  // vending only
  description?: string; // one short line, optional
}
export interface Source { id: SourceId; name: string; tagline: string; kind: "cafe" | "vending"; }
```

**Categories.** Every item has a required `category`, shown in the tables above. A menu page groups its items by category in that order (Phase B adds category tabs). The categories are:

| Source | Categories, in order |
|---|---|
| Truly Indian | Breakfast, Meals and Combos, Snacks, Drinks |
| Cafe Delice | Coffee, Tea and Drinks, Sandwiches, Sweet and Fruit |
| Global Bistro | Biryani, Chinese, Pasta and Burgers, Sides |
| Greens and Grains | Bowls, Salads and Snacks, Smoothies and Coolers |
| UC Vending Machine | Drinks (slots A and B), Snacks (slot C) |

**When an item can be ordered.** There is no "morning" tag and no 11:30 cutoff any more. An item can have its own time window (an available-from and/or an available-until time); the defaults are in `data/hours.ts` and the Cafe portal can change them. The six breakfast items (Methi Thepla, Kanda Poha, Upma, Aloo Paratha, Paneer Paratha, Matar Paneer Paratha) are available from opening until 11:00 ("Breakfast, until 11:00"). See BUSINESS_RULES.md "Opening hours, holidays and pauses".

Cafe staff can also mark any item "Available today" off from the Cafe portal (Hours and items). That flag lives in Redis, not in this file.

## Images

No AI-generated food images. Until the team adds real photos to `public/food/<item-id>.jpg`, every item shows the initial tile described in UI_UX_BIBLE.md. `next.config.ts` lists the `.jpg` files in `public/food/` at build time (env `NEXT_PUBLIC_FOOD_PHOTOS`, read through `lib/photos.ts`), and `ItemTile` only asks for a photo that is on that list, so there are no 404s for missing photos. Add photos, push, and the next build picks them up. If a listed photo fails to load, the tile stays.
