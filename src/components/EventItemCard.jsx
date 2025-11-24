import React, { useState, useEffect, useRef, memo } from "react";
import { FiChevronDown, FiChevronRight, FiEdit, FiSmile } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import AssigneeAvatar from "./AssigneeAvatar";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useAuth } from "../contexts/AuthContext";
import { useUsers } from "../contexts/UsersContext";
import ReactionTooltip from "./ReactionTooltip";

const CATEGORY_FOCUS_RING = {
  Main: "focus-visible:ring-rose-300",
  Side: "focus-visible:ring-yellow-300",
  Dessert: "focus-visible:ring-purple-300",
  Beverage: "focus-visible:ring-blue-300",
  Miscellaneous: "focus-visible:ring-emerald-300",
};

const CATEGORY_CHEVRON_BG = {
  Main: "bg-rose-100 hover:bg-rose-200",
  Side: "bg-yellow-100 hover:bg-yellow-200",
  Dessert: "bg-purple-100 hover:bg-purple-200",
  Beverage: "bg-blue-100 hover:bg-blue-200",
  Miscellaneous: "bg-emerald-100 hover:bg-emerald-200",
};

function EventItemCard({
  item,
  categoryName,
  categoryBgClass,
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
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [canHover, setCanHover] = useState(true);
  const longPressTimerRef = useRef(null);
  const longPressEmojiRef = useRef(null);
  const suppressClickRef = useRef(false);
  const isTouchInteractionRef = useRef(false);
  const LONG_PRESS_MS = 1100;

  const quickBarRef = useRef(null);
  const reactionButtonRef = useRef(null);

  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏", "‼️"];

  const displayName = item.onBehalfOfName || item.assignee;
  const assigneeIdForAvatar = item.isOnBehalfOf ? null : item.assigneeId;

  const reactionEntries = Object.entries(item.reactions || {}).filter(
    ([, info]) => (info?.count ?? 0) > 0,
  );
  const hasReactions = reactionEntries.length > 0;

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

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressEmojiRef.current = null;
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
        setHoveredEmoji(emoji);
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

  return (
    <div
      className={`relative rounded-lg ${categoryBgClass} shadow-md group ${
        hasReactions ? "mb-5" : ""
      }`}
    >
      {/* Header: title left, chevron right */}
      <div className="flex items-center justify-between p-[16px_16px_0px_16px]">
        <h4 className="truncate font-semibold text-primaryDark">
          {item.title}
        </h4>
        <button
          type="button"
          onClick={handleChevronClick}
          className={`rounded-full p-1 text-primaryDark shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 ${
            CATEGORY_CHEVRON_BG[categoryName] ?? "bg-white/70 hover:bg-white"
          } ${CATEGORY_FOCUS_RING[categoryName] ?? "focus-visible:ring-white"}`}
          aria-label={open ? "Collapse item" : "Expand item"}
        >
          {open ? (
            <FiChevronDown className="text-primaryDark" />
          ) : (
            <FiChevronRight className="text-primaryDark" />
          )}
        </button>
      </div>

      {/* Assignee, actions, and dietary info */}
      <div className="px-4 pb-4">
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          {displayName && (
            <AssigneeAvatar
              assigneeId={assigneeIdForAvatar}
              displayName={displayName}
              size={24}
            />
          )}
        </div>

        <div className="mt-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {item.dietary &&
              item.dietary.length > 0 &&
              item.dietary.map((restriction, i) => {
                const d = dietaryIcons[restriction?.toLowerCase?.()];
                return d ? (
                  <span
                    key={i}
                    className={`flex items-center text-lg ${d.color}`}
                    title={restriction}
                  >
                    {d.icon}
                  </span>
                ) : null;
              })}
          </div>
          <div className="relative flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {/* Quick reactions bar */}
            {showQuickBar && (
              <div
                ref={quickBarRef}
                className="absolute -top-10 -right-12 z-30 flex items-center gap-1 rounded-full bg-[#202c33] px-3 py-1 text-white shadow-lg"
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
                    className={`rounded-full px-1 text-xl hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 ${
                      CATEGORY_FOCUS_RING[categoryName] ?? "focus-visible:ring-white"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleOpenFullPicker}
                  className={`ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-gray-100 hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 ${
                    CATEGORY_FOCUS_RING[categoryName] ?? "focus-visible:ring-white"
                  }`}
                >
                  +
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleOpenQuickBar}
              ref={reactionButtonRef}
              className={`flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-gray-100 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 ${
                CATEGORY_FOCUS_RING[categoryName] ?? "focus-visible:ring-white"
              }`}
              aria-label="Add reaction"
            >
              <FiSmile />
            </button>

            {canManage && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditItem?.(item);
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full bg-primaryRed text-white hover:bg-secondaryRed focus-visible:outline-none focus-visible:ring-2 ${
                    CATEGORY_FOCUS_RING[categoryName] ?? "focus-visible:ring-white"
                  }`}
                  aria-label="Edit item"
                >
                  <FiEdit />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem?.(item);
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full bg-primaryRed text-white hover:bg-secondaryRed focus-visible:outline-none focus-visible:ring-2 ${
                    CATEGORY_FOCUS_RING[categoryName] ?? "focus-visible:ring-white"
                  }`}
                  aria-label="Delete item"
                >
                  <MdDelete />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-rose-200 px-4 pb-4">
          <div className="mt-3 flex flex-col items-start justify-between">
            <div className="flex-1">
              {item.description && (
                <div className="mb-3">
                  <h5 className="mb-1 font-medium text-gray-700">Description:</h5>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              )}

              {item.imageUrl && (
                <div className="mb-3">
                  <h5 className="mb-1 font-medium text-gray-700">Photo:</h5>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-32 w-32 rounded-lg object-cover"
                  />
                </div>
              )}

              {item.servings && (
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-medium">Servings:</span>{" "}
                  {item.servings}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reactions chip cluster anchored near bottom border */}
      {reactionEntries.length > 0 && (
        <div className="pointer-events-auto absolute -bottom-2 left-4 z-10 flex flex-wrap gap-1">
          {reactionEntries.map(([emoji, info]) => {
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
            if (reactionUsersStatus === "loading" && userIds.length > 0) {
              summary = "Loading names...";
            } else if (names.length === 1) {
              summary = names[0];
            } else if (names.length === 2) {
              summary = `${names[0]} and ${names[1]}`;
            } else if (names.length > 2) {
              const others = names.length - 2;
              summary = `${names[0]}, ${names[1]} and ${others} other${
                others === 1 ? "" : "s"
              }`;
            }

            const reactionsLabel =
              total === 1 ? "1 reaction" : `${total} reactions`;
            const isHovered = hoveredEmoji === emoji;

            return (
              <div
                key={emoji}
                className="relative"
                onMouseEnter={() => {
                  if (!canHover) return;
                  setHoveredEmoji(emoji);
                }}
                onMouseLeave={() =>
                  setHoveredEmoji((prev) => (prev === emoji ? null : prev))
                }
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
                  className={`flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 ${
                    CATEGORY_FOCUS_RING[categoryName] ??
                    "focus-visible:ring-white"
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  <span className="text-gray-700">{info?.count ?? 0}</span>
                </button>

                {isHovered && (
                  <ReactionTooltip
                    emoji={emoji}
                    label={reactionsLabel}
                    summary={summary}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Full emoji picker overlay */}
      {showFullPicker && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleCloseFullPicker}
          />
          <div className="relative z-50 rounded-3xl border border-white/10 bg-gradient-to-b from-[#18252d] to-[#0b141a] p-2 shadow-2xl">
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
      )}
    </div>
  );
}

export default memo(EventItemCard);
