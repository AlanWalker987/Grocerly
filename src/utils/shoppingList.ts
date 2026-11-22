import { categories } from '../data/groceries'
import type { GroceryItem, SelectedGrocery } from '../data/groceries'

export function groupedList(items: GroceryItem[], selected: Record<string, SelectedGrocery>) {
  return categories.map(category => ({
    category,
    rows: items.filter(item => item.categoryId === category.id && selected[item.id])
      .map(item => ({ item, selection: selected[item.id] })),
  })).filter(group => group.rows.length > 0)
}

export function formatList(groups: ReturnType<typeof groupedList>) {
  const rows = groups.flatMap(group => group.rows)
  const purchased = rows.filter(row => row.selection.purchased).length
  return [
    'MY GROCERY LIST',
    ...groups.map(({ category, rows }) => [category.name.toUpperCase(),
      ...rows.map(({ item, selection: s }) => `${s.purchased ? '☑' : '☐'} ${item.name} - ${s.quantity} ${s.unit}`),
    ].join('\n')),
    `Total Items: ${rows.length}\nPurchased: ${purchased}\nRemaining: ${rows.length - purchased}`,
  ].join('\n\n')
}
