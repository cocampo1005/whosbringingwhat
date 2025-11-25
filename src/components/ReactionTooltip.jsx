import React from "react";

function ReactionTooltip({ emoji, label, summary, othersCount = 0, onClickOthers }) {
  if (!emoji || !label) return null;

  const hasOthersLink = typeof onClickOthers === "function" && othersCount > 0;

  return (
    <div className="absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2">
      <div className="relative w-[150px] rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="font-semibold">{label}</span>
        </div>
        {summary && (
          <div className="text-[11px] leading-snug text-gray-700">
            {hasOthersLink ? (
              <>
                <span>{summary}, and </span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClickOthers();
                  }}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {othersCount === 1 ? "1 other" : `${othersCount} others`}
                </button>
              </>
            ) : (
              <span>{summary}</span>
            )}
          </div>
        )}
        <div className="pointer-events-none absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-gray-200 bg-white" />
      </div>
    </div>
  );
}

export default ReactionTooltip;
