import React, { useMemo, useState } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import { useUsers } from "../contexts/UsersContext";
import AssigneeAvatar from "./AssigneeAvatar";
import useEscapeKey from "../hooks/useEscapeKey";
import { Button, Chip, SheetShell } from "./ui";
import { getCategoryTheme } from "../constants/categoryTheme";

import { LuVegan } from "react-icons/lu";
import { FaLeaf, FaPepperHot, FaGlideG } from "react-icons/fa";
import { GiChicken, GiPeanut, GiMilkCarton, GiShrimp } from "react-icons/gi";
import { PiCowFill } from "react-icons/pi";
import { PorkIconComponent } from "../styles/svgs";

const DIETARY_RESTRICTIONS_META = {
  vegan: { icon: <LuVegan />, color: "text-green-600", label: "Vegan" },
  vegetarian: {
    icon: <FaLeaf />,
    color: "text-emerald-500",
    label: "Vegetarian",
  },
  noPork: {
    icon: <PorkIconComponent />,
    color: "text-pink-400",
    label: "No Pork",
  },
  noBeef: {
    icon: <PiCowFill />,
    color: "text-amber-800",
    label: "No Beef",
  },
  noPoultry: {
    icon: <GiChicken />,
    color: "text-orange-400",
    label: "No Poultry",
  },
  noFish: {
    icon: <FaPepperHot />,
    color: "text-sky-600",
    label: "No Fish",
  },
  shellfishAllergy: {
    icon: <GiShrimp />,
    color: "text-orange-600",
    label: "Shellfish Allergy",
  },
  nutAllergy: {
    icon: <GiPeanut />,
    color: "text-yellow-600",
    label: "Nut Allergy",
  },
  lactoseIntolerant: {
    icon: <GiMilkCarton />,
    color: "text-blue-500",
    label: "Lactose Intolerant",
  },
  glutenFree: {
    icon: <FaGlideG />,
    color: "text-purple-600",
    label: "Gluten Intolerant",
  },
  noSpicy: {
    icon: <FaPepperHot />,
    color: "text-red-600",
    label: "No Spicy",
  },
};

