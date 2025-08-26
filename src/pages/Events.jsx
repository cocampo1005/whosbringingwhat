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

export default function Events() {
  const { currentUser } = useAuth();
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");

  const navigate = useNavigate();
  const normalize = (s = "") => s.trim().replace(/\s+/g, " ").toLowerCase();

  const myName = normalize(currentUser?.name || "");

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    if (!currentUser) return [];

    return events.filter((ev) => {
      const items = Array.isArray(ev.items) ? ev.items : [];
      // “Contributed to” = at least one item that’s mine
      return items.some((it) => {
        const hasId = !!it?.assigneeId;
        const idMatches = it?.assigneeId === currentUser.uid;
        const nameMatches =
          !hasId && myName && normalize(it?.assignee || "") === myName;
        return idMatches || nameMatches;
      });
    });
  }, [events, filter, currentUser, myName]);

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
    <div className="max-w-6xl mx-auto px-4 pt-20">
      {/* Placeholder for event content */}

      {(
        filter === "all" ? events.length === 0 : filteredEvents.length === 0
      ) ? (
        <p className="text-center text-gray-600">
          {filter === "all"
            ? "Your events will appear here."
            : "No events with your contributions yet."}
        </p>
      ) : (
        <>
          {/* <div className="mb-12 flex items-center justify-start gap-4"> */}
          <div className="mb-12 flex flex-wrap items-center gap-4 justify-between sm:justify-start sm:gap-8">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  filter === "all"
                    ? "bg-primaryRed text-white"
                    : "text-primaryDark hover:bg-gray-50"
                }`}
                aria-pressed={filter === "all"}
              >
                All Events
              </button>
              <button
                type="button"
                onClick={() => setFilter("mine")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  filter === "mine"
                    ? "bg-primaryRed text-white"
                    : "text-primaryDark hover:bg-gray-50"
                }`}
                aria-pressed={filter === "mine"}
              >
                Contributed Events
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {filter === "all" ? events.length : filteredEvents.length} events
            </span>
          </div>

          <EventCard events={filteredEvents} />
        </>
      )}

      {showAddEventModal && (
        <EventModal
          closeModal={() => setShowAddEventModal(false)}
          onSubmit={addEventToFirestore}
        />
      )}

      <button
        onClick={handleAddEvent}
        className="fixed bottom-24 right-4 rounded-full bg-primaryRed p-4 text-white"
      >
        <FaPlus />
      </button>
    </div>
  );
}
