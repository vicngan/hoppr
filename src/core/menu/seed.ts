import type { MenuItem } from './types';

/** Seed menus for a few places so "Order this" is real out of the box. */
export const SEED_MENUS: Record<string, MenuItem[]> = {
  otterbein: [
    { id: 'ot-cortado', name: 'Honey oat cortado', price: 5.25, section: 'Espresso', source: 'seed', dietary: ['veg'], tags: ['caffeine', 'small', 'savory'], description: 'Two shots, oat milk, a thread of honey. Small, not sweet.' },
    { id: 'ot-latte', name: 'Vanilla oat latte', price: 5.75, section: 'Espresso', source: 'seed', dietary: ['veg'], tags: ['caffeine', 'sweet'] },
    { id: 'ot-filter', name: 'Batch filter coffee', price: 3.5, section: 'Coffee', source: 'seed', dietary: ['vegan'], tags: ['caffeine', 'light', 'small'] },
    { id: 'ot-matcha', name: 'Iced matcha', price: 5.5, section: 'Not coffee', source: 'seed', dietary: ['veg'], tags: ['light', 'sweet'] },
    { id: 'ot-toast', name: 'Sourdough & ricotta toast', price: 8.0, section: 'Kitchen', source: 'seed', dietary: ['veg'], tags: ['savory', 'light', 'small'] },
    { id: 'ot-cookie', name: 'Brown butter cookie', price: 3.75, section: 'Pastry', source: 'seed', dietary: ['veg'], tags: ['sweet', 'small'] },
  ],
  grainhaus: [
    { id: 'gr-croissant', name: 'Butter croissant', price: 4.0, section: 'Pastry', source: 'seed', dietary: ['veg'], tags: ['savory', 'small'] },
    { id: 'gr-almond', name: 'Almond croissant', price: 4.75, section: 'Pastry', source: 'seed', dietary: ['veg'], tags: ['sweet', 'small'] },
    { id: 'gr-focaccia', name: 'Tomato focaccia slice', price: 5.0, section: 'Savory', source: 'seed', dietary: ['vegan'], tags: ['savory', 'small'] },
    { id: 'gr-drip', name: 'Filter coffee', price: 3.0, section: 'Coffee', source: 'seed', dietary: ['vegan'], tags: ['caffeine', 'light', 'small'] },
  ],
  halyard: [
    { id: 'ha-burrata', name: 'Burrata & peaches', price: 16.0, section: 'Small plates', source: 'seed', dietary: ['veg', 'gf'], tags: ['light', 'sharing'] },
    { id: 'ha-mushroom', name: 'Roasted mushroom toast', price: 14.0, section: 'Small plates', source: 'seed', dietary: ['veg'], tags: ['savory', 'sharing'] },
    { id: 'ha-steak', name: 'Hanger steak, frites', price: 32.0, section: 'Mains', source: 'seed', dietary: ['gf'], tags: ['hearty', 'large', 'savory'] },
    { id: 'ha-cauli', name: 'Whole roasted cauliflower', price: 24.0, section: 'Mains', source: 'seed', dietary: ['vegan', 'gf'], tags: ['hearty', 'large', 'savory', 'sharing'] },
    { id: 'ha-negroni', name: 'House negroni', price: 13.0, section: 'Drinks', source: 'seed', dietary: [], tags: ['alcohol'] },
    { id: 'ha-tart', name: 'Brown sugar tart', price: 11.0, section: 'Dessert', source: 'seed', dietary: ['veg'], tags: ['sweet', 'sharing'] },
  ],
  cadence: [
    { id: 'ca-pilsner', name: 'Local pilsner', price: 6.0, section: 'On tap', source: 'seed', dietary: ['vegan'], tags: ['alcohol', 'light'] },
    { id: 'ca-stout', name: 'Nitro stout', price: 7.0, section: 'On tap', source: 'seed', dietary: ['vegan'], tags: ['alcohol', 'hearty'] },
    { id: 'ca-old', name: 'Old fashioned', price: 12.0, section: 'Cocktails', source: 'seed', dietary: [], tags: ['alcohol'] },
    { id: 'ca-spritz', name: 'Bitter spritz', price: 11.0, section: 'Cocktails', source: 'seed', dietary: ['vegan'], tags: ['alcohol', 'light'] },
    { id: 'ca-na', name: 'House ginger soda', price: 5.0, section: 'Zero proof', source: 'seed', dietary: ['vegan'], tags: ['light', 'sweet'] },
    { id: 'ca-fries', name: 'Rosemary fries', price: 8.0, section: 'Snacks', source: 'seed', dietary: ['vegan'], tags: ['savory', 'sharing', 'small'] },
  ],
};
