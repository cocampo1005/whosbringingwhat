import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import AddNewEventModal from "../components/AddNewEventModal";
import { FaPlus } from "react-icons/fa6";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import EventCard from "../components/EventCard";

export default function Events() {
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddEvent = () => {
    setShowAddEventModal(true);
  };

  const addEventToFirestore = async (eventData) => {
    try {
      await addDoc(collection(db, "events"), {
        ...eventData,
        createdAt: serverTimestamp(),
      });
      setShowAddEventModal(false);
    } catch (error) {
      console.error("Error adding event to Firestore: ", error);
    }
  };

  return (
    <div className="w-screen flex-grow p-4">
      {/* Placeholder for event content */}

      {events.length === 0 ? (
        <p className="text-center text-gray-600">
          Your events will appear here.
        </p>
      ) : (
        <EventCard events={events} />
      )}

      {showAddEventModal && (
        <AddNewEventModal
          closeModal={() => setShowAddEventModal(false)}
          addEvent={addEventToFirestore}
        />
      )}

      <button
        onClick={handleAddEvent}
        className="bg-primaryRed absolute bottom-4 right-4 rounded-full p-4 text-white"
      >
        <FaPlus />
      </button>
    </div>
  );
}
