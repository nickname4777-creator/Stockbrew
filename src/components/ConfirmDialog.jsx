import { useEffect } from 'react'
import { Minus, Check } from 'lucide-react'

// Icon + title + short text + a small checklist (− bad / ✓ fine), optional extra content, Cancel / Confirm.
// tone: 'ok' (green) | 'warn' (amber) | 'danger' (red) sets the icon colour and the confirm button.
export default function ConfirmDialog({
  icon, tone = 'ok', title, text, items = [], children, error,
  confirmLabel, disabled, onConfirm, onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal confirm" role="dialog" aria-modal="true" aria-label={title}>
        <div className={`confirm__icon confirm__icon--${tone}`}>{icon}</div>
        <h2 className="confirm__title">{title}</h2>
        {text && <p className="confirm__text">{text}</p>}
        {items.length > 0 && (
          <ul className="confirm__list">
            {items.map((it) => (
              <li key={it.text}>
                {it.sign === 'minus' ? <Minus size={14} className="neg" /> : <Check size={14} className="pos" />}
                {it.text}
              </li>
            ))}
          </ul>
        )}
        {children}
        {error && <div className="banner banner--err">{error}</div>}
        <div className="actions">
          <button className="btn btn--ghost" onClick={onCancel}>{onConfirm ? 'Cancel' : 'Close'}</button>
          {onConfirm && (
            <button className={`btn confirm__go confirm__go--${tone}`} disabled={disabled} onClick={onConfirm}>{confirmLabel}</button>
          )}
        </div>
      </div>
    </div>
  )
}
