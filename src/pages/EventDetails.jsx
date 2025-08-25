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
import { FiEdit } from "react-icons/fi";
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
import ItemModal from "../components/ItemModal";
import ItemCard from "../components/ItemCard";
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

  const navigate = useNavigate();

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

  const updateParticipants = (itemAssignees) => {
    const cleanAssignees = itemAssignees
      .map((assignee) => assignee.replace(/\s+/g, " ").trim().toLowerCase())
      .filter(Boolean);

    setParticipants((prev) => {
      const allAssignees = new Set([...prev, ...cleanAssignees]);
      return Array.from(allAssignees);
    });
  };

  const handleParticipantsModal = () => {
    setIsParticipantModalOpen(!isParticipantModalOpen);
  };

  const groupItemsByCategory = (items) => {
    const categoryOrder = ["Main", "Side", "Dessert", "Beverage"];
    const sortedItems = items.sort((a, b) => {
      const categoryIndexA = categoryOrder.indexOf(a.category);
      const categoryIndexB = categoryOrder.indexOf(b.category);

      if (categoryIndexA === categoryIndexB) {
        return a.title.localeCompare(b.title);
      }
      return categoryIndexA - categoryIndexB;
    });

    return sortedItems;
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
  const categoryCounts = event ? getCategoryCounts(event.items || []) : {};

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
    console.log(itemToDelete);
  };

  const openDeleteModalForItem = (item) => {
    setItemToDeleteName(item.title);
    setItemToDelete(item.id);
    setIsDeleteModalOpen(true);
  };

  if (!event) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-t-4 border-primaryRed"></div>
        <p className="text-lg font-medium text-primaryDark">
          Logging event, please wait...
        </p>
      </div>
    );
  }

  return (
    <div className="m-4 mb-10 rounded-2xl bg-white shadow-md md:event-details">
      <div className="flex w-full items-center justify-center rounded-tl-2xl rounded-tr-2xl bg-primaryRed px-4 py-2">
        <h1 className="text-center text-xl font-bold text-white">
          {event.title}
        </h1>
      </div>
      <div className="relative z-0 p-4">
        <MdDelete
          onClick={openDeleteModalForEvent}
          className="absolute right-4 top-4 text-2xl text-primaryRed"
        />
        <div>
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
          <p className="pt-2">{event.description}</p>
        </div>
        <div className="flex justify-around py-4">
          <ShareButton eventId={eventId} eventTitle={event.title} />
          <button
            onClick={() => setEditingEvent(true)}
            className="flex rounded-full bg-primaryRed p-3"
          >
            <FiEdit className="text-lg text-white" />
          </button>
          <button
            onClick={handleParticipantsModal}
            className="flex rounded-full bg-primaryRed p-3"
          >
            <BsPeople className="text-lg text-white" />
          </button>
        </div>
        <div className="flex justify-between pb-4">
          <div className="flex flex-col items-center justify-end">
            <GiChickenOven className="text-3xl text-red-900" />
            <p className="text-sm font-bold text-red-900">
              Mains: {categoryCounts.Main || 0}
            </p>
          </div>
          <div className="flex flex-col items-center justify-end">
            <FaBowlFood className="text-2xl text-yellow-600" />
            <p className="text-sm font-bold text-yellow-600">
              Sides: {categoryCounts.Side || 0}
            </p>
          </div>
          <div className="flex flex-col items-center justify-end">
            <GiCakeSlice className="text-2xl text-rose-600" />
            <p className="text-sm font-bold text-rose-600">
              Desserts: {categoryCounts.Dessert || 0}
            </p>
          </div>
          <div className="flex flex-col items-center justify-end">
            <FaWineGlassAlt className="h-[23px] text-2xl text-fuchsia-900" />
            <p className="text-sm font-bold text-fuchsia-900">
              Drinks: {categoryCounts.Beverage || 0}
            </p>
          </div>
        </div>
        <ItemCard
          items={groupItemsByCategory(event?.items)}
          edit={handleEditItem}
          openDeleteModal={openDeleteModalForItem}
          updateParticipants={updateParticipants}
        />
        <button
          onClick={handleAddItem}
          className="fixed bottom-24 right-4 rounded-full bg-primaryRed p-4 text-white"
        >
          <FaPlus />
        </button>

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
    </div>
  );
}

export default EventDetails;
