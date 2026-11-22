import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useGroceries } from '../store/groceries'
import { Dialog, Icon } from './Controls'

export function ClearListButton({ onClear }: { onClear?: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const empty = useGroceries(s => Object.keys(s.selected).length === 0)
  return <>
    <Button variant="outline" disabled={empty} onClick={() => setConfirm(true)}>
      <Icon name="trash" /> Clear list
    </Button>
    {confirm && <Dialog title="Clear your grocery list?" close={() => setConfirm(false)}>
      <p>This removes all selected groceries. Your custom catalog items stay available.</p>
      <div className="actions">
        <Button autoFocus variant="outline" onClick={() => setConfirm(false)}>Keep list</Button>
        <Button variant="destructive" onClick={() => {
          useGroceries.getState().clear()
          setConfirm(false)
          onClear?.()
        }}>Clear entire list</Button>
      </div>
    </Dialog>}
  </>
}
