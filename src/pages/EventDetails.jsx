import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Adjust based on your Firebase setup

function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);

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

  if (!event) return <p>Loading event details...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <p className="text-gray-600">{event.date}</p>
      <p className="mt-4">{event.description}</p>
      <p className="mt-2">Location: {event.location}</p>
    </div>
  );
}

export default EventDetails;
