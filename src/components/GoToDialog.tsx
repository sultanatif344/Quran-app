import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { toUrduDigits } from '../data/surahNamesUrdu'

interface Props {
  open: boolean
  title: string
  max: number
  onClose: () => void
  onGo: (n: number) => void
}

export function GoToDialog({ open, title, max, onClose, onGo }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      setValue('')
      d.showModal()
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const n = Number(value)
    if (Number.isInteger(n) && n >= 1 && n <= max) {
      onGo(n)
      onClose()
    }
  }

  return (
    <dialog ref={ref} className="goto" onClose={onClose} aria-labelledby="goto-title">
      <form onSubmit={submit}>
        <h2 id="goto-title" style={{ margin: 0, fontSize: 'calc(var(--ui-size) * 1.15)' }}>
          {title}
        </h2>
        <p className="muted" style={{ margin: '4px 0 0' }}>
          ۱ سے {toUrduDigits(max)} تک
        </p>
        <input
          className="goto__input latin"
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="نمبر"
          autoFocus
        />
        <div className="goto__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            منسوخ
          </button>
          <button type="submit" className="btn btn--primary">
            جائیں
          </button>
        </div>
      </form>
    </dialog>
  )
}
