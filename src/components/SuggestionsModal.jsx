import { useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import AssigneeAvatar from "./AssigneeAvatar";
import useEscapeKey from "../hooks/useEscapeKey";
import { useUsers } from "../contexts/UsersContext";
import { FiEdit } from "react-icons/fi";
import { MdDelete } from "react-icons/md";

const CATEGORY_ORDER = ["Main", "Side", "Dessert", "Beverage", "Miscellaneous"];

const CATEGORY_BADGES = {
  Main: "bg-rose-100 text-rose-800",
  Side: "bg-yellow-100 text-yellow-800",
  Dessert: "bg-purple-100 text-purple-800",
  Beverage: "bg-blue-100 text-blue-800",
  Miscellaneous: "bg-emerald-100 text-emerald-800",
};

export default function SuggestionsModal({
  isOpen,
  onClose,
  suggestions = [],
  currentUserId,
  onClaimSuggestion,
  onEditSuggestion,
  onDeleteSuggestion,
  memberIds = [],
}) {
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    itemName: "",
    category: "Main",
  });
  const { users: memberUsers = [] } = useUsers(memberIds);

  const getUserName = (uid) => {
    if (!uid) return "Unknown";

    const found = memberUsers.find((u) => u.id === uid);
    return found?.name || found?.displayName || found?.email || "Unknown";
  };

  const groupedSuggestions = useMemo(() => {
    const byCategory = {};
    CATEGORY_ORDER.forEach((cat) => {
      byCategory[cat] = [];
    });

    (suggestions || []).forEach((s) => {
      const category = CATEGORY_ORDER.includes(s.category)
        ? s.category
        : "Miscellaneous";

      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(s);
    });

    CATEGORY_ORDER.forEach((cat) => {
      if (byCategory[cat]) {
        byCategory[cat].sort((a, b) =>
          (a.itemName || "").localeCompare(b.itemName || ""),
        );
      }
    });

    return byCategory;
  }, [suggestions]);

  const hasAnySuggestions =
    Array.isArray(suggestions) && suggestions.length > 0;

  const isOwnSuggestion = (suggestion) =>
    !!currentUserId && suggestion.suggesterId === currentUserId;

  useEscapeKey(() => {
    onClose?.();
  }, isOpen);

  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget) return;
    onClose?.();
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const startEditing = (suggestion) => {
    setEditingId(suggestion.id);
    setEditDraft({
      itemName: suggestion.itemName || "",
      category: suggestion.category || "Main",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDraft({
      itemName: "",
      category: "Main",
    });
  };

  const saveEditing = (suggestion) => {
    if (!onEditSuggestion) return;

    const trimmedName = editDraft.itemName.trim();
    if (!trimmedName) {
      // optional: you could show a nicer validation here
      return;
    }

    onEditSuggestion({
      ...suggestion,
      itemName: trimmedName,
      category: editDraft.category || "Main",
    });

    cancelEditing();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-center bg-gray-500 bg-opacity-50 md:justify-end"
      onClick={handleBackdropClick}
    >
      {/* Panel – matches ParticipantsModal layout */}
      <div
        className="relative flex h-full w-full max-w-full flex-col overflow-hidden bg-yellow-50 shadow-lg md:max-w-md"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="flex items-center justify-center bg-primaryRed px-4 py-3">
          <h2 className="text-center text-lg font-semibold text-white">
            Item suggestions {`(${suggestions.length})`}
          </h2>
          <IoClose
            className="absolute right-4 top-3 cursor-pointer text-2xl text-white"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="mt-2 flex-1 overflow-y-auto px-6 pb-6 pt-4">
          {!hasAnySuggestions ? (
            <p className="text-sm text-gray-500">
              No suggestions yet. Be the first to suggest an item!
            </p>
          ) : (
            CATEGORY_ORDER.map((category) => {
              const items = groupedSuggestions[category] || [];
              if (!items.length) return null;

              return (
                <div key={category} className="mb-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {category}
                  </h3>

                  <ul className="space-y-3">
                    {items.map((suggestion) => {
                      const isEditing = editingId === suggestion.id;
                      const editable =
                        isOwnSuggestion(suggestion) && !suggestion.claimed;

                      return (
                        <li
                          key={suggestion.id}
                          className="relative flex w-full items-start justify-between rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
                        >
                          {/* Top-right icon actions for own unclaimed suggestion */}
                          {editable && !isEditing && (
                            <div className="absolute right-2 top-2 flex items-center gap-2">
                              {/* Edit Icon */}
                              <button
                                type="button"
                                onClick={() => startEditing(suggestion)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-primaryRed hover:text-secondaryRed"
                              >
                                <FiEdit className="text-sm" />
                              </button>

                              {/* Delete Icon */}
                              <button
                                type="button"
                                onClick={() => onDeleteSuggestion?.(suggestion)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-primaryRed hover:text-secondaryRed"
                              >
                                <MdDelete className="text-sm" />
                              </button>
                            </div>
                          )}
                          {/* Left: Avatar + info / edit form */}
                          <div className="flex flex-1 items-start gap-3">
                            <AssigneeAvatar
                              assigneeId={suggestion.suggesterId}
                              displayName={suggestion.suggester}
                              size={32}
                              className="mt-0.5"
                              showName={false}
                            />
                            <div className="flex min-w-0 flex-col gap-1">
                              {isEditing ? (
                                <>
                                  <input
                                    type="text"
                                    value={editDraft.itemName}
                                    onChange={(e) =>
                                      setEditDraft((prev) => ({
                                        ...prev,
                                        itemName: e.target.value,
                                      }))
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-primaryRed focus:outline-none focus:ring-1 focus:ring-primaryRed"
                                    placeholder="Item name"
                                  />

                                  <select
                                    value={editDraft.category}
                                    onChange={(e) =>
                                      setEditDraft((prev) => ({
                                        ...prev,
                                        category: e.target.value,
                                      }))
                                    }
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-primaryRed focus:outline-none focus:ring-1 focus:ring-primaryRed"
                                  >
                                    {CATEGORY_ORDER.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                  </select>
                                </>
                              ) : (
                                <>
                                  <p className="truncate text-sm font-semibold text-gray-900">
                                    {suggestion.itemName}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Suggested by{" "}
                                    <span className="font-medium">
                                      {suggestion.suggester || "Unknown"}
                                    </span>
                                  </p>
                                </>
                              )}

                              <span
                                className={`mt-1 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                                  CATEGORY_BADGES[suggestion.category] ||
                                  CATEGORY_BADGES.Miscellaneous
                                }`}
                              >
                                {suggestion.category || "Miscellaneous"}
                              </span>
                            </div>
                          </div>

                          {/* Right side: actions */}
                          <div className="flex flex-col items-end gap-2 place-self-end pl-3">
                            {/* Claim / Claimed */}
                            {suggestion.claimed ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex items-center rounded-full bg-primaryRed/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primaryRed">
                                  Claimed
                                </span>

                                {suggestion.claimedById && (
                                  <span className="text-[10px] leading-tight text-gray-500">
                                    Claimed by{" "}
                                    <span className="font-medium text-gray-700">
                                      {getUserName(suggestion.claimedById)}
                                    </span>
                                  </span>
                                )}
                              </div>
                            ) : (
                              !isOwnSuggestion(suggestion) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onClaimSuggestion?.(suggestion)
                                  }
                                  className="inline-flex items-center rounded-full border border-primaryRed bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primaryRed hover:bg-primaryRed/5"
                                >
                                  Claim
                                </button>
                              )
                            )}

                            {editable && isEditing && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveEditing(suggestion)}
                                  className="text-[11px] font-semibold text-primaryRed"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
