import { useId, useState } from 'react'
import { Apple, Bean, Carrot, CupSoda, Fish, Milk, Droplet, SprayCan, Wheat, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { categories, units, validQuantity } from '../data/groceries'
import type { GroceryItem, GroceryUnit } from '../data/groceries'
import { useGroceries } from '../store/groceries'
import { Dialog, Icon, ItemArt, QuantityEditor } from './Controls'

const categoryIcons = { vegetables: Carrot, fruits: Apple, dairy: Milk, grains: Wheat,
  pulses: Bean, spices: Flame, oils: Droplet, meat: Fish, snacks: CupSoda, household: SprayCan }

function CustomDialog({ categoryId, close, added }: { categoryId: string; close: () => void; added: (id: string) => void }) {
  const [error, setError] = useState('')
  const add = useGroceries(s => s.addCustom)
  return <Dialog title="Add Custom Item" close={close}>
    <form className="custom-form" onSubmit={e => {
      e.preventDefault()
      const data = new FormData(e.currentTarget)
      const unit = String(data.get('unit')) as GroceryUnit
      const qty = Number(data.get('quantity'))
      if (!validQuantity(qty, unit)) { setError('Enter a positive quantity. Countable units need a whole number.'); return }
      try {
        const item = add(String(data.get('name')), String(data.get('category')), qty, unit)
        added(item.categoryId)
      } catch (err) { setError(err instanceof Error ? err.message : 'Could not add this item.') }
    }}>
      <label>Grocery name<Input name="name" required autoFocus maxLength={100} placeholder="e.g. Curry leaves" /></label>
      <label>Category<select name="category" defaultValue={categoryId}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <div className="form-pair"><label>Quantity<Input name="quantity" type="number" min="0" step="any" defaultValue="1" required /></label>
      <label>Unit<select name="unit" defaultValue="pcs">{units.map(unit => <option key={unit}>{unit}</option>)}</select></label></div>
      {error && <p role="alert" className="error">{error}</p>}
      <Button type="submit">Add to My List <Icon name="plus" /></Button>
    </form>
  </Dialog>
}

function GroceryCard({ item }: { item: GroceryItem }) {
  const id = useId()
  const row = useGroceries(s => s.selected[item.id])
  const toggle = () => row ? useGroceries.getState().remove(item.id) : useGroceries.getState().select(item)
  return <article className={'card' + (row ? ' chosen' : '')}>
    <Checkbox id={id} className="product-check" aria-label={'Select ' + item.name} checked={Boolean(row)} onCheckedChange={toggle} />
    <label className="card-select" htmlFor={id}>
      <span className="product-art"><ItemArt item={item} /></span>
      <strong>{item.name}</strong>
      {!row && <span className="portion">{item.defaultQuantity} {item.defaultUnit}</span>}
    </label>
    {row && <QuantityEditor item={item} row={row} />}
  </article>
}

export function Catalog({ items, categoryId, choose, query, count }: {
  items: GroceryItem[]; categoryId: string; choose: (id: string) => void; query: string; count: number
}) {
  const [dialog, setDialog] = useState(false)
  const category = categories.find(c => c.id === categoryId)!
  const search = query.trim().toLowerCase()
  const visible = items.filter(item => search ? item.name.toLowerCase().includes(search) : item.categoryId === category.id)
  return <>
    <section className="hero">
      <div className="hero-copy"><h1>Plan Your <em>Groceries</em></h1><p>Pick your essentials and build your shopping list.</p></div>
    </section>
    <div className="catalog-layout">
      <aside className="sidebar">
        <h2><Icon name="grid" size={16} /> Categories</h2>
        <nav aria-label="Grocery categories">{categories.map(c => {
          const CategoryIcon = categoryIcons[c.id as keyof typeof categoryIcons]
          return (
          <button key={c.id} className={!search && c.id === category.id ? 'active' : ''} aria-pressed={!search && c.id === category.id} onClick={() => choose(c.id)}>
            <CategoryIcon size={17} strokeWidth={1.6} aria-hidden="true"/>{c.name}
          </button>)
        })}</nav>
      </aside>
      <section className="catalog-products">
        <div className="section-heading"><div><h2>{search ? 'Search results' : category.name}</h2>
          <p>{visible.length} {visible.length === 1 ? 'item' : 'items'} {search ? 'matching “' + query.trim() + '”' : 'in this category'}</p></div>
          <Button variant="outline" className="custom-trigger" onClick={() => setDialog(true)}><Icon name="plus" size={17} /> Add Custom Item</Button>
        </div>
        {visible.length ? <div className="product-grid">{visible.map(item =>
          <div key={item.id}>{search && <span className="result-category">{categories.find(c => c.id === item.categoryId)?.name}</span>}<GroceryCard item={item} /></div>
        )}</div> : <div className="empty"><Icon name="search" size={32} /><h3>No groceries found</h3><p>Try another name or add a custom item.</p></div>}
      </section>
    </div>
    <div className="summary"><div className="summary-inner"><span><Icon name="basket" /><strong role="status">{count} {count === 1 ? 'item' : 'items'} selected</strong></span>
      <Button asChild className="summary-action"><a href="#/list">View My Grocery List <Icon name="arrow" size={17} /></a></Button></div></div>
    {dialog && <CustomDialog categoryId={categoryId} close={() => setDialog(false)} added={id => { setDialog(false); choose(id) }} />}
  </>
}
