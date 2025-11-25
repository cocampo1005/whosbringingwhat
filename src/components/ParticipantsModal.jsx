import React, { useMemo, useState } from "react";
import { IoClose } from "react-icons/io5";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useUsers } from "../contexts/UsersContext";
import AssigneeAvatar from "./AssigneeAvatar";
import useEscapeKey from "../hooks/useEscapeKey";

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

const CATEGORY_BADGES = {
  Main: "bg-rose-100 text-rose-800",
  Side: "bg-yellow-100 text-yellow-800",
  Dessert: "bg-purple-100 text-purple-800",
  Beverage: "bg-blue-100 text-blue-800",
  Miscellaneous: "bg-emerald-100 text-emerald-800",
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

  if (!isOpen) return null;

  const isLoading = status === "loading";

  useEscapeKey(() => {
    onClose();
  }, isOpen);

  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-center md:justify-end bg-gray-500 bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="relative flex h-full w-full max-w-full md:max-w-md flex-col overflow-hidden bg-yellow-50 shadow-lg">
        <div className="flex items-center justify-center bg-primaryRed px-4 py-3">
          <h2 className="text-center text-lg font-semibold text-white">
            Event participants
          </h2>
          <IoClose
            className="absolute right-4 top-3 cursor-pointer text-2xl text-white"
            onClick={onClose}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 mt-2">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading participants...</p>
          ) : ids.length === 0 ? (
            <p className="text-sm text-gray-500">
              No participants have joined this event yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {ids.map((id) => {
                const entry = contributions.get(id);
                const user = entry?.user || userList[ids.indexOf(id)];

                const isCurrentUser = currentUserId === id;
                const isHostUser = hostId && hostId === id;
                const canRemoveAny = canManageEvent;
                const showRemoveButton =
                  (canRemoveAny && !isHostUser) ||
                  (!canRemoveAny && isCurrentUser);
                const removeLabel =
                  !canRemoveAny && isCurrentUser ? "Leave" : "Remove";

                if (!user) {
                  return (
                    <li
                      key={id}
                      className="mx-auto flex w-full max-w-[34rem] items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <AssigneeAvatar
                          assigneeId={id}
                          displayName="Unknown"
                          size={32}
                        />
                        <span>Unknown participant</span>
                      </div>
                      {showRemoveButton && onRemoveParticipant && (
                        <button
                          type="button"
                          onClick={() =>
                            onRemoveParticipant(
                              id,
                              "this participant",
                              !canRemoveAny && isCurrentUser,
                            )
                          }
                          className={
                            removeLabel === "Leave"
                              ? "ml-3 rounded-full bg-primaryRed px-3 py-1 text-xs font-semibold text-white hover:bg-secondaryRed"
                              : "ml-3 rounded-full border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          }
                        >
                          {removeLabel}
                        </button>
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
                    className="mx-auto flex w-full max-w-[34rem] items-stretch justify-between gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
                  >
                    {/* Left: avatar, name, dietary row under name */}
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <AssigneeAvatar
                          assigneeId={id}
                          displayName={user.name}
                          size={36}
                          showName={false}
                        />
                        <span className="block whitespace-nowrap text-lg font-medium text-gray-900">
                          {user.name}
                        </span>
                      </div>
                      {/* Dietary info directly under name, collapsible when present */}
                      <div className="mt-0.5">
                        {dietary.length === 0 ? (
                          <span className="text-[11px] text-gray-400">
                            No dietary restrictions set
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setOpenDietaryByUser((prev) => ({
                                  ...prev,
                                  [id]: !prev[id],
                                }))
                              }
                              className="flex items-center text-[11px] text-gray-500 hover:text-gray-700"
                            >
                              <span>Dietary restrictions</span>
                              {openDietaryByUser[id] ? (
                                <FiChevronDown className="ml-2 h-4 w-4" />
                              ) : (
                                <FiChevronRight className="ml-2 h-4 w-4" />
                              )}
                            </button>
                            {openDietaryByUser[id] && (
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {dietary.map((key) => {
                                  const meta = DIETARY_RESTRICTIONS_META[key];
                                  if (!meta) return null;
                                  return (
                                    <span
                                      key={key}
                                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-700 shadow-sm"
                                    >
                                      <span className={meta.color}>{meta.icon}</span>
                                      <span>{meta.label}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: item count, category chips, and remove button, right aligned */}
                    <div className="flex w-[160px] flex-col items-end justify-between text-xs text-gray-600">
                      {/* Top: item count + category chips */}
                      <div className="w-full">
                        <div className="flex justify-end mt-3 mb-[17px]">
                          <span>
                            {totalItems > 0
                              ? `${totalItems} item${totalItems === 1 ? "" : "s"}`
                              : "No items yet"}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                          {Object.keys(categoryCounts).length > 0 ? (
                            Object.entries(categoryCounts).map(
                              ([category, count]) => (
                                <span
                                  key={`cat-${category}`}
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    CATEGORY_BADGES[category] ||
                                    "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  <span>{category}</span>
                                  <span>· {count}</span>
                                </span>
                              ),
                            )
                          ) : (
                            <span className="text-[11px] text-gray-400">
                              No contributions yet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom: fixed Leave/Remove button */}
                      {showRemoveButton && onRemoveParticipant && (
                        <button
                          type="button"
                          onClick={() =>
                            onRemoveParticipant(
                              id,
                              user.name,
                              !canRemoveAny && isCurrentUser,
                            )
                          }
                          className="mt-2 rounded-full bg-primaryRed px-3 py-1 text-xs font-semibold text-white hover:bg-secondaryRed"
                        >
                          {removeLabel}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
