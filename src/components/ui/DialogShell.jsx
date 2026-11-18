/**
 * Presentational centred dialog. No behaviour inside.
 * Props: onBackdropClick(e), title, description, children, actions (footer node), labelledById,
 * zIndexClass (default "z-50"), className, plus any extra props on the panel (e.g. aria-busy).
 */
export default function DialogShell({
  onBackdropClick,
  title,
  description,
  children,
  actions,
  labelledById = "wbw-dialog-title",
  zIndexClass = "z-50",
  className = "",
  ...rest
}) {
  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-scrim px-4`}
      onClick={onBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        className={`wbw-dialog-in w-full max-w-md rounded-dialog bg-raised p-6 shadow-dialog ${className}`}
        {...rest}
      >
        <h2 id={labelledById} className="text-xl">
          {title}
        </h2>
        {description && <div className="mt-3 text-sm text-muted">{description}</div>}
        {children}
        {actions && <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>}
      </div>
    </div>
  );
}
