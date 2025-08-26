import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatTime } from "../utils/formatters";
import EventModal from "../components/EventModal";
import ShareButton from "../components/ShareButton";
import { FiEdit, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { BsPeople } from "react-icons/bs";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { TiLocation } from "react-icons/ti";
import { FaPlus } from "react-icons/fa6";
import { GiChickenOven } from "react-icons/gi";
import { FaBowlFood } from "react-icons/fa6";
import { GiCakeSlice } from "react-icons/gi";
import { FaWineGlassAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
// Dietary restriction icons
import { LuVegan } from "react-icons/lu";
import { FaLeaf } from "react-icons/fa6";
import { GiPeanut } from "react-icons/gi";
import { GiMilkCarton } from "react-icons/gi";
import { FaGlideG } from "react-icons/fa";
import { PorkIconComponent } from "../styles/svgs";
import ItemModal from "../components/ItemModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import ParticipantsModal from "../components/ParticipantsModal";

function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToDeleteName, setItemToDeleteName] = useState("");
  const [participants, setParticipants] = useState([]);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  const navigate = useNavigate();

  // Dietary icons configuration
  const dietaryIcons = {
    vegan: { icon: <LuVegan />, color: "text-green-600" },
    vegetarian: { icon: <FaLeaf />, color: "text-emerald-500" },
    pork: { icon: <PorkIconComponent />, color: "text-pink-400" },
    nuts: { icon: <GiPeanut />, color: "text-yellow-600" },
    dairy: { icon: <GiMilkCarton />, color: "text-blue-500" },
    gluten: { icon: <FaGlideG />, color: "text-purple-600" },
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "events", eventId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setEvent({ id: docSnapshot.id, ...docSnapshot.data() });
        } else {
          console.error("Event not found!");
        }
      },
    );

    return () => unsubscribe();
  }, [eventId]);

  const handleEdit = async (updatedEventData) => {
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, updatedEventData);
      setEvent((prev) => ({ ...prev, ...updatedEventData }));

      console.log("Event updated successfully!");
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setEditingEvent(false);
    }
  };

  const updateParticipants = (itemAssignee) => {
    if (itemAssignee && typeof itemAssignee === "string") {
      const cleanAssignee = itemAssignee
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      setParticipants((prev) => {
        const allAssignees = new Set([...prev, cleanAssignee]);
        return Array.from(allAssignees);
      });
    }
  };

  const handleParticipantsModal = () => {
    setIsParticipantModalOpen(!isParticipantModalOpen);
  };

  const groupItemsByCategory = (items) => {
    const categories = ["Main", "Side", "Dessert", "Beverage"];
    const grouped = {};

    categories.forEach((category) => {
      grouped[category] = items
        .filter((item) => item.category === category)
        .sort((a, b) => a.title.localeCompare(b.title));
    });

    return grouped;
  };

  const getCategoryCounts = (items) => {
    const categoryCounts = { Main: 0, Side: 0, Dessert: 0, Beverage: 0 };

    items.forEach((item) => {
      if (categoryCounts[item.category] !== undefined) {
        categoryCounts[item.category] += 1;
      }
    });

    return categoryCounts;
  };

  const getProgressBarData = (items) => {
    const counts = getCategoryCounts(items);
    const total = items.length;

    if (total === 0) return [];

    const categories = [
      {
        name: "Main",
        count: counts.Main,
        color: "bg-red-600",
        textColor: "text-red-600",
        icon: GiChickenOven,
      },
      {
        name: "Side",
        count: counts.Side,
        color: "bg-yellow-500",
        textColor: "text-yellow-500",
        icon: FaBowlFood,
      },
      {
        name: "Dessert",
        count: counts.Dessert,
        color: "bg-fuchsia-600",
        textColor: "text-fuchsia-600",
        icon: GiCakeSlice,
      },
      {
        name: "Beverage",
        count: counts.Beverage,
        color: "bg-blue-600",
        textColor: "text-blue-600",
        icon: FaWineGlassAlt,
      },
    ];

    return categories
      .map((cat) => ({
        ...cat,
        percentage: (cat.count / total) * 100,
      }))
      .filter((cat) => cat.count > 0);
  };

  const categoryCounts = event ? getCategoryCounts(event.items || []) : {};
  const groupedItems = event ? groupItemsByCategory(event.items || []) : {};
  const progressData = event ? getProgressBarData(event.items || []) : [];

  // Helper function to get text color for a category
  const getCategoryTextColor = (categoryName) => {
    const categoryData = progressData.find((cat) => cat.name === categoryName);
    return categoryData ? categoryData.textColor : "text-gray-800";
  };

  // Functions for item CRUD operations
  const addItemToEvent = async (eventId, newItem) => {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      items: arrayUnion(newItem),
    });
  };

  const updateItemInEvent = async (eventId, updatedItem) => {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);

    if (eventDoc.exists()) {
      const { items } = eventDoc.data();
      const updatedItems = items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      );

      await updateDoc(eventRef, { items: updatedItems });
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleItemSubmit = async (itemData) => {
    if (editingItem) {
      await updateItemInEvent(event.id, itemData);
    } else {
      await addItemToEvent(event.id, itemData);
    }
    setIsItemModalOpen(false);
  };

  const toggleItemExpansion = (itemId) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Functions for Confirming Deleting Modal
  const handleDeleteEvent = async () => {
    try {
      const eventRef = doc(db, "events", eventId);
      await deleteDoc(eventRef);
      console.log("Event deleted:", eventId);
      navigate("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const eventRef = doc(db, "events", eventId);

    try {
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        const { items } = eventDoc.data();
        const itemToRemove = items.find((item) => item.id === itemId);
        if (itemToRemove) {
          // Delete associated image from storage if it exists
          if (
            itemToRemove.imageUrl &&
            itemToRemove.imageUrl.includes("firebase")
          ) {
            try {
              const { getStorage, ref, deleteObject } = await import(
                "firebase/storage"
              );
              const storage = getStorage();
              const imageRef = ref(storage, itemToRemove.imageUrl);
              await deleteObject(imageRef);
              console.log("Associated image deleted from storage");
            } catch (imageError) {
              console.error("Error deleting image from storage:", imageError);
              // Continue with item deletion even if image deletion fails
            }
          }

          // Remove item from event
          await updateDoc(eventRef, {
            items: arrayRemove(itemToRemove),
          });
        }
      } else {
        console.log("Event not found!");
      }
    } catch (error) {
      console.error("Error removing item from event:", error);
    }
    console.log("Item deleted:", itemId);
    setIsDeleteModalOpen(false);
  };

  const openDeleteModalForEvent = () => {
    setItemToDeleteName(event.title);
    setItemToDelete(eventId);
    setIsDeleteModalOpen(true);
  };

  const openDeleteModalForItem = (item) => {
    setItemToDeleteName(item.title);
    setItemToDelete(item.id);
    setIsDeleteModalOpen(true);
  };

  const renderCategoryList = (categoryName, items, categoryColor) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className={`mb-3 text-lg font-bold ${categoryColor}`}>
          {categoryName}s ({items.length})
        </h3>
        <div className="space-y-2">
          {items.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            return (
              <div key={item.id} className="rounded-lg bg-rose-50 shadow-md">
                <div
                  className="flex cursor-pointer items-center justify-between p-4"
                  onClick={() => toggleItemExpansion(item.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-primaryDark">
                        {item.title}
                      </h4>
                      {isExpanded ? (
                        <FiChevronDown className="text-primaryDark" />
                      ) : (
                        <FiChevronRight className="text-primaryDark" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.assignee || "Unassigned"}
                    </p>
                    {item.dietary && item.dietary.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {item.dietary.map((restriction, index) => {
                          const dietaryData =
                            dietaryIcons[restriction.toLowerCase()];
                          return (
                            dietaryData && (
                              <span
                                key={index}
                                className={`flex items-center text-lg ${dietaryData.color}`}
                                title={restriction}
                              >
                                {dietaryData.icon}
                              </span>
                            )
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-rose-200 px-4 pb-4">
                    <div className="mt-3 flex flex-col items-start justify-between">
                      <div className="flex-1">
                        {/* Placeholder for item description */}
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

                        {/* Placeholder for item image */}
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

                        {/* Additional details can go here */}
                        {item.servings && (
                          <p className="mb-2 text-sm text-gray-600">
                            <span className="font-medium">Servings:</span>{" "}
                            {item.servings}
                          </p>
                        )}
                      </div>

                      <div className="flex w-full justify-end gap-2 p-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditItem(item);
                          }}
                          className="rounded-full bg-primaryRed p-2 text-white hover:bg-secondaryRed"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModalForItem(item);
                          }}
                          className="rounded-full bg-primaryRed p-2 text-white hover:bg-secondaryRed"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!event) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-t-4 border-primaryRed"></div>
        <p className="text-lg font-medium text-primaryDark">
          Loading event, please wait...
        </p>
      </div>
    );
  }

  return (
    <div className="m-4 mb-10 max-w-7xl rounded-2xl bg-white shadow-md">
      <div className="flex w-full items-center justify-center rounded-tl-2xl rounded-tr-2xl bg-primaryRed px-4 py-2">
        <h1 className="text-center text-xl font-bold text-white">
          {event.title}
        </h1>
      </div>

      <div className="p-4 md:p-6">
        {/* Mobile layout */}
        <div className="md:hidden">
          <div className="mb-6">
            <div className="relative">
              {/* Action buttons - vertical on mobile */}
              <div className="absolute right-0 top-0">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={openDeleteModalForEvent}
                    className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                  >
                    <MdDelete className="text-lg text-white" />
                  </button>
                  <button
                    onClick={() => setEditingEvent(true)}
                    className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                  >
                    <FiEdit className="text-lg text-white" />
                  </button>
                  <button
                    onClick={handleParticipantsModal}
                    className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                  >
                    <BsPeople className="text-lg text-white" />
                  </button>
                  <ShareButton eventId={eventId} eventTitle={event.title} />
                </div>
              </div>

              {/* Event info */}
              <div className="pr-20">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-primaryRed" />
                    <p className="font-bold">{event.date}</p>
                  </div>
                  <div className="flex items-center">
                    <MdOutlineAccessTimeFilled className="mr-2 text-primaryRed" />
                    <p className="font-bold">{formatTime(event.time)}</p>
                  </div>
                  <div className="flex items-center">
                    <TiLocation className="mr-2 text-primaryRed" />
                    <p className="font-bold">{event.location}</p>
                  </div>
                </div>
                <p className="text-gray-700">{event.description}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <h3 className="mb-3 font-bold text-gray-800">
                Item Distribution
              </h3>
              {progressData.length > 0 ? (
                <>
                  <div className="mb-4 h-6 w-full rounded-full bg-gray-200">
                    <div className="flex h-6 rounded-full">
                      {progressData.map((cat, index) => (
                        <div
                          key={cat.name}
                          className={`${cat.color} ${index === 0 ? "rounded-l-full" : ""} ${index === progressData.length - 1 ? "rounded-r-full" : ""} flex items-center justify-center text-xs font-bold text-white`}
                          style={{ width: `${cat.percentage}%` }}
                        >
                          {cat.count > 0 && cat.percentage > 10
                            ? cat.count
                            : ""}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {progressData.map((cat) => {
                      const IconComponent = cat.icon;
                      return (
                        <div key={cat.name} className="flex items-center">
                          <IconComponent
                            className={`mr-2 text-lg ${cat.textColor}`}
                          />
                          <span className="font-bold">
                            {cat.name}: {cat.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No items added yet</p>
              )}
            </div>
          </div>

          {/* Mobile items layout */}
          <div>
            {renderCategoryList(
              "Main",
              groupedItems.Main || [],
              getCategoryTextColor("Main"),
            )}
            {renderCategoryList(
              "Side",
              groupedItems.Side || [],
              getCategoryTextColor("Side"),
            )}
            {renderCategoryList(
              "Dessert",
              groupedItems.Dessert || [],
              getCategoryTextColor("Dessert"),
            )}
            {renderCategoryList(
              "Beverage",
              groupedItems.Beverage || [],
              getCategoryTextColor("Beverage"),
            )}

            {/* Empty state */}
            {(!event.items || event.items.length === 0) && (
              <div className="py-12 text-center">
                <p className="mb-4 text-lg text-gray-500">No items added yet</p>
                <p className="text-gray-400">
                  Click the + button to add your first item!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:block">
          {/* Event details and buttons section */}
          <div className="mb-8">
            {/* Event details with horizontal buttons */}
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-primaryRed" />
                    <p className="font-bold">{event.date}</p>
                  </div>
                  <div className="flex items-center">
                    <MdOutlineAccessTimeFilled className="mr-2 text-primaryRed" />
                    <p className="font-bold">{formatTime(event.time)}</p>
                  </div>
                  <div className="flex items-center">
                    <TiLocation className="mr-2 text-primaryRed" />
                    <p className="font-bold">{event.location}</p>
                  </div>
                </div>
                <p className="text-gray-700">{event.description}</p>
              </div>

              {/* Action buttons - horizontal on desktop */}
              <div className="ml-6 flex gap-2">
                <button
                  onClick={openDeleteModalForEvent}
                  className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                >
                  <MdDelete className="text-lg text-white" />
                </button>
                <button
                  onClick={() => setEditingEvent(true)}
                  className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                >
                  <FiEdit className="text-lg text-white" />
                </button>
                <button
                  onClick={handleParticipantsModal}
                  className="flex rounded-full bg-primaryRed p-2 hover:bg-secondaryRed"
                >
                  <BsPeople className="text-lg text-white" />
                </button>
                <ShareButton eventId={eventId} eventTitle={event.title} />
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <h3 className="mb-3 font-bold text-gray-800">
                Item Distribution
              </h3>
              {progressData.length > 0 ? (
                <>
                  <div className="mb-4 h-6 w-full rounded-full bg-gray-200">
                    <div className="flex h-6 rounded-full">
                      {progressData.map((cat, index) => (
                        <div
                          key={cat.name}
                          className={`${cat.color} ${index === 0 ? "rounded-l-full" : ""} ${index === progressData.length - 1 ? "rounded-r-full" : ""} flex items-center justify-center text-xs font-bold text-white`}
                          style={{ width: `${cat.percentage}%` }}
                        >
                          {cat.count > 0 && cat.percentage > 10
                            ? cat.count
                            : ""}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    {progressData.map((cat) => {
                      const IconComponent = cat.icon;
                      return (
                        <div key={cat.name} className="flex items-center">
                          <IconComponent
                            className={`mr-2 text-lg ${cat.textColor}`}
                          />
                          <span className="font-bold">
                            {cat.name}: {cat.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">No items added yet</p>
              )}
            </div>
          </div>

          {/* Four column layout for categories */}
          <div className="grid grid-cols-4 gap-6">
            <div>
              {renderCategoryList(
                "Main",
                groupedItems.Main || [],
                getCategoryTextColor("Main"),
              )}
            </div>
            <div>
              {renderCategoryList(
                "Side",
                groupedItems.Side || [],
                getCategoryTextColor("Side"),
              )}
            </div>
            <div>
              {renderCategoryList(
                "Dessert",
                groupedItems.Dessert || [],
                getCategoryTextColor("Dessert"),
              )}
            </div>
            <div>
              {renderCategoryList(
                "Beverage",
                groupedItems.Beverage || [],
                getCategoryTextColor("Beverage"),
              )}
            </div>
          </div>

          {/* Empty state for desktop */}
          {(!event.items || event.items.length === 0) && (
            <div className="py-12 text-center">
              <p className="mb-4 text-lg text-gray-500">No items added yet</p>
              <p className="text-gray-400">
                Click the + button to add your first item!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add item button */}
      <button
        onClick={handleAddItem}
        className="fixed bottom-24 right-4 rounded-full bg-primaryRed p-4 text-white shadow-lg transition-colors hover:bg-secondaryRed"
      >
        <FaPlus />
      </button>

      {/* Modals */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        closeModal={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={
          itemToDelete === event.id
            ? handleDeleteEvent
            : () => handleDeleteItem(itemToDelete)
        }
        deleteItemName={itemToDeleteName}
      />

      {isParticipantModalOpen && (
        <ParticipantsModal
          isOpen={isParticipantModalOpen}
          onClose={handleParticipantsModal}
          participants={participants}
        />
      )}

      {editingEvent && (
        <EventModal
          closeModal={() => setEditingEvent(false)}
          onSubmit={handleEdit}
          initialData={event}
        />
      )}

      {isItemModalOpen && (
        <ItemModal
          closeModal={() => setIsItemModalOpen(false)}
          onSubmit={handleItemSubmit}
          initialData={editingItem}
          mode={editingItem ? "edit" : "add"}
        />
      )}
    </div>
  );
}

export default EventDetails;
