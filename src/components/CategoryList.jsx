import React, { useMemo, useState, memo } from "react";
import { FiChevronDown, FiChevronRight, FiEdit } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import AssigneeAvatar from "./AssigneeAvatar";

function CategoryList({
  categoryName, // "Main" | "Side" | "Dessert" | "Beverage" | "Miscellaneous"
  items = [], // array of event items for this category
  categoryColor = "text-gray-800",
  dietaryIcons = {}, // { vegan:{icon,color}, ... }
  onEditItem, // (item) => void
  onDeleteItem, // (item) => void
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
              <div
                key={item.id}
                className={`rounded-lg ${CATEGORY_BG[categoryName] ?? "bg-gray-50"} shadow-md`}
              >
                <div
                  className="flex cursor-pointer items-center justify-between p-4"
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-primaryDark">
                        {item.title}
                      </h4>
                      {open ? (
                        <FiChevronDown className="text-primaryDark" />
                      ) : (
                        <FiChevronRight className="text-primaryDark" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      {item.assignee && (
                        <AssigneeAvatar
                          assigneeId={item.assigneeId}
                          displayName={item.assignee}
                          size={24}
                        />
                      )}
                    </div>
                    {item.dietary && item.dietary.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.dietary.map((restriction, i) => {
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
                    )}
                  </div>
                </div>

                {open && (
                  <div className="border-t border-rose-200 px-4 pb-4">
                    <div className="mt-3 flex flex-col items-start justify-between">
                      <div className="flex-1">
                        {item.description && (
                          <div className="mb-3">
                            <h5 className="mb-1 font-medium text-gray-700">
                              Description:
                            </h5>
                            <p className="text-sm text-gray-600">
                              {item.description}
                            </p>
                          </div>
                        )}

                        {item.imageUrl && (
                          <div className="mb-3">
                            <h5 className="mb-1 font-medium text-gray-700">
                              Photo:
                            </h5>
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

                      {canManage && (
                        <div className="flex w-full justify-end gap-2 p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditItem?.(item);
                            }}
                            className="rounded-full bg-primaryRed p-2 text-white hover:bg-secondaryRed"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteItem?.(item);
                            }}
                            className="rounded-full bg-primaryRed p-2 text-white hover:bg-secondaryRed"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
