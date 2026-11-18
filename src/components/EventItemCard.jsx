import React, { useState, useEffect, useRef, memo } from "react";
import {
  LuChevronDown,
  LuChevronRight,
  LuPencil,
  LuSmile,
  LuTrash2,
} from "react-icons/lu";
import { Chip } from "./ui";
import AssigneeAvatar from "./AssigneeAvatar";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useAuth } from "../contexts/AuthContext";
import { useUsers } from "../contexts/UsersContext";
import ReactionTooltip from "./ReactionTooltip";
import ReactionsModalMobile from "./ReactionsModal";
import ReactionsModalDesktop from "./ReactionsModalDesktop";

function EventItemCard({
  item,
  dietaryIcons = {},
  canManage,
  open,
  onToggleOpen,
  onEditItem,
  onDeleteItem,
  onToggleReaction,
}) {
  const [showQuickBar, setShowQuickBar] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [showAllReactions, setShowAllReactions] = useState(false);
  const [initialEmojiFilter, setInitialEmojiFilter] = useState(null);
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [canHover, setCanHover] = useState(true);
  const longPressTimerRef = useRef(null);
  const longPressEmojiRef = useRef(null);
  const suppressClickRef = useRef(false);
  const isTouchInteractionRef = useRef(false);
  const LONG_PRESS_MS = 1100;

  const quickBarRef = useRef(null);
  const reactionButtonRef = useRef(null);
  const hideTooltipTimeoutRef = useRef(null);

  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏", "‼️"];

  const displayName = item.onBehalfOfName || item.assignee;
  const assigneeIdForAvatar = item.isOnBehalfOf ? null : item.assigneeId;

  const reactionEntries = Object.entries(item.reactions || {})
    .filter(([, info]) => (info?.count ?? 0) > 0)
    .sort(([emojiA, infoA], [emojiB, infoB]) => {
      const aOrder =
        typeof infoA?.order === "number" ? infoA.order : 0;
      const bOrder =
        typeof infoB?.order === "number" ? infoB.order : 0;

      if (aOrder !== bOrder) return aOrder - bOrder;
      return (emojiA || "").localeCompare(emojiB || "");
    });

  const MAX_VISIBLE_REACTIONS = 7;
  const visibleReactions = reactionEntries.slice(0, MAX_VISIBLE_REACTIONS);
  const hiddenReactionsCount = reactionEntries.length - visibleReactions.length;

  const hasReactions = reactionEntries.length > 0;
  const hasManyReactions = reactionEntries.length > 4;

  const { currentUser } = useAuth() || {};
  const currentUserId = currentUser?.uid || null;

  // Collect all unique userIds that have reacted on this item
  const allReactionUserIds = [];
  reactionEntries.forEach(([, info]) => {
    const ids = Array.isArray(info?.userIds) ? info.userIds : [];
    ids.forEach((id) => {
      if (id && !allReactionUserIds.includes(id)) {
        allReactionUserIds.push(id);
      }
    });
  });

  const { users: reactionUsers = [], status: reactionUsersStatus } =
    useUsers(allReactionUserIds);

  const reactionUserById = {};
  allReactionUserIds.forEach((id, index) => {
    const user = reactionUsers[index];
    if (user) {
      reactionUserById[id] = user;
    }
  });

  const reactionRows = [];
  reactionEntries.forEach(([emoji, info]) => {
    const userIds = Array.isArray(info?.userIds)
      ? info.userIds.filter(Boolean)
      : [];

    userIds.forEach((userId) => {
      reactionRows.push({
        key: `${emoji}-${userId}`,
        emoji,
        userId,
        user: reactionUserById[userId] || null,
      });
    });
  });

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressEmojiRef.current = null;
  };

  const clearHideTooltipTimeout = () => {
    if (hideTooltipTimeoutRef.current) {
      clearTimeout(hideTooltipTimeoutRef.current);
      hideTooltipTimeoutRef.current = null;
    }
  };

  const openReactionsModalForEmoji = (emoji) => {
    setInitialEmojiFilter(emoji || null);
    setShowAllReactions(true);
    setHoveredEmoji(null);
  };

  const handleReactionPointerDown = (event, emoji) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      isTouchInteractionRef.current = true;
      // If tooltip already open for this emoji, treat as a close tap.
      if (hoveredEmoji === emoji) {
        setHoveredEmoji(null);
        clearLongPressTimer();
        suppressClickRef.current = true;
        return;
      }

      clearLongPressTimer();
      longPressEmojiRef.current = emoji;
      longPressTimerRef.current = setTimeout(() => {
        openReactionsModalForEmoji(emoji);
        suppressClickRef.current = true; // prevent toggle on long-press
        longPressTimerRef.current = null;
      }, LONG_PRESS_MS);
    } else if (event.pointerType === "mouse") {
      // Desktop mouse interaction; allow hover to control tooltip.
      isTouchInteractionRef.current = false;
    }
  };

  const handleReactionPointerUp = (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      // If timer is still running, this was a tap: allow click to toggle.
      if (longPressTimerRef.current) {
        clearLongPressTimer();
        suppressClickRef.current = false;
      }
    }
  };

  const handleReactionPointerLeave = (event) => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      clearLongPressTimer();
    }
  };

  const handleToggleReaction = (emoji) => {
    if (!emoji || !item?.id || !onToggleReaction) return;
    onToggleReaction(item.id, emoji);
  };

  const handleChevronClick = (e) => {
    e.stopPropagation();
    onToggleOpen?.();
  };

  const handleOpenQuickBar = (e) => {
    e.stopPropagation();
    setShowQuickBar((prev) => !prev);
    setShowFullPicker(false);
  };

  const handleOpenFullPicker = (e) => {
    e.stopPropagation();
    setShowFullPicker(true);
  };

  const handleCloseFullPicker = () => {
    setShowFullPicker(false);
    setShowQuickBar(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      try {
        const mq = window.matchMedia("(hover: hover)");
        setCanHover(mq.matches);
      } catch {
        setCanHover(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!showQuickBar) return;

    const handleOutsideClick = (event) => {
      const barEl = quickBarRef.current;
      const buttonEl = reactionButtonRef.current;

      if (!barEl && !buttonEl) return;

      const clickedInsideBar = barEl?.contains(event.target);
      const clickedOnButton = buttonEl?.contains(event.target);

      if (!clickedInsideBar && !clickedOnButton) {
        setShowQuickBar(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [showQuickBar]);

  const actionBtn =
    "flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-ink transition-colors hover:bg-surface3";
  // Actions are always shown in the expanded card; collapsed cards reveal them on hover/focus.
  const actionsVisible = open || showQuickBar;

  return (
    <div
      className={`group relative rounded-2xl bg-raised p-3 shadow-soft ${
        hasManyReactions ? "mb-12" : hasReactions ? "mb-4" : ""
      }`}
    >
      {/* Header: title left, chevron right */}
      <div className="flex items-start justify-between gap-2">
        <h4
          className={`${open ? "" : "line-clamp-2"} font-sans text-sm font-semibold normal-case leading-snug text-ink [font-stretch:100%]`}
        >
          {item.title}
        </h4>
        <button
          type="button"
          onClick={handleChevronClick}
          className="-mr-1 -mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface2"
          aria-label={open ? "Collapse item" : "Expand item"}
        >
          {open ? (
            <LuChevronDown aria-hidden="true" className="text-lg" />
          ) : (
            <LuChevronRight aria-hidden="true" className="text-lg" />
          )}
        </button>
      </div>

      {/* Assignee */}
      {displayName && (
        <div className="mt-1.5 flex items-center gap-2 text-[13px] text-muted">
          <AssigneeAvatar
            assigneeId={assigneeIdForAvatar}
            displayName={displayName}
            size={22}
          />
        </div>
      )}

      {/* Dietary tags */}
      {item.dietary && item.dietary.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.dietary.map((restriction, i) => {
            const d = dietaryIcons[restriction?.toLowerCase?.()];
            return d ? (
              <Chip
                key={i}
                title={restriction}
                role="img"
                aria-label={restriction}
                className="!gap-1 !px-2 !py-0.5"
              >
                <span className={`flex items-center text-sm ${d.color}`}>
                  {d.icon}
                </span>
              </Chip>
            ) : null;
          })}
        </div>
      )}

      {/* Expanded body */}
      {open && (item.description || item.imageUrl || item.servings) && (
        <div className="mt-3 border-t border-line pt-3">
          {item.description && (
            <div className="mb-3">
              <h5 className="mb-1 font-sans text-xs font-semibold normal-case text-muted [font-stretch:100%]">
                Description:
              </h5>
              <p className="text-[13px] leading-relaxed text-ink">
                {item.description}
              </p>
            </div>
          )}

          {item.imageUrl && (
            <div className="mb-3">
              <h5 className="mb-1 font-sans text-xs font-semibold normal-case text-muted [font-stretch:100%]">
                Photo:
              </h5>
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-32 w-32 rounded-xl object-cover"
              />
            </div>
          )}

          {item.servings && (
            <p className="text-[13px] text-muted">
              <span className="font-semibold">Servings:</span> {item.servings}
            </p>
          )}
        </div>
      )}

      {/* Actions: reaction, edit, delete */}
      <div
        className={`relative mt-3 gap-2 ${
          actionsVisible
            ? "flex"
            : "hidden group-focus-within:flex group-hover:flex"
        }`}
      >
        {/* Quick reactions bar */}
        {showQuickBar && (
          <div
            ref={quickBarRef}
            className="absolute bottom-full left-0 right-0 z-30 mb-2 flex flex-wrap items-center justify-center gap-0.5 rounded-[18px] bg-ink px-2 py-1.5 text-white shadow-raised"
          >
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleReaction(emoji);
                  setShowQuickBar(false);
                }}
                className="rounded-full px-1 text-xl hover:bg-white/15"
              >
                {emoji}
              </button>
            ))}

            <button
              type="button"
              onClick={handleOpenFullPicker}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              +
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleOpenQuickBar}
          ref={reactionButtonRef}
          className={actionBtn}
          aria-label="Add reaction"
        >
          <LuSmile aria-hidden="true" />
        </button>

        {canManage && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditItem?.(item);
              }}
              className={actionBtn}
              aria-label="Edit item"
            >
              <LuPencil aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem?.(item);
              }}
              className={`${actionBtn} !text-danger`}
              aria-label="Delete item"
            >
              <LuTrash2 aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {showAllReactions && (
        canHover ? (
          <ReactionsModalDesktop
            isOpen={showAllReactions}
            onClose={() => {
              setShowAllReactions(false);
              setInitialEmojiFilter(null);
            }}
            reactionEntries={reactionEntries}
            reactionRows={reactionRows}
            currentUserId={currentUserId}
            onToggleReaction={handleToggleReaction}
            initialEmoji={initialEmojiFilter}
            onOpenEmojiPicker={() => {
              setShowAllReactions(false);
              setInitialEmojiFilter(null);
              setShowFullPicker(true);
              setShowQuickBar(false);
            }}
          />
        ) : (
          <ReactionsModalMobile
            isOpen={showAllReactions}
            onClose={() => {
              setShowAllReactions(false);
              setInitialEmojiFilter(null);
            }}
            reactionEntries={reactionEntries}
            reactionRows={reactionRows}
            currentUserId={currentUserId}
            onToggleReaction={handleToggleReaction}
            initialEmoji={initialEmojiFilter}
            onOpenEmojiPicker={() => {
              setShowAllReactions(false);
              setInitialEmojiFilter(null);
              setShowFullPicker(true);
              setShowQuickBar(false);
            }}
          />
        )
      )}

      {/* Reactions chip cluster anchored near bottom border */}
      {reactionEntries.length > 0 && (
        <div
          className="pointer-events-auto absolute left-4 top-full -translate-y-4 z-0 flex flex-wrap gap-1"
        >
          {visibleReactions.map(([emoji, info]) => {
            const userIds = Array.isArray(info?.userIds)
              ? info.userIds.filter(Boolean)
              : [];

            const emojiUsers = userIds
              .map((id) => reactionUserById[id])
              .filter(Boolean);

            const names = emojiUsers.map((u) => {
              if (currentUserId && u.id === currentUserId) return "You";
              return (
                u.name ||
                u.displayName ||
                u.email ||
                "Unknown guest"
              );
            });

            const total =
              names.length > 0
                ? names.length
                : info?.count ?? userIds.length ?? 0;

            let summary = "";
            let othersCountForTooltip = 0;
            if (reactionUsersStatus === "loading" && userIds.length > 0) {
              summary = "Loading names...";
            } else if (names.length > 0) {
              if (names.length <= 3) {
                if (names.length === 1) {
                  summary = names[0];
                } else if (names.length === 2) {
                  summary = `${names[0]} and ${names[1]}`;
                } else {
                  summary = `${names[0]}, ${names[1]} and ${names[2]}`;
                }
              } else {
                const primary = names.slice(0, 3);
                othersCountForTooltip = names.length - primary.length;
                summary = `${primary[0]}, ${primary[1]}, ${primary[2]}`;
              }
            }

            const reactionsLabel =
              total === 1 ? "1 reaction" : `${total} reactions`;
            const isHovered = hoveredEmoji === emoji;
            const isMine = !!currentUserId && userIds.includes(currentUserId);

            return (
              <div
                key={emoji}
                className="relative"
                onMouseEnter={() => {
                  if (!canHover) return;
                  clearHideTooltipTimeout();
                  setHoveredEmoji(emoji);
                }}
                onMouseLeave={() => {
                  if (!canHover) return;
                  clearHideTooltipTimeout();
                  hideTooltipTimeoutRef.current = setTimeout(() => {
                    setHoveredEmoji((prev) => (prev === emoji ? null : prev));
                  }, 120);
                }}
                onFocus={() => {
                  if (!canHover) return;
                  setHoveredEmoji(emoji);
                }}
                onBlur={() =>
                  setHoveredEmoji((prev) => (prev === emoji ? null : prev))
                }
                onPointerDown={(event) => handleReactionPointerDown(event, emoji)}
                onPointerUp={handleReactionPointerUp}
                onPointerLeave={handleReactionPointerLeave}
                onPointerCancel={handleReactionPointerLeave}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    handleToggleReaction(emoji);
                  }}
                  className={`flex h-[26px] items-center gap-1 rounded-full px-2 text-xs shadow-chip transition-colors ${
                    isMine
                      ? "bg-selected-soft ring-1 ring-inset ring-selected hover:bg-selected-soft"
                      : "bg-raised hover:bg-surface2"
                  }`}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  <span className="font-semibold text-ink">{info?.count ?? 0}</span>
                </button>

                {canHover && !isTouchInteractionRef.current && isHovered && (
                  <ReactionTooltip
                    emoji={emoji}
                    label={reactionsLabel}
                    summary={summary}
                    othersCount={othersCountForTooltip}
                    onClickOthers={
                      othersCountForTooltip > 0
                        ? () => openReactionsModalForEmoji(emoji)
                        : undefined
                    }
                  />
                )}
              </div>
            );
          })}

          {hiddenReactionsCount > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setInitialEmojiFilter(null);
                  setShowAllReactions(true);
                }}
                className="flex h-[26px] items-center gap-1 rounded-full bg-raised px-2 text-xs shadow-chip transition-colors hover:bg-surface2"
              >
                <span className="font-semibold text-ink">
                  {hiddenReactionsCount === 1
                    ? "1 more"
                    : `${hiddenReactionsCount} more`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full emoji picker overlay */}
      {showFullPicker && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleCloseFullPicker}
          />
          <div className="flex h-full items-end justify-center sm:items-center md:pl-[16rem]">
            <div className="relative z-50 w-full max-w-lg mx-2 rounded-t-[28px] bg-[#0b141a] px-4 pt-3 pb-5 shadow-2xl sm:w-auto sm:max-w-none sm:mx-0 sm:bg-transparent sm:p-0 sm:rounded-none sm:shadow-none">
              {/* Drag handle for mobile-style bottom sheet */}
              <div className="mb-3 flex justify-center sm:hidden">
                <div className="h-1.5 w-10 rounded-full bg-gray-500/80" />
              </div>

              <div className="max-h-[28rem] overflow-y-auto">
                <Picker
                  data={data}
                  theme="dark"
                  navPosition="bottom"
                  previewPosition="none"
                  skinTonePosition="none"
                  onEmojiSelect={(emoji) => {
                    handleToggleReaction(emoji.native);
                    handleCloseFullPicker();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(EventItemCard);
