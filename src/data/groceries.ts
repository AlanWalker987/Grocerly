export const units = [
  "kg",
  "g",
  "L",
  "ml",
  "pcs",
  "packets",
  "bunches",
  "dozens",
] as const;
export type GroceryUnit = (typeof units)[number];

export interface GroceryItem {
  id: string;
  name: string;
  categoryId: string;
  defaultQuantity: number;
  defaultUnit: GroceryUnit;
  allowedUnits: GroceryUnit[];
  isCustom?: boolean;
}
export interface SelectedGrocery {
  itemId: string;
  quantity: number;
  unit: GroceryUnit;
  purchased: boolean;
}

export const categories = [
  { id: "vegetables", name: "Vegetables", icon: "🥕" },
  { id: "fruits", name: "Fruits", icon: "🍎" },
  { id: "dairy", name: "Dairy & Eggs", icon: "🥛" },
  { id: "grains", name: "Rice, Grains & Flour", icon: "🌾" },
  { id: "pulses", name: "Pulses & Lentils", icon: "🫘" },
  { id: "spices", name: "Spices & Masalas", icon: "🌶️" },
  { id: "oils", name: "Cooking Oils & Essentials", icon: "🫙" },
  { id: "meat", name: "Meat & Seafood", icon: "🐟" },
  { id: "snacks", name: "Snacks & Beverages", icon: "☕" },
  { id: "household", name: "Household Essentials", icon: "🧴" },
];

function batch(
  categoryId: string,
  names: string[],
  defaultQuantity: number,
  ...allowedUnits: GroceryUnit[]
): GroceryItem[] {
  return names.map((name) => ({
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    categoryId,
    defaultQuantity,
    defaultUnit: allowedUnits[0],
    allowedUnits,
  }));
}

export const groceryItems: GroceryItem[] = [
  ...batch(
    "vegetables",
    ["Tomato", "Onion", "Potato", "Carrot", "Capsicum", "Brinjal"],
    1,
    "kg",
    "g",
  ),
  ...batch("vegetables", ["Cauliflower", "Broccoli"], 1, "pcs", "kg", "g"),
  ...batch("vegetables", ["Spinach"], 1, "bunches", "g"),
  ...batch("vegetables", ["Okra", "Cucumber"], 1, "kg", "g"),
  ...batch("vegetables", ["Coriander Leaves"], 1, "bunches", "g"),
  ...batch(
    "fruits",
    ["Apple", "Orange", "Mango", "Grapes", "Guava", "Pomegranate", "Papaya"],
    1,
    "kg",
    "g",
  ),
  ...batch("fruits", ["Banana"], 1, "dozens", "pcs", "kg"),
  ...batch("dairy", ["Milk", "Buttermilk"], 1, "L", "ml"),
  ...batch(
    "dairy",
    ["Paneer", "Curd", "Butter", "Cheese", "Cream"],
    200,
    "g",
    "kg",
  ),
  ...batch("dairy", ["Eggs"], 12, "pcs", "dozens"),
  ...batch(
    "grains",
    [
      "Rice",
      "Basmati Rice",
      "Wheat Flour",
      "Ragi Flour",
      "Besan",
      "Semolina",
      "Poha",
      "Millet",
    ],
    1,
    "kg",
    "g",
  ),
  ...batch(
    "pulses",
    [
      "Toor Dal",
      "Moong Dal",
      "Masoor Dal",
      "Urad Dal",
      "Chana Dal",
      "Rajma",
      "Chickpeas",
      "Green Gram",
    ],
    500,
    "g",
    "kg",
  ),
  ...batch(
    "spices",
    [
      "Cumin Seeds",
      "Mustard Seeds",
      "Turmeric Powder",
      "Chilli Powder",
      "Garam Masala",
      "Coriander Powder",
      "Black Pepper",
      "Cardamom",
    ],
    100,
    "g",
    "kg",
  ),
  ...batch(
    "oils",
    ["Sunflower Oil", "Groundnut Oil", "Coconut Oil", "Sesame Oil"],
    1,
    "L",
    "ml",
  ),
  ...batch("oils", ["Ghee", "Salt", "Sugar", "Jaggery"], 500, "g", "kg"),
  ...batch("meat", ["Chicken", "Mutton", "Fish", "Prawns"], 500, "g", "kg"),
  ...batch("snacks", ["Tea", "Coffee", "Peanuts"], 250, "g", "kg"),
  ...batch(
    "snacks",
    ["Biscuits", "Namkeen", "Makhana", "Potato Chips", "Rusk"],
    1,
    "packets",
    "g",
  ),
  ...batch(
    "household",
    ["Dish Soap", "Floor Cleaner", "Hand Wash"],
    500,
    "ml",
    "L",
  ),
  ...batch("household", ["Laundry Powder"], 1, "kg", "g"),
  ...batch(
    "household",
    ["Tissues", "Garbage Bags", "Scrub Pads"],
    1,
    "packets",
  ),
  ...batch("household", ["Bath Soap"], 1, "pcs", "packets"),
];

export function validQuantity(value: number, unit: GroceryUnit) {
  return (
    Number.isFinite(value) &&
    value > 0 &&
    (["kg", "g", "L", "ml"].includes(unit) || Number.isSafeInteger(value))
  );
}
export const cleanName = (name: string) => name.trim().replace(/\s+/g, " ");

export function customUnits(unit: GroceryUnit): GroceryUnit[] {
  if (unit === "kg" || unit === "g") return ["kg", "g"];
  if (unit === "L" || unit === "ml") return ["L", "ml"];
  return unit === "pcs" || unit === "dozens" ? ["pcs", "dozens"] : [unit];
}