export default function ParticipantsModal({
  isOpen,
  onClose,
  memberIds = [],
  items = [],
  currentUserId = null,
  hostId = null,
  canManageEvent = false,
  onRemoveParticipant,
}) {
  const ids = Array.from(new Set(memberIds.filter(Boolean)));
  const { users: userList, status } = useUsers(ids);

  const [openDietaryByUser, setOpenDietaryByUser] = useState({});

  const contributions = useMemo(() => {
    const byUser = new Map();

    ids.forEach((id, index) => {
      const user = userList[index];
      if (!user) return;

      const userItems = items.filter((it) => it.assigneeId === id);

      const categoryCounts = userItems.reduce((acc, it) => {
        const cat = it.category || "Miscellaneous";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      byUser.set(id, {
        user,
        items: userItems,
        categoryCounts,
        total: userItems.length,
      });
    });

    return byUser;
  }, [ids, userList, items]);

  useEscapeKey(() => {
    onClose();
  }, isOpen);

  if (!isOpen) return null;

  const isLoading = status === "loading";

  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  return (
    <SheetShell
      onBackdropClick={handleBackdropClick}
      title={`Event participants (${ids.length})`}
      onClose={onClose}
      labelledById="participants-sheet-title"
    >
      {isLoading ? (
        <p className="text-sm text-muted">Loading participants...</p>
      ) : ids.length === 0 ? (
        <p className="text-sm text-muted">
          No participants have joined this event yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {ids.map((id) => {
            const entry = contributions.get(id);
            const user = entry?.user || userList[ids.indexOf(id)];

            const isCurrentUser = currentUserId === id;
            const isHostUser = hostId && hostId === id;
            const canRemoveAny = canManageEvent;
            const showRemoveButton =
              (canRemoveAny && !isHostUser) || (!canRemoveAny && isCurrentUser);
            const removeLabel =
              !canRemoveAny && isCurrentUser ? "Leave" : "Remove";

            if (!user) {
              return (
                <li
                  key={id}
                  className="flex w-full items-center justify-between rounded-2xl bg-surface2 px-4 py-3 text-sm text-muted"
                >
                  <div className="flex items-center gap-3">
                    <AssigneeAvatar
                      assigneeId={id}
                      displayName="Unknown"
                      size={36}
                      showName={false}
                    />
                    <span>Unknown participant</span>
                  </div>
                  {showRemoveButton && onRemoveParticipant && (
                    <Button
                      size="sm"
                      variant={removeLabel === "Leave" ? "soft" : "danger"}
                      className="ml-3"
                      onClick={() =>
                        onRemoveParticipant(
                          id,
                          "this participant",
                          !canRemoveAny && isCurrentUser,
                        )
                      }
                    >
                      {removeLabel}
                    </Button>
                  )}
                </li>
              );
            }

            const dietary = user.dietaryRestrictions || [];
            const categoryCounts = entry?.categoryCounts || {};
            const totalItems = entry?.total || 0;

            return (
              <li
                key={id}
                className="flex w-full items-stretch justify-between gap-3 rounded-2xl bg-surface2 px-4 py-3"
              >
                {/* Left: avatar, name, dietary row under name */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex min-w-0 items-center gap-3">
                    {/* Avatar should never squish */}
                    <div className="flex-shrink-0">
                      <AssigneeAvatar
                        assigneeId={id}
                        displayName={user.name}
                        size={36}
                        showName={false}
                      />
                    </div>

                    {/* Name: wraps, but clamps for extreme cases like emails */}
                    <span className="line-clamp-2 min-w-0 flex-1 break-words text-base font-semibold text-ink">
                      {user.name}
                    </span>
                  </div>

                  {/* Dietary info directly under name */}
                  <div className="mt-0.5">
                    {dietary.length === 0 ? (
                      <span className="text-[11px] text-muted">
                        No dietary restrictions set
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-expanded={!!openDietaryByUser[id]}
                          onClick={() =>
                            setOpenDietaryByUser((prev) => ({
                              ...prev,
                              [id]: !prev[id],
                            }))
                          }
                          className="flex items-center text-[11px] font-semibold text-muted hover:text-ink"
                        >
                          <span>Dietary restrictions</span>
                          {openDietaryByUser[id] ? (
                            <LuChevronDown className="ml-1.5 h-4 w-4" />
                          ) : (
                            <LuChevronRight className="ml-1.5 h-4 w-4" />
                          )}
                        </button>
                        {openDietaryByUser[id] && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {dietary.map((key) => {
                              const meta = DIETARY_RESTRICTIONS_META[key];
                              if (!meta) return null;
                              return (
                                <Chip
                                  key={key}
                                  className="bg-raised text-[11px] shadow-chip"
                                >
                                  <span className={meta.color}>{meta.icon}</span>
                                  <span>{meta.label}</span>
                                </Chip>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Right: item count, category chips, and remove button, right aligned */}
                <div className="flex flex-shrink-0 flex-col items-end justify-between gap-2 text-xs text-muted">
                  <div className="flex max-w-[9rem] flex-col items-end gap-1.5">
                    <span className="font-semibold">
                      {totalItems > 0
                        ? `${totalItems} item${totalItems === 1 ? "" : "s"}`
                        : "No items yet"}
                    </span>

                    <div className="flex flex-wrap justify-end gap-1.5">
                      {Object.keys(categoryCounts).length > 0 ? (
                        Object.entries(categoryCounts).map(
                          ([category, count]) => {
                            const theme = getCategoryTheme(category);
                            return (
                              <Chip
                                key={`cat-${category}`}
                                className="text-[11px]"
                                tone={{
                                  background: theme.tint,
                                  color: theme.accent,
                                }}
                              >
                                <span
                                  aria-hidden="true"
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: theme.bold }}
                                />
                                <span>{category}</span>
                                <span>· {count}</span>
                              </Chip>
                            );
                          },
                        )
                      ) : (
                        <span className="text-[11px] text-muted">
                          No contributions yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Leave/Remove button */}
                  {showRemoveButton && onRemoveParticipant && (
                    <Button
                      size="sm"
                      variant={removeLabel === "Leave" ? "soft" : "danger"}
                      onClick={() =>
                        onRemoveParticipant(
                          id,
                          user.name,
                          !canRemoveAny && isCurrentUser,
                        )
                      }
                    >
                      {removeLabel}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SheetShell>
  );
}
