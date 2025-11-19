import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import EventModal from "../components/EventModal";
import { FaPlus } from "react-icons/fa6";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import EventCard from "../components/EventCard";
import { useNavigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";

export default function Events() {
  const { currentUser } = useAuth();
  const role = useRole();
  const isAdmin = role === "admin";

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("upcoming");

  const navigate = useNavigate();

  const memberEvents = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return events;

    return events.filter((ev) => {
      const members = Array.isArray(ev.members) ? ev.members : [];
      const isMember = members.includes(currentUser.uid);
      const isHost =
        ev.hostId === currentUser.uid || ev.createdById === currentUser.uid;

      return isMember || isHost;
    });
  }, [events, currentUser, isAdmin]);

  const eventsByDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = [];
    const past = [];

    memberEvents.forEach((ev) => {
      let eventDate = null;

      if (ev.date instanceof Date) {
        eventDate = ev.date;
      } else if (typeof ev.date === "string") {
        const parsed = new Date(ev.date);
        if (!Number.isNaN(parsed.getTime())) {
          eventDate = parsed;
        }
      }

      if (!eventDate) {
        // If we cannot parse the date, treat it as upcoming
        upcoming.push(ev);
        return;
      }

      const normalized = new Date(eventDate);
      normalized.setHours(0, 0, 0, 0);

      if (normalized < today) {
        past.push(ev);
      } else {
        upcoming.push(ev);
      }
    });

    return { upcoming, past };
  }, [memberEvents]);

  const displayedEvents =
    tab === "upcoming" ? eventsByDate.upcoming : eventsByDate.past;
  const hasEvents = displayedEvents.length > 0;

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      const docRef = await addDoc(collection(db, "events"), {
        ...eventData,
        createdAt: serverTimestamp(),
      });
      setShowAddEventModal(false);

      // Navigate to the newly created event
      navigate(`/events/${docRef.id}`);
    } catch (error) {
      console.error("Error adding event to Firestore: ", error);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-8 pt-8">
      {/* Tabs and header should always be visible */}
      <div className="mb-9 flex w-full items-center justify-between gap-4 sm:gap-8">
        <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-start">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-md">
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tab === "upcoming"
                  ? "bg-primaryRed text-white"
                  : "text-primaryDark hover:bg-gray-50"
              }`}
              aria-pressed={tab === "upcoming"}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setTab("past")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tab === "past"
                  ? "bg-primaryRed text-white"
                  : "text-primaryDark hover:bg-gray-50"
              }`}
              aria-pressed={tab === "past"}
            >
              Previous
            </button>
          </div>
          <span className="text-xs text-gray-500">
            {displayedEvents.length} events
          </span>
        </div>
        <button
          className="hidden items-center gap-2 rounded-full bg-primaryRed px-4 py-2 text-sm font-semibold text-white hover:bg-secondaryRed md:flex"
          onClick={handleAddEvent}
        >
          <FaPlus />
          <span>Add Event</span>
        </button>
      </div>

      {/* Content under the tabs */}
      {hasEvents ? (
        <EventCard events={displayedEvents} />
      ) : (
        <p className="text-center text-gray-600">
          {tab === "upcoming"
            ? "You do not have any upcoming events yet."
            : "You do not have any previous events yet."}
        </p>
      )}

      {showAddEventModal && (
        <EventModal
          closeModal={() => setShowAddEventModal(false)}
          onSubmit={addEventToFirestore}
        />
      )}

      <button
        onClick={handleAddEvent}
        className="fixed bottom-24 right-4 rounded-full bg-primaryRed p-4 text-white shadow-md md:hidden"
      >
        <FaPlus />
      </button>
    </div>
  );
}
