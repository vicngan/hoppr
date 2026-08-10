/**
 * Menu model for the "Order this" chooser. Dishes carry lightweight attribute
 * tags + dietary flags so the recommender can pick what fits your taste and
 * limits, whether the items were seeded, photographed (OCR), or added by hand.
 */

export const DISH_TAGS = [
  'light',
  'hearty',
  'sweet',
  'savory',
  'spicy',
  'caffeine',
  'alcohol',
  'small',
  'large',
  'sharing',
] as const;
export type DishTag = (typeof DISH_TAGS)[number];

export type Dietary = 'veg' | 'vegan' | 'gf' | 'dairy_free';

export type MenuItem = {
  id: string;
  name: string;
  /** price in dollars, or null if unpriced */
  price: number | null;
  description?: string;
  /** menu section, e.g. "Espresso", "Small plates" */
  section?: string;
  tags: DishTag[];
  dietary: Dietary[];
  source: 'seed' | 'ocr' | 'manual';
};

export type Menu = {
  placeId: string;
  items: MenuItem[];
  updatedAt: number;
};

/** The diner's standing food limits/preferences (set on the menu screen). */
export type FoodPrefs = {
  diet: Dietary | null; // a required diet, if any
  noAlcohol: boolean;
};

export const emptyFoodPrefs = (): FoodPrefs => ({ diet: null, noAlcohol: false });

export const DIETARY_LABEL: Record<Dietary, string> = {
  veg: 'Vegetarian',
  vegan: 'Vegan',
  gf: 'Gluten-free',
  dairy_free: 'Dairy-free',
};
