import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { RiDrinks2Fill } from "react-icons/ri";
import { MdDelete } from "react-icons/md";

import ItemModal from "../components/ItemModal";
import ItemCard from "../components/ItemCard";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToDeleteName, setItemToDeleteName] = useState("");

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

  const getUniqueParticipants = (items) => {
    const participants = items.map((item) => item.assignee);
    return [...new Set(participants)];
  };

  const groupItemsByCategory = (items) => {
    // Define custom category order
    const categoryOrder = ["Main", "Side", "Dessert", "Beverage"];

    // Sort the items based on the custom category order
    const sortedItems = items.sort((a, b) => {
      const categoryIndexA = categoryOrder.indexOf(a.category);
      const categoryIndexB = categoryOrder.indexOf(b.category);

      // Compare by category index, if the categories are the same, then compare by title
      if (categoryIndexA === categoryIndexB) {
        return a.title.localeCompare(b.title); // Sort by title within the same category
      }

      return categoryIndexA - categoryIndexB; // Sort by custom category order
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

  if (!event) return <p>Loading event details...</p>;

  return (
    <div className="m-4 mb-10 rounded-lg bg-white p-4 shadow-md">
      <div className="flex items-start justify-between">
        <h1 className="pb-6 text-2xl font-bold">{event.title}</h1>
        <MdDelete
          onClick={openDeleteModalForEvent}
          className="text-2xl text-primaryRed"
        />
      </div>
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
          // onClick={}
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
          <GiCakeSlice className="text-2xl text-rose-500" />
          <p className="text-sm font-bold text-rose-500">
            Desserts: {categoryCounts.Dessert || 0}
          </p>
        </div>
        <div className="flex flex-col items-center justify-end">
          <RiDrinks2Fill className="text-2xl text-blue-600" />
          <p className="text-sm font-bold text-blue-600">
            Drinks: {categoryCounts.Beverage || 0}
          </p>
        </div>
      </div>
      <ItemCard
        items={groupItemsByCategory(event.items)}
        edit={handleEditItem}
        openDeleteModal={openDeleteModalForItem}
        onDelete={handleDeleteItem}
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
