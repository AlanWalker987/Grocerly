import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import type { GroceryItem } from '../data/groceries'
import { useGroceries } from '../store/groceries'
import { formatList, groupedList } from '../utils/shoppingList'
import { Dialog, Icon, ItemArt, QuantityEditor } from './Controls'
import { ClearListButton } from './ClearListButton'

function PdfActions({ groups }: { groups: ReturnType<typeof groupedList> }) {
  const [prepared, setPrepared] = useState<{ groups: typeof groups; pdf: { file: File; url: string } | null } | null>(null)
  const [showDownload, setShowDownload] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let url = ''
    async function prepare() {
      try {
        const { createShoppingListPdf } = await import('../utils/shoppingListPdf')
        if (!active) return
        const blob = createShoppingListPdf(groups).output('blob')
        const file = new File([blob], 'grocerly-shopping-list.pdf', { type: 'application/pdf' })
        url = URL.createObjectURL(file)
        setPrepared({ groups, pdf: { file, url } })
      } catch {
        if (active) setPrepared({ groups, pdf: null })
      }
    }
    void prepare()
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [groups, attempt])

  if (prepared?.groups !== groups) return <Button variant="outline" disabled>Preparing PDF…</Button>
  if (!prepared.pdf) return <Button variant="outline" onClick={() => { setPrepared(null); setAttempt(n => n + 1) }}>Retry PDF</Button>
  const { file, url } = prepared.pdf
  async function sharePdf() {
    const data = { files: [file] }
    try {
      if (navigator.share && navigator.canShare?.(data)) {
        await navigator.share(data)
        return
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
    }
    setShowDownload(true)
  }
  const download = <Button variant="outline" asChild>
    <a href={url} download={file.name}><Icon name="download" /> Download PDF</a>
  </Button>
  return <>
    <Button variant="outline" title="Share your list as a PDF" onClick={() => void sharePdf()}><Icon name="share" /> Share List</Button>
    {download}
    {showDownload && <Dialog title="Share your grocery list" close={() => setShowDownload(false)}>
      <p>Download the PDF, then attach it to your conversation as a document.</p>
      {download}
    </Dialog>}
  </>
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
  const [manual, setManual] = useState('')
  const [feedback, setFeedback] = useState('')
  async function copyList() {
    const text = formatList(groups)
    setFeedback('')
    try {
      await navigator.clipboard.writeText(text)
      setFeedback('Grocery list copied.')
    } catch { setManual(text) }
  }
  return <section className="list-view">
    <a className="back" href="#/"><Icon name="back" size={16} /> Back to catalog</a>
    <div className="list-title"><h1>My Grocery List</h1><ClearListButton onClear={() => { setFeedback(''); setRemainingOnly(false) }}/></div>
    <div className="stats">{[[rows.length, 'Total items'], [purchased, 'Purchased'], [rows.length - purchased, 'Remaining']].map(([n, label]) => <div key={label}><strong>{n}</strong><span>{label}</span></div>)}</div>
    {groups.length ? <>
      <Progress className="shopping-progress" aria-label="Shopping progress" value={100 * purchased / rows.length} getValueLabel={() => purchased + ' of ' + rows.length + ' purchased'} />
      <div className="list-toolbar"><label className="remaining-toggle"><Checkbox checked={remainingOnly} onCheckedChange={v => setRemainingOnly(v === true)}/> Hide purchased</label>
      <div className="actions"><Button onClick={() => void copyList()}><Icon name="copy" /> Copy List</Button>
        <PdfActions groups={groups}/></div></div>
      <div role="status" className="status">{feedback}</div>
      {!displayGroups.length && <div className="empty"><Icon name="basket" size={32}/><h2>Shopping complete</h2><p>All {purchased} items are marked as purchased.</p><Button variant="outline" onClick={() => setRemainingOnly(false)}>Show purchased items</Button></div>}
      {displayGroups.map(({ category, rows }) => <section className="list-group" key={category.id}>
        <h2><span aria-hidden="true">{category.icon}</span> {category.name}</h2>
        {rows.map(({ item, selection }) => <div className={'list-row' + (selection.purchased ? ' bought' : '')} key={item.id}>
          <Checkbox aria-label={'Mark ' + item.name + ' as purchased'} checked={selection.purchased} onCheckedChange={() => useGroceries.getState().togglePurchased(item.id)} />
          <span className="mini-art"><ItemArt item={item}/></span><strong>{item.name}</strong>
          <QuantityEditor item={item} row={selection} />
          <button className="icon-button" aria-label={'Remove ' + item.name + ' from list'} title="Remove from list" onClick={() => useGroceries.getState().remove(item.id)}><Icon name="close" size={17}/></button>
        </div>)}
      </section>)}
    </> : <div className="empty"><Icon name="basket" size={40}/><h2>Your grocery list is empty</h2><p>Choose a few essentials to start your list.</p><a className="primary" href="#/">Browse groceries <Icon name="arrow" /></a></div>}
    {manual && <Dialog title="Copy your list" close={() => setManual('')}><label>Select and copy the text below.<textarea autoFocus readOnly value={manual} onFocus={e => e.target.select()}/></label></Dialog>}
  </section>
}
