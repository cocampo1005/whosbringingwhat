import { useMemo, useState } from "react";
import AssigneeAvatar from "./AssigneeAvatar";
import useEscapeKey from "../hooks/useEscapeKey";
import { useUsers } from "../contexts/UsersContext";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import { Button, Chip, IconButton, SheetShell } from "./ui";
import { CATEGORY_ORDER, getCategoryTheme } from "../constants/categoryTheme";

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

  const fieldCls =
    "w-full rounded-full border border-transparent bg-raised px-4 py-2 text-sm text-ink focus:ring-2 focus:ring-selected-text";

  return (
    <SheetShell
      onBackdropClick={handleBackdropClick}
      title={`Item suggestions (${suggestions.length})`}
      onClose={onClose}
      labelledById="suggestions-sheet-title"
    >
      <div onClick={stopPropagation}>
        {!hasAnySuggestions ? (
          <p className="text-sm text-muted">
            No suggestions yet. Be the first to suggest an item!
          </p>
        ) : (
          CATEGORY_ORDER.map((category) => {
            const items = groupedSuggestions[category] || [];
            if (!items.length) return null;
            const groupTheme = getCategoryTheme(category);

            return (
              <div key={category} className="mb-5">
                <h3 className="mb-2 flex items-center gap-2 !text-xs !tracking-wide text-muted">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: groupTheme.bold }}
                  />
                  {category}
                </h3>

                <ul className="space-y-3">
                  {items.map((suggestion) => {
                    const isEditing = editingId === suggestion.id;
                    const editable =
                      isOwnSuggestion(suggestion) && !suggestion.claimed;
                    const theme = getCategoryTheme(suggestion.category);

                    return (
                      <li
                        key={suggestion.id}
                        className="relative flex w-full items-start justify-between rounded-2xl px-4 py-3 shadow-soft"
                        style={{ backgroundColor: theme.tint }}
                      >
                        {/* Top-right icon actions for own unclaimed suggestion */}
                        {editable && !isEditing && (
                          <div className="absolute right-2 top-2 flex items-center gap-1.5">
                            <IconButton
                              aria-label="Edit suggestion"
                              onClick={() => startEditing(suggestion)}
                            >
                              <LuPencil size={16} />
                            </IconButton>

                            <IconButton
                              aria-label="Delete suggestion"
                              variant="danger"
                              onClick={() => onDeleteSuggestion?.(suggestion)}
                            >
                              <LuTrash2 size={16} />
                            </IconButton>
                          </div>
                        )}
                        {/* Left: Avatar + info / edit form */}
                        <div
                          className={`flex flex-1 items-start gap-3 ${editable && !isEditing ? "pr-20" : ""}`}
                        >
                          <AssigneeAvatar
                            assigneeId={suggestion.suggesterId}
                            displayName={suggestion.suggester}
                            size={32}
                            className="mt-0.5 shrink-0"
                            showName={false}
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
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
                                  className="text-sm"
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
                                  className={`mt-2 ${fieldCls}`}
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
                                <p className="truncate text-sm font-bold text-ink">
                                  {suggestion.itemName}
                                </p>
                                <p className="text-xs text-muted">
                                  Suggested by{" "}
                                  <span className="font-semibold text-ink">
                                    {suggestion.suggester || "Unknown"}
                                  </span>
                                </p>
                              </>
                            )}

                            <Chip
                              className="mt-1 w-fit text-[11px] uppercase tracking-wide"
                              tone={{
                                background: theme.tint,
                                color: theme.accent,
                              }}
                            >
                              {suggestion.category || "Miscellaneous"}
                            </Chip>
                          </div>
                        </div>

                        {/* Right side: actions */}
                        <div className="flex flex-col items-end gap-2 place-self-end pl-3">
                          {/* Claim / Claimed */}
                          {suggestion.claimed ? (
                            <div className="flex flex-col items-end gap-1">
                              <Chip
                                className="bg-selected-soft text-[11px] uppercase tracking-wide text-selected-text"
                              >
                                Claimed
                              </Chip>

                              {suggestion.claimedById && (
                                <span className="text-[10px] leading-tight text-muted">
                                  Claimed by{" "}
                                  <span className="font-semibold text-ink">
                                    {getUserName(suggestion.claimedById)}
                                  </span>
                                </span>
                              )}
                            </div>
                          ) : (
                            !isOwnSuggestion(suggestion) && (
                              <Button
                                variant="accent"
                                size="sm"
                                onClick={() => onClaimSuggestion?.(suggestion)}
                              >
                                Claim
                              </Button>
                            )
                          )}

                          {editable && isEditing && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="accent"
                                onClick={() => saveEditing(suggestion)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="soft"
                                onClick={cancelEditing}
                              >
                                Cancel
                              </Button>
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
    </SheetShell>
  );
}
