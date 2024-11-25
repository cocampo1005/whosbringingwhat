import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { formatTime } from "../utils/formatters";
import EventModal from "../components/EventModal";
import ShareButton from "../components/ShareButton";
import { FiEdit } from "react-icons/fi";
import { BsPeople } from "react-icons/bs";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { TiLocation } from "react-icons/ti";

function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() });
        } else {
          console.error("Event not found!");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleEdit = async (updatedEventData) => {
    try {
      // Reference the document in Firestore
      const eventRef = doc(db, "events", eventId);

      // Update the document with the new data
      await updateDoc(eventRef, updatedEventData);

      // Update the local state
      setEvent((prev) => ({ ...prev, ...updatedEventData }));

      console.log("Event updated successfully!");
    } catch (error) {
      console.error("Error updating event:", error);
    } finally {
      setIsEditing(false);
    }
  };

  if (!event) return <p>Loading event details...</p>;

  return (
    <div className="m-4 rounded-lg bg-white p-4 shadow-md">
      <h1 className="pb-6 text-2xl font-bold">{event.title}</h1>
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
          onClick={() => setIsEditing(true)}
          className="flex rounded-full bg-primaryRed p-2"
        >
          <FiEdit className="text-md text-white" />
        </button>
        <button
          // onClick={}
          className="flex rounded-full bg-primaryRed p-2"
        >
          <BsPeople className="text-md text-white" />
        </button>
      </div>

      {isEditing && (
        <EventModal
          closeModal={() => setIsEditing(false)}
          onSubmit={handleEdit}
          initialData={event}
        />
      )}
    </div>
  );
}

export default EventDetails;
