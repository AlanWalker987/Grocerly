import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { validQuantity } from '../data/groceries'
import type { GroceryItem, GroceryUnit, SelectedGrocery } from '../data/groceries'
import { useGroceries } from '../store/groceries'

const paths = {
  basket: 'M3 10h18l-2 10H5L3 10ZM7 10l4-7m6 7-4-7M9 13v4m6-4v4',
  list: 'M9 5h11M9 12h11M9 19h11M3 5l1 1 2-3M3 12l1 1 2-3M3 19l1 1 2-3',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  plus: 'M12 5v14M5 12h14', arrow: 'M4 12h15m-6-6 6 6-6 6',
  back: 'M20 12H5m6-6-6 6 6 6', close: 'm6 6 12 12M18 6 6 18',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  copy: 'M8 8h12v13H8zM16 8V3H3v13h5',
  share: 'M8 12l9-6M8 12l9 6M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM22 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM22 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
}
export function Icon({ name, size = 19 }: { name: keyof typeof paths; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>
}

export function ItemArt({ item }: { item: GroceryItem }) {
  const photo = item.isCustom ? 'category-' + item.categoryId : item.id
  return <img src={import.meta.env.BASE_URL + 'market/' + photo + '.webp'} alt="" loading="lazy" decoding="async" />
}

export function QuantityEditor({ item, row }: { item: GroceryItem; row: SelectedGrocery }) {
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState('')
  const errorId = useId()
  const edit = useGroceries(s => s.edit)
  function update(value: string, unit: GroceryUnit) {
    const quantity = Number(value)
    if (!validQuantity(quantity, unit)) {
      setError(['kg', 'g', 'L', 'ml'].includes(unit) ? 'Enter a positive quantity.' : 'Enter a positive whole number.')
      return
    }
    setError('')
    edit(item, quantity, unit)
  }
  return <div className="quantity">
    <input type="number" min="0" step="any" aria-label={item.name + ' quantity'} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
      value={draft ?? row.quantity} onChange={e => { setDraft(e.target.value); update(e.target.value, row.unit) }}
      onBlur={() => { if (!error) setDraft(null) }} />
    <select aria-label={item.name + ' unit'} value={row.unit} onChange={e => update(draft ?? String(row.quantity), e.target.value as GroceryUnit)}>
      {item.allowedUnits.map(unit => <option key={unit}>{unit}</option>)}
    </select>
    {error && <small id={errorId} className="error">{error} Saved: {row.quantity} {row.unit}.</small>}
  </div>
}

export function Dialog({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useLayoutEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); close() }}>
    <div className="dialog-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={close}><Icon name="close" /></button></div>
    {children}
  </dialog>
}
