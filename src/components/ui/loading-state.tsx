export function LoadingState() {
  return (
    <div className="container-xl py-5" role="status" aria-live="polite">
      <div className="d-flex align-items-center gap-3 text-secondary">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        <span>Loading your academic workspace…</span>
      </div>
    </div>
  );
}
