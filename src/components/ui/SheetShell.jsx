import { LuX } from "react-icons/lu";
import IconButton from "./IconButton";

/**
 * Presentational drawer: right-docked panel from md, bottom sheet below md. No behaviour inside
 * (no escape key, scroll lock or focus trap); callers keep their own.
 * Props: onBackdropClick(e), title (node), onClose, footer (node), children, labelledById, className.
 */
export default function SheetShell({
  onBackdropClick,
  title,
  onClose,
  footer,
  children,
  labelledById,
  className = "",
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-scrim md:items-stretch md:justify-end"
      onClick={onBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        className={`wbw-sheet-in flex max-h-[92%] w-full flex-col rounded-t-[28px] bg-raised shadow-sheet md:max-h-none md:w-[35rem] md:max-w-[90%] md:rounded-l-[28px] md:rounded-tr-none md:shadow-drawer ${className}`}
      >
        <div className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full bg-[#E5DDD0] md:hidden" />
        <div className="flex items-center justify-between gap-3 px-6 pb-3 pt-4">
          <h2 id={labelledById} className="min-w-0 flex-1 font-display text-xl font-extrabold">
            {title}
          </h2>
          {onClose && (
            <IconButton aria-label="Close" variant="soft" onClick={onClose}>
              <LuX size={18} />
            </IconButton>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-raised px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
