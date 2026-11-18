import React from "react";

function ReactionTooltip({ emoji, label, summary, othersCount = 0, onClickOthers }) {
  if (!emoji || !label) return null;

  const hasOthersLink = typeof onClickOthers === "function" && othersCount > 0;

  return (
    <div role="tooltip" className="absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
      <div className="relative w-[150px] rounded-[14px] bg-raised px-3 py-2 text-xs text-ink shadow-raised">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-semibold">{label}</span>
        </div>
        {summary && (
          <div className="text-[11px] leading-snug text-muted">
            {hasOthersLink ? (
              <>
                <span>{summary}, and </span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClickOthers();
                  }}
                  className="font-semibold text-selected-text hover:underline"
                >
                  {othersCount === 1 ? "1 other" : `${othersCount} others`}
                </button>
              </>
            ) : (
              <span>{summary}</span>
            )}
          </div>
        )}
        <div className="pointer-events-none absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-raised" />
      </div>
    </div>
  );
}

export default ReactionTooltip;
