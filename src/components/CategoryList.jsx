import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import EventItemCard from "./EventItemCard";

function CategoryList({
  categoryName, // "Main" | "Side" | "Dessert" | "Beverage" | "Miscellaneous"
  items = [], // array of event items for this category
  categoryColor = "text-gray-800",
  dietaryIcons = {}, // { vegan:{icon,color}, ... }
  onEditItem, // (item) => void
  onDeleteItem, // (item) => void
  onToggleReaction,
  canManageItem,
  defaultExpanded = true,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedItems, setExpandedItems] = useState(() => new Set());

  const CATEGORY_BG = {
    Main: "bg-rose-50",
    Side: "bg-yellow-50",
    Dessert: "bg-purple-50",
    Beverage: "bg-blue-50",
    Miscellaneous: "bg-emerald-50",
  };

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
    <div className="mb-6">
      {/* Header */}
      <div
        className="mb-3 flex cursor-pointer items-center justify-between"
        onClick={() => setIsExpanded((v) => !v)}
      >
        <h3 className={`text-lg font-bold ${categoryColor}`}>
          {headerText} ({items.length})
        </h3>
        {isExpanded ? (
          <FiChevronDown size={24} className={categoryColor} />
        ) : (
          <FiChevronRight size={24} className={categoryColor} />
        )}
      </div>

      {/* Items */}
      {isExpanded && sortedItems.length > 0 && (
        <div className="space-y-2">
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
                categoryBgClass={CATEGORY_BG[categoryName] ?? "bg-gray-50"}
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
    </div>
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
        reactions: JSON.stringify(x.reactions || {}),
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
