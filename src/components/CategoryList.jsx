import React, { useMemo, useState, memo } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { getCategoryTheme } from "../constants/categoryTheme";
import EventItemCard from "./EventItemCard";

function CategoryList({
  categoryName, // "Main" | "Side" | "Dessert" | "Beverage" | "Miscellaneous"
  items = [], // array of event items for this category
  dietaryIcons = {}, // { vegan:{icon,color}, ... }
  onEditItem, // (item) => void
  onDeleteItem, // (item) => void
  onToggleReaction,
  canManageItem,
  defaultExpanded = true,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedItems, setExpandedItems] = useState(() => new Set());

  const theme = getCategoryTheme(categoryName);

  const toggleItem = (id) =>
    setExpandedItems((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // Mirror original behavior: sort items by title
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.title.localeCompare(b.title)),
    [items],
  );

  const headerText =
    categoryName === "Miscellaneous" ? categoryName : `${categoryName}s`;

  return (
    <section
      className="rounded-card p-3 pb-4"
      style={{ backgroundColor: theme.tint }}
    >
      {/* Header */}
      <h3 className="m-0">
      <button
        type="button"
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-2.5 rounded-full text-left"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.pastel }}
        >
          <img src={theme.icon} alt="" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 truncate font-display text-[0.8125rem] font-extrabold uppercase tracking-wider text-ink">
          {headerText}
        </span>
        <span
          className="font-display text-[0.8125rem] font-bold"
          style={{ color: theme.accent }}
        >
          {items.length}
        </span>
        {isExpanded ? (
          <LuChevronDown aria-hidden="true" className="shrink-0 text-lg text-muted" />
        ) : (
          <LuChevronRight aria-hidden="true" className="shrink-0 text-lg text-muted" />
        )}
      </button>
      </h3>

      {/* Items */}
      {isExpanded && sortedItems.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {sortedItems.map((item) => {
            const open = expandedItems.has(item.id);
            const canManage =
              typeof canManageItem === "function"
                ? !!canManageItem(item)
                : true;

            return (
              <EventItemCard
                key={item.id}
                item={item}
                categoryName={categoryName}
                categoryBgClass=""
                dietaryIcons={dietaryIcons}
                canManage={canManage}
                open={open}
                onToggleOpen={() => toggleItem(item.id)}
                onEditItem={onEditItem}
                onDeleteItem={onDeleteItem}
                onToggleReaction={onToggleReaction}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// Only re-render when the visible data really changed
function areEqual(prev, next) {
  if (
    prev.categoryName !== next.categoryName ||
    prev.categoryColor !== next.categoryColor
  )
    return false;

  const a = prev.items || [];
  const b = next.items || [];
  if (a.length !== b.length) return false;

  // Compare by id + key fields, ignore reference/order noise
  const norm = (list) =>
    [...list]
      .map((x) => ({
        id: x.id,
        title: x.title,
        assignee: x.assignee || "",
        assigneeId: x.assigneeId || "",
        description: x.description || "",
        imageUrl: x.imageUrl || "",
        servings: x.servings || "",
        dietary: (x.dietary || []).slice().sort().join("|"),
        onBehalfOfName: x.onBehalfOfName || "",
        isOnBehalfOf: !!x.isOnBehalfOf,
        reactions: JSON.stringify(
          Object.entries(x.reactions || {}).sort(([a], [b]) =>
            (a || "").localeCompare(b || ""),
          ),
        ),
      }))
      .sort((x, y) => (x.id || "").localeCompare(y.id || ""));

  const A = norm(a);
  const B = norm(b);
  for (let i = 0; i < A.length; i++) {
    const ka = Object.keys(A[i]);
    for (const k of ka) {
      if (A[i][k] !== B[i][k]) return false;
    }
  }
  return true;
}

export default memo(CategoryList, areEqual);
