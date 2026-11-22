import { create } from "zustand";
import {
  categories,
  cleanName,
  customUnits,
  groceryItems,
  units,
  validQuantity,
} from "../data/groceries";
import type {
  GroceryItem,
  GroceryUnit,
  SelectedGrocery,
} from "../data/groceries";

type Selections = Record<string, SelectedGrocery>;

interface Basket {
  userName: string;
  selected: Selections;
  custom: GroceryItem[];
}

interface Store extends Basket {
  storageError: boolean;
  setUserName: (name: string) => void;
  deleteCustom: (id: string) => void;
  select: (item: GroceryItem) => void;
  remove: (id: string) => void;
  edit: (item: GroceryItem, quantity: number, unit: GroceryUnit) => void;
  togglePurchased: (id: string) => void;
  clear: () => void;
  addCustom: (
    name: string,
    categoryId: string,
    quantity: number,
    unit: GroceryUnit,
  ) => GroceryItem;
}

const key = "grocerly.basket.v1";
const previousFishIds = new Set(["rohu", "pomfret", "sardines", "surmai"]);
const empty = (): Basket => ({ userName: "", selected: {}, custom: [] });
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isUnit = (value: unknown): value is GroceryUnit =>
  units.some((unit) => unit === value);
const knownCategory = (id: unknown) =>
  categories.some((category) => category.id === id);

function restore(raw: string | null): Basket {
  const basket = empty();
  if (!raw) return basket;
  const data: unknown = JSON.parse(raw);
  if (!isRecord(data) || data.version !== 1) return basket;
  if (typeof data.userName === "string")
    basket.userName = cleanName(data.userName);

  const catalog = new Map(groceryItems.map((item) => [item.id, item]));
  // A saved custom item may predate a built-in item with the same name.
  const customNames = new Set<string>();

  for (const entry of Array.isArray(data.custom)
    ? (data.custom as unknown[])
    : []) {
    if (!isRecord(entry)) continue;
    const { id, name, categoryId, defaultQuantity, defaultUnit } = entry;
    if (
      typeof id !== "string" ||
      !id.startsWith("custom-") ||
      catalog.has(id) ||
      typeof name !== "string" ||
      !cleanName(name) ||
      customNames.has(cleanName(name).toLowerCase()) ||
      typeof categoryId !== "string" ||
      !knownCategory(categoryId) ||
      !isUnit(defaultUnit) ||
      typeof defaultQuantity !== "number" ||
      !validQuantity(defaultQuantity, defaultUnit)
    )
      continue;

    const item = {
      id,
      name: cleanName(name),
      categoryId,
      defaultQuantity,
      defaultUnit,
      allowedUnits: customUnits(defaultUnit),
      isCustom: true,
    };
    catalog.set(id, item);
    customNames.add(item.name.toLowerCase());
    basket.custom.push(item);
  }

  for (const entry of Object.values(
    isRecord(data.selected) ? data.selected : {},
  )) {
    if (!isRecord(entry) || typeof entry.itemId !== "string") continue;
    const item = catalog.get(
      previousFishIds.has(entry.itemId) ? "fish" : entry.itemId,
    );
    if (
      !item ||
      !isUnit(entry.unit) ||
      !item.allowedUnits.includes(entry.unit) ||
      typeof entry.quantity !== "number" ||
      !validQuantity(entry.quantity, entry.unit)
    )
      continue;
    const existing = basket.selected[item.id];
    if (item.id === "fish" && existing) {
      const unit = existing.unit === entry.unit ? existing.unit : "g";
      const total =
        existing.quantity * (existing.unit === unit ? 1 : 1000) +
        entry.quantity * (entry.unit === unit ? 1 : 1000);
      if (validQuantity(total, unit)) {
        basket.selected.fish = {
          itemId: "fish",
          unit,
          quantity: total,
          purchased: existing.purchased && entry.purchased === true,
        };
      }
    } else {
      basket.selected[item.id] = {
        itemId: item.id,
        unit: entry.unit,
        quantity: entry.quantity,
        purchased: entry.purchased === true,
      };
    }
  }

  return basket;
}

function initialState() {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return { ...empty(), storageError: true };
  }
  try {
    return { ...restore(raw), storageError: false };
  } catch {
    return { ...empty(), storageError: false };
  }
}

function selection(item: GroceryItem): SelectedGrocery {
  return {
    itemId: item.id,
    quantity: item.defaultQuantity,
    unit: item.defaultUnit,
    purchased: false,
  };
}

export const useGroceries = create<Store>((set, get) => {
  function save(changes: Partial<Basket>) {
    const { userName, custom, selected } = { ...get(), ...changes };
    let storageError = false;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, userName, custom, selected }),
      );
    } catch {
      storageError = true;
    }
    set({ userName, custom, selected, storageError });
  }

  return {
    ...initialState(),

    setUserName(rawName) {
      const userName = cleanName(rawName);
      if (userName) save({ userName });
    },

    deleteCustom(id) {
      const { custom, selected } = get();
      if (!custom.some((item) => item.id === id)) return;
      const nextSelected = { ...selected };
      delete nextSelected[id];
      save({
        custom: custom.filter((item) => item.id !== id),
        selected: nextSelected,
      });
    },

    select(item) {
      if (!get().selected[item.id])
        save({ selected: { ...get().selected, [item.id]: selection(item) } });
    },

    remove(id) {
      const selected = { ...get().selected };
      delete selected[id];
      save({ selected });
    },

    edit(item, quantity, unit) {
      const row = get().selected[item.id];
      if (
        row &&
        item.allowedUnits.includes(unit) &&
        validQuantity(quantity, unit)
      ) {
        save({
          selected: {
            ...get().selected,
            [item.id]: { ...row, quantity, unit },
          },
        });
      }
    },

    togglePurchased(id) {
      const row = get().selected[id];
      if (row)
        save({
          selected: {
            ...get().selected,
            [id]: { ...row, purchased: !row.purchased },
          },
        });
    },

    clear() {
      save({ selected: {} });
    },

    addCustom(rawName, categoryId, quantity, unit) {
      const name = cleanName(rawName);
      if (
        !name ||
        !knownCategory(categoryId) ||
        !isUnit(unit) ||
        !validQuantity(quantity, unit)
      )
        throw new Error("Enter an item name, category, and valid quantity.");
      if (
        [...groceryItems, ...get().custom].some(
          (item) => item.name.toLowerCase() === name.toLowerCase(),
        )
      )
        throw new Error("An item with that name is already in the catalog.");
      const item: GroceryItem = {
        id: "custom-" + crypto.randomUUID(),
        name,
        categoryId,
        defaultQuantity: quantity,
        defaultUnit: unit,
        allowedUnits: customUnits(unit),
        isCustom: true,
      };
      save({
        custom: [...get().custom, item],
        selected: { ...get().selected, [item.id]: selection(item) },
      });
      return item;
    },
  };
});
