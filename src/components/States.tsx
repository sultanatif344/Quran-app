export function LoadingState({ text = 'لوڈ ہو رہا ہے…' }: { text?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="state__text">{text}</p>
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="state" role="alert">
      <div className="state__icon" aria-hidden="true">
        ⚠️
      </div>
      <h2 className="state__title">معاف کیجیے، مواد لوڈ نہیں ہو سکا</h2>
      <p className="state__text">
        براہِ کرم انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔
        <br />
        <span className="latin muted">Could not load. Please check your internet and try again.</span>
      </p>
      <button className="btn btn--primary btn--big" onClick={onRetry}>
        <span className="btn__icon" aria-hidden="true">
          ↻
        </span>
        دوبارہ کوشش کریں
      </button>
    </div>
  )
}
