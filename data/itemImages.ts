/**
 * Hotlinked photos for menu item cards, keyed by menu item id (data/menu.ts). Nothing is downloaded or committed: the
 * browser loads each URL directly. An item with no entry, or whose photo fails to load, shows its initials tile.
 */
export interface ItemImageEntry {
  url: string;
  /** CSS object-position for the crop's focal point, e.g. "center 40%". Default centre. */
  objectPosition?: string;
  alt: string;
}

/** Photos from Wikimedia Commons (330 px thumbnails on upload.wikimedia.org). */
export const ITEM_IMAGES: Record<string, ItemImageEntry> = {
  "ti-thepla": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Masala_thepla_with_Methi_kela.JPG/330px-Masala_thepla_with_Methi_kela.JPG", alt: "Methi Thepla with chhundo" },
  "ti-poha": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Kanda_poha.jpg/330px-Kanda_poha.jpg", alt: "Kanda Poha" },
  "ti-upma": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Upma-_Breakfast_meal.jpg/330px-Upma-_Breakfast_meal.jpg", alt: "Upma" },
  "ti-aloo-paratha": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Aloo_Paratha_with_curd_and_Pickle.jpg/330px-Aloo_Paratha_with_curd_and_Pickle.jpg", alt: "Aloo Paratha with curd" },
  "ti-paneer-paratha": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Awadhi_palak_paneer_paratha_dahi.jpg/330px-Awadhi_palak_paneer_paratha_dahi.jpg", alt: "Paneer Paratha with curd" },
  "ti-matar-paneer-paratha": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Stuffed_paratha_%283245707066%29.jpg/330px-Stuffed_paratha_%283245707066%29.jpg", alt: "Matar Paneer Paratha with curd" },
  "ti-thali": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Authentic_gujarati_thali.jpg/330px-Authentic_gujarati_thali.jpg", objectPosition: "center 40%", alt: "Gujarati Thali" },
  "ti-combo-paneer": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Chapati_palak_paneer_and_brinjal_semi_gravy_homemade_by_Sujatha_aunty_karnataka.jpg_02.jpg/330px-Chapati_palak_paneer_and_brinjal_semi_gravy_homemade_by_Sujatha_aunty_karnataka.jpg_02.jpg", alt: "Chapati + Paneer Sabzi combo" },
  "ti-combo-mixveg": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/My_Veg_thali.jpg/330px-My_Veg_thali.jpg", alt: "Chapati + Mix Veg combo" },
  "ti-sev-tameta": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Sev_Tameta_Nu_Shaak.jpg/330px-Sev_Tameta_Nu_Shaak.jpg", alt: "Sev Tameta Sabzi with 2 rotli" },
  "ti-dal-rice": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Dal_bhat.jpg/330px-Dal_bhat.jpg", alt: "Dal Rice" },
  "ti-roti": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Rotli.jpg/330px-Rotli.jpg", alt: "Extra Rotli" },
  "ti-khaman": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Khaman_dhokla_%28cropped%29.jpg/330px-Khaman_dhokla_%28cropped%29.jpg", alt: "Khaman" },
  "ti-chaas": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Masala_Buttermilk.JPG/330px-Masala_Buttermilk.JPG", alt: "Masala Chaas" },
  "ti-chai": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Masala_Chai.jpg/330px-Masala_Chai.jpg", alt: "Masala Chai" },
  "cd-espresso": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Cup_of_espresso_02.jpg/330px-Cup_of_espresso_02.jpg", alt: "Espresso" },
  "cd-eye-opener": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Espresso_single_shot_coffee.jpg/330px-Espresso_single_shot_coffee.jpg", alt: "Eye Opener" },
  "cd-double-eye": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Espresso_Doppio.jpg/330px-Espresso_Doppio.jpg", alt: "Double Eye Opener" },
  "cd-cappuccino": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Cappuccino_8.jpg/330px-Cappuccino_8.jpg", alt: "Cappuccino" },
  "cd-black-coffee": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Cup_of_black_coffee.jpg/330px-Cup_of_black_coffee.jpg", alt: "Black Coffee" },
  "cd-cold-coffee": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Iced_Coffee_in_Glass_-_Sunshine_Coffee_-_Laramie_Cafe_%2853838344552%29.jpg/330px-Iced_Coffee_in_Glass_-_Sunshine_Coffee_-_Laramie_Cafe_%2853838344552%29.jpg", alt: "Cold Coffee" },
  "cd-tea": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Cup_of_black_tea.JPG/330px-Cup_of_black_tea.JPG", alt: "Tea" },
  "cd-juice": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Orange_juice_1_edit1.jpg/330px-Orange_juice_1_edit1.jpg", alt: "Fresh Juice of the Day" },
  "cd-cg-sandwich": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Grilled_cheese_sandwich.jpg/330px-Grilled_cheese_sandwich.jpg", alt: "Chilli Garlic Cheese Sandwich" },
  "cd-ctc-sandwich": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Blue_cheese_and_tomato_sandwiches.jpg/330px-Blue_cheese_and_tomato_sandwiches.jpg", alt: "CTC Sandwich" },
  "cd-veg-sandwich": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/A_fresh_sandwich_filled_with_grilled_vegetables.jpg/330px-A_fresh_sandwich_filled_with_grilled_vegetables.jpg", alt: "Veg Grilled Sandwich" },
  "cd-pancakes": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Pancakes_with_honey.jpg/330px-Pancakes_with_honey.jpg", objectPosition: "center 40%", alt: "Pancakes with honey" },
  "cd-fruit-bowl": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Fruitbowlwithmelons.jpg/330px-Fruitbowlwithmelons.jpg", alt: "Seasonal Fruit Bowl" },
  "gb-veg-biryani": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Veg_biryani.jpg/330px-Veg_biryani.jpg", alt: "Veg Dum Biryani with raita" },
  "gb-paneer-biryani": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Paneer_Biriyani_02.jpg/330px-Paneer_Biriyani_02.jpg", alt: "Paneer Biryani with raita" },
  "gb-hakka": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Tasty_hakka_noodles_image.jpg/330px-Tasty_hakka_noodles_image.jpg", alt: "Veg Hakka Noodles" },
  "gb-manchurian": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Veg_manchurian_Balls.jpg/330px-Veg_manchurian_Balls.jpg", alt: "Veg Manchurian" },
  "gb-penne": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Penne_Arrabbiata.jpg/330px-Penne_Arrabbiata.jpg", alt: "Penne Arrabbiata" },
  "gb-burger": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/The_ultimate_veggie_burger.jpg/330px-The_ultimate_veggie_burger.jpg", objectPosition: "center 40%", alt: "Veg Burger" },
  "gb-fries": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Plate_of_chips_at_the_Chalet_Cafe%2C_Cowfold%2C_West_Sussex%2C_England.jpg/330px-Plate_of_chips_at_the_Chalet_Cafe%2C_Cowfold%2C_West_Sussex%2C_England.jpg", alt: "French Fries" },
  "gb-peri-fries": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Seasoned_french_fries.jpg/330px-Seasoned_french_fries.jpg", alt: "Peri Peri Fries" },
  "gg-quinoa": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Vegan_Quinoa_Bowl_%2844040185371%29.jpg/330px-Vegan_Quinoa_Bowl_%2844040185371%29.jpg", alt: "Quinoa Veg Bowl" },
  "gg-millet": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Masala_Khichadi.jpg/330px-Masala_Khichadi.jpg", alt: "Millet Khichdi Bowl" },
  "gg-greek": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/GreekSalad.jpg/330px-GreekSalad.jpg", alt: "Greek Salad" },
  "gg-sprouts": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Sprout_Chaat.jpg/330px-Sprout_Chaat.jpg", alt: "Sprouts Chaat" },
  "gg-hummus": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Black_bean_hummus_and_vegetables_-_2021-11-20_-_Sarah_Stierch.jpg/330px-Black_bean_hummus_and_vegetables_-_2021-11-20_-_Sarah_Stierch.jpg", alt: "Hummus with Veg Sticks" },
  "gg-parfait": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Dannon_Low_Fat_Yogurt_Parfait_1_%2815876174571%29.jpg/330px-Dannon_Low_Fat_Yogurt_Parfait_1_%2815876174571%29.jpg", alt: "Fruit Yogurt Parfait" },
  "gg-chikki": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Peanut_Chikki_With_Caramel.jpg/330px-Peanut_Chikki_With_Caramel.jpg", alt: "Peanut Chikki Bar" },
  "gg-smoothie": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Banana_Smoothie.jpg/330px-Banana_Smoothie.jpg", alt: "Banana Oat Smoothie" },
  "v-pb-aamras": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Aamras_Serving.jpg/330px-Aamras_Serving.jpg", alt: "Paper Boat Aamras" },
  "v-pb-jaljeera": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Jaljeera.jpg/330px-Jaljeera.jpg", alt: "Paper Boat Jaljeera" },
  "v-pb-kokum": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Kokum_or_Punarpuli_sharbat.jpg/330px-Kokum_or_Punarpuli_sharbat.jpg", alt: "Paper Boat Kokum" },
  "v-pb-aampanna": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Aam_Panna_-_Summer_Cooler.JPG/330px-Aam_Panna_-_Summer_Cooler.JPG", alt: "Paper Boat Aam Panna" },
  "v-pb-anar": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Pomegranate_Juice_%282019%29.jpg/330px-Pomegranate_Juice_%282019%29.jpg", alt: "Paper Boat Anar" },
  "v-coke": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Coca-cola_50cl_can_-_Italia.jpg/330px-Coca-cola_50cl_can_-_Italia.jpg", alt: "Coca-Cola" },
  "v-fanta": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Fanta-Orange-Can-330ml_84177_%287116950883%29.jpg/330px-Fanta-Orange-Can-330ml_84177_%287116950883%29.jpg", alt: "Fanta" },
  "v-ty-karare": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Indian_Snacks_%28Namkeen%29.jpg/330px-Indian_Snacks_%28Namkeen%29.jpg", alt: "Too Yumm Karare" },
  "v-ty-bhoot": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Potato-Chips.jpg/330px-Potato-Chips.jpg", alt: "Too Yumm Bhoot Chips" },
  "v-ty-makhana": { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Foxnut_Makhana_-_Nawada_District_-_Bihar_-_1.jpg/330px-Foxnut_Makhana_-_Nawada_District_-_Bihar_-_1.jpg", alt: "Too Yumm Makhana" },
};
