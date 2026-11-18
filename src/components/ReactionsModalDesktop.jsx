import React, { useState, useEffect, useMemo } from "react";
import { FiSmile } from "react-icons/fi";
import AssigneeAvatar from "./AssigneeAvatar";

const ALL_FILTER = "__all__";

function ReactionsModalDesktop({
  isOpen,
  onClose,
  reactionEntries,
  reactionRows,
  currentUserId,
  onToggleReaction,
  initialEmoji,
  onOpenEmojiPicker,
}) {
  const [activeFilter, setActiveFilter] = useState(ALL_FILTER);

  useEffect(() => {
    if (!isOpen) {
      setActiveFilter(ALL_FILTER);
    } else if (initialEmoji && initialEmoji !== ALL_FILTER) {
      setActiveFilter(initialEmoji);
    } else {
      setActiveFilter(ALL_FILTER);
    }
  }, [isOpen, initialEmoji]);

  const totalReactions = reactionRows.length;

  const baseTabClass =
    "flex h-8 items-center gap-2 rounded-full px-3 text-xs font-semibold whitespace-nowrap transition-colors";

  const rowsToShow = useMemo(() => {
    if (activeFilter === ALL_FILTER) return reactionRows;
    return reactionRows.filter((row) => row.emoji === activeFilter);
  }, [activeFilter, reactionRows]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Reactions"
    >
      <div
        className="absolute inset-0 bg-scrim"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-xs rounded-dialog bg-raised px-4 pb-4 pt-4 shadow-dialog sm:max-w-sm">
        <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              if (!onOpenEmojiPicker) return;
              onOpenEmojiPicker();
            }}
            disabled={!onOpenEmojiPicker}
            aria-label="Add reaction"
            className={`${baseTabClass} bg-surface2 text-ink hover:bg-surface3 disabled:cursor-default disabled:opacity-60`}
          >
            <FiSmile className="text-base" />
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter(ALL_FILTER)}
            className={`${baseTabClass} ${
              activeFilter === ALL_FILTER
                ? "bg-selected text-white"
                : "bg-surface2 text-ink hover:bg-surface3"
            }`}
          >
            <span>All {totalReactions}</span>
          </button>

          {reactionEntries.map(([emoji, info]) => {
            const count = info?.count ?? 0;
            if (count <= 0) return null;

            const isActive = activeFilter === emoji;

            return (
              <button
                key={emoji}
                type="button"
                onClick={() => setActiveFilter(emoji)}
                className={`${baseTabClass} ${
                  isActive
                    ? "bg-selected text-white"
                    : "bg-surface2 text-ink hover:bg-surface3"
                }`}
              >
                <span className="text-base">{emoji}</span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="max-h-64 divide-y divide-line overflow-y-auto">
          {rowsToShow.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted">
              No reactions yet.
            </div>
          ) : (
            rowsToShow.map((row) => {
              const { key, emoji, userId, user } = row;
              const isCurrentUser = !!currentUserId && userId === currentUserId;
              const baseName =
                user?.name || user?.displayName || user?.email || "Unknown guest";
              const displayName = isCurrentUser ? "You" : baseName;

              const handleClick = (event) => {
                event.stopPropagation();
                if (!isCurrentUser || !onToggleReaction) return;
                onToggleReaction(emoji);
              };

              return (
                <button
                  key={key}
                  type="button"
                  onClick={handleClick}
                  className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left hover:bg-surface2 disabled:cursor-default disabled:bg-transparent"
                  disabled={!isCurrentUser}
                >
                  <div className="flex items-center gap-3">
                    <AssigneeAvatar
                      assigneeId={userId}
                      displayName={displayName}
                      size={28}
                      showName={false}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-ink">
                        {displayName}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[11px] text-muted">
                          Click to remove
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-lg">{emoji}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ReactionsModalDesktop;
