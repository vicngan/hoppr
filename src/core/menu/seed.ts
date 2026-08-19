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
  marrow: [
    { id: 'ma-latte', name: 'Brown butter latte', price: 5.5, section: 'Espresso', source: 'seed', dietary: ['veg'], tags: ['caffeine', 'sweet'] },
    { id: 'ma-pourover', name: 'Single-origin pourover', price: 6.0, section: 'Coffee', source: 'seed', dietary: ['vegan'], tags: ['caffeine', 'light'] },
    { id: 'ma-scone', name: 'Buckwheat scone', price: 4.5, section: 'Pastry', source: 'seed', dietary: ['veg'], tags: ['savory', 'small'] },
    { id: 'ma-toast', name: 'Whipped feta toast', price: 9.0, section: 'Kitchen', source: 'seed', dietary: ['veg'], tags: ['savory', 'light', 'sharing'] },
  ],
  foldwell: [
    { id: 'fo-tea', name: 'Loose-leaf tea, any blend', price: 4.0, section: 'Tea', source: 'seed', dietary: ['vegan'], tags: ['light', 'small'] },
    { id: 'fo-cocoa', name: 'Dark hot cocoa', price: 5.0, section: 'Not coffee', source: 'seed', dietary: ['veg'], tags: ['sweet'] },
    { id: 'fo-shortbread', name: 'Rosemary shortbread', price: 3.5, section: 'Pastry', source: 'seed', dietary: ['veg'], tags: ['sweet', 'small'] },
  ],
  juniper: [
    { id: 'ju-negroni', name: 'Barrel-aged negroni', price: 15.0, section: 'Cocktails', source: 'seed', dietary: [], tags: ['alcohol'] },
    { id: 'ju-martini', name: 'Dirty martini', price: 14.0, section: 'Cocktails', source: 'seed', dietary: [], tags: ['alcohol'] },
    { id: 'ju-na', name: 'Seedlip & tonic', price: 9.0, section: 'Zero proof', source: 'seed', dietary: ['vegan'], tags: ['light'] },
    { id: 'ju-board', name: 'Cheese & charcuterie board', price: 22.0, section: 'Snacks', source: 'seed', dietary: ['gf'], tags: ['hearty', 'sharing', 'large'] },
  ],
  westerly: [
    { id: 'we-eggs', name: 'Diner eggs, any style', price: 11.0, section: 'Breakfast', source: 'seed', dietary: ['gf'], tags: ['hearty', 'savory'] },
    { id: 'we-pancakes', name: 'Buttermilk pancakes', price: 10.0, section: 'Breakfast', source: 'seed', dietary: ['veg'], tags: ['sweet', 'hearty', 'sharing'] },
    { id: 'we-blt', name: 'Classic BLT', price: 12.0, section: 'Lunch', source: 'seed', dietary: [], tags: ['savory', 'hearty'] },
    { id: 'we-coffee', name: 'Bottomless drip coffee', price: 3.0, section: 'Drinks', source: 'seed', dietary: ['vegan'], tags: ['caffeine', 'light'] },
  ],
  lumen: [
    { id: 'lu-latte', name: 'Lavender oat latte', price: 5.75, section: 'Espresso', source: 'seed', dietary: ['vegan'], tags: ['caffeine', 'sweet'] },
    { id: 'lu-tonic', name: 'Coffee tonic', price: 6.0, section: 'Coffee', source: 'seed', dietary: ['vegan'], tags: ['caffeine', 'light'] },
    { id: 'lu-tart', name: 'Fruit galette slice', price: 6.5, section: 'Pastry', source: 'seed', dietary: ['veg'], tags: ['sweet', 'small'] },
  ],
  salt: [
    { id: 'sa-hummus', name: 'Whipped hummus, charred bread', price: 14.0, section: 'Small plates', source: 'seed', dietary: ['vegan'], tags: ['light', 'sharing'] },
    { id: 'sa-lamb', name: 'Braised lamb shoulder', price: 34.0, section: 'Mains', source: 'seed', dietary: ['gf'], tags: ['hearty', 'large', 'savory'] },
    { id: 'sa-cauli', name: 'Charred cauliflower, tahini', price: 22.0, section: 'Mains', source: 'seed', dietary: ['vegan', 'gf'], tags: ['hearty', 'savory', 'sharing'] },
    { id: 'sa-wine', name: 'Glass of house red', price: 14.0, section: 'Drinks', source: 'seed', dietary: [], tags: ['alcohol'] },
    { id: 'sa-baklava', name: 'Pistachio baklava', price: 10.0, section: 'Dessert', source: 'seed', dietary: ['veg'], tags: ['sweet', 'sharing'] },
  ],
  perch: [
    { id: 'pe-spritz', name: 'Rooftop spritz', price: 13.0, section: 'Cocktails', source: 'seed', dietary: [], tags: ['alcohol', 'light'] },
    { id: 'pe-flatbread', name: 'Fig & prosciutto flatbread', price: 17.0, section: 'Small plates', source: 'seed', dietary: [], tags: ['savory', 'sharing'] },
    { id: 'pe-salad', name: 'Charred corn salad', price: 13.0, section: 'Small plates', source: 'seed', dietary: ['vegan', 'gf'], tags: ['light', 'sharing'] },
  ],
  stackhouse: [
    { id: 'st-drip', name: 'Bottomless drip coffee', price: 3.0, section: 'Coffee', source: 'seed', dietary: ['vegan'], tags: ['caffeine', 'light'] },
    { id: 'st-coldbrew', name: 'Cold brew', price: 4.5, section: 'Coffee', source: 'seed', dietary: ['vegan'], tags: ['caffeine', 'light'] },
    { id: 'st-bagel', name: 'Everything bagel, cream cheese', price: 5.5, section: 'Kitchen', source: 'seed', dietary: ['veg'], tags: ['savory', 'small'] },
  ],
  moss: [
    { id: 'mo-latte', name: 'Maple oat latte', price: 5.5, section: 'Espresso', source: 'seed', dietary: ['vegan'], tags: ['caffeine', 'sweet'] },
    { id: 'mo-hotchoc', name: 'Salted hot chocolate', price: 5.0, section: 'Not coffee', source: 'seed', dietary: ['veg'], tags: ['sweet'] },
    { id: 'mo-quiche', name: 'Slice of quiche', price: 8.5, section: 'Kitchen', source: 'seed', dietary: ['veg'], tags: ['savory', 'hearty', 'small'] },
  ],
  emberline: [
    { id: 'em-oldfashioned', name: 'Smoked old fashioned', price: 14.0, section: 'Cocktails', source: 'seed', dietary: [], tags: ['alcohol'] },
    { id: 'em-lager', name: 'House lager', price: 7.0, section: 'On tap', source: 'seed', dietary: ['vegan'], tags: ['alcohol', 'light'] },
    { id: 'em-wings', name: 'Buffalo wings', price: 14.0, section: 'Snacks', source: 'seed', dietary: [], tags: ['savory', 'sharing', 'hearty'] },
    { id: 'em-fries', name: 'Truffle fries', price: 10.0, section: 'Snacks', source: 'seed', dietary: ['vegan'], tags: ['savory', 'sharing'] },
  ],
};
