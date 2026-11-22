import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import type { GroceryItem } from '../data/groceries'
import { useGroceries } from '../store/groceries'
import { formatList, groupedList } from '../utils/shoppingList'
import { Dialog, Icon, ItemArt, QuantityEditor } from './Controls'

function PdfDownload({ groups }: { groups: ReturnType<typeof groupedList> }) {
  const [file, setFile] = useState<{ groups: typeof groups; url: string } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let url = ''
    async function prepare() {
      try {
        const { createShoppingListPdf } = await import('../utils/shoppingListPdf')
        if (!active) return
        url = URL.createObjectURL(createShoppingListPdf(groups).output('blob'))
        setFile({ groups, url })
      } catch {
        if (active) setFile({ groups, url: '' })
      }
    }
    void prepare()
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [groups, attempt])

  if (file?.groups !== groups) return <Button variant="outline" disabled>Preparing PDF…</Button>
  if (!file.url) return <Button variant="outline" onClick={() => { setFile(null); setAttempt(n => n + 1) }}>Retry PDF download</Button>
  return <Button variant="outline" asChild>
    <a href={file.url} download="grocerly-shopping-list.pdf"><Icon name="download" /> Download PDF</a>
  </Button>
}

export function ShoppingList({ items }: { items: GroceryItem[] }) {
  const selected = useGroceries(s => s.selected)
  const groups = useMemo(() => groupedList(items, selected), [items, selected])
  const rows = Object.values(selected)
  const purchased = rows.filter(row => row.purchased).length
  const [remainingOnly, setRemainingOnly] = useState(false)
  const displayGroups = remainingOnly ? groups.map(group => ({
    ...group, rows: group.rows.filter(row => !row.selection.purchased),
  })).filter(group => group.rows.length) : groups
  const [confirm, setConfirm] = useState(false)
  const [manual, setManual] = useState('')
  const [feedback, setFeedback] = useState('')
  async function output(action: 'copy' | 'share') {
    const text = formatList(groups)
    setFeedback('')
    if (action === 'share' && navigator.share) {
      try { await navigator.share({ title: 'My Grocery List', text }); return }
      catch (err) { if (err instanceof Error && err.name === 'AbortError') return }
    }
    try {
      await navigator.clipboard.writeText(text)
      setFeedback(action === 'share' ? 'List copied. Paste it wherever you want to share.' : 'Grocery list copied.')
    } catch { setManual(text) }
  }
  return <section className="list-view">
    <a className="back" href="#/"><Icon name="back" size={16} /> Back to catalog</a>
    <div className="list-title"><h1>My Grocery List</h1>{rows.length > 0 && <Button variant="ghost" onClick={() => setConfirm(true)}>Clear list</Button>}</div>
    <div className="stats">{[[rows.length, 'Total items'], [purchased, 'Purchased'], [rows.length - purchased, 'Remaining']].map(([n, label]) => <div key={label}><strong>{n}</strong><span>{label}</span></div>)}</div>
    {groups.length ? <>
      <Progress className="shopping-progress" aria-label="Shopping progress" value={100 * purchased / rows.length} getValueLabel={() => purchased + ' of ' + rows.length + ' purchased'} />
      <div className="list-toolbar"><label className="remaining-toggle"><Checkbox checked={remainingOnly} onCheckedChange={v => setRemainingOnly(v === true)}/> Hide purchased</label>
      <div className="actions"><Button onClick={() => void output('copy')}><Icon name="copy" /> Copy List</Button>
        <Button variant="outline" onClick={() => void output('share')}><Icon name="share" /> Share List</Button>
        <PdfDownload groups={groups}/></div></div>
      <div role="status" className="status">{feedback}</div>
      {!displayGroups.length && <div className="empty"><Icon name="basket" size={32}/><h2>Shopping complete</h2><p>All {purchased} items are marked as purchased.</p><Button variant="outline" onClick={() => setRemainingOnly(false)}>Show purchased items</Button></div>}
      {displayGroups.map(({ category, rows }) => <section className="list-group" key={category.id}>
        <h2><span aria-hidden="true">{category.icon}</span> {category.name}</h2>
        {rows.map(({ item, selection }) => <div className={'list-row' + (selection.purchased ? ' bought' : '')} key={item.id}>
          <Checkbox aria-label={'Mark ' + item.name + ' as purchased'} checked={selection.purchased} onCheckedChange={() => useGroceries.getState().togglePurchased(item.id)} />
          <span className="mini-art"><ItemArt item={item}/></span><strong>{item.name}</strong>
          <QuantityEditor item={item} row={selection} />
          <button className="icon-button" aria-label={'Remove ' + item.name} onClick={() => useGroceries.getState().remove(item.id)}><Icon name="trash" size={17}/></button>
        </div>)}
      </section>)}
    </> : <div className="empty"><Icon name="basket" size={40}/><h2>Your grocery list is empty</h2><p>Choose a few essentials to start your list.</p><a className="primary" href="#/">Browse groceries <Icon name="arrow" /></a></div>}
    {confirm && <Dialog title="Clear your grocery list?" close={() => setConfirm(false)}><p>This removes all selected groceries. Your custom catalog items stay available.</p>
      <div className="actions"><Button autoFocus variant="outline" onClick={() => setConfirm(false)}>Keep list</Button><Button variant="destructive" onClick={() => { useGroceries.getState().clear(); setFeedback(''); setConfirm(false); setRemainingOnly(false) }}>Clear entire list</Button></div></Dialog>}
    {manual && <Dialog title="Copy your list" close={() => setManual('')}><label>Select and copy the text below.<textarea autoFocus readOnly value={manual} onFocus={e => e.target.select()}/></label></Dialog>}
  </section>
}
