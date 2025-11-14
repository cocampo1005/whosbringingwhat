import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import EventModal from "../components/EventModal";
import { FaPlus, FaFilter } from "react-icons/fa6";
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

function normalizeString(s = "") {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

// Turn an event's date and time into a JS Date for sorting and comparison
function parseEventDateTime(ev) {
  if (!ev?.date) return null;

  const raw = String(ev.date);

  // Expecting something like "Thu, November 27, 2025"
  // Strip weekday and rebuild "November 27, 2025"
  let coreDate = raw;
  const parts = raw.split(",");
  if (parts.length >= 3) {
    const monthDay = parts[1].trim(); // "November 27"
    const year = parts[2].trim(); // "2025"
    coreDate = `${monthDay}, ${year}`; // "November 27, 2025"
  }

  const time = ev.time || "00:00"; // "HH:mm"
  const dateTimeString = `${coreDate} ${time}`;

  const dt = new Date(dateTimeString);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function Events() {
  const { currentUser } = useAuth();
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [events, setEvents] = useState([]);

  // Ownership filter: "all" or "mine"
  const [ownershipFilter, setOwnershipFilter] = useState("all");

  // Time filter: "upcoming" or "past"
  const [timeFilter, setTimeFilter] = useState("upcoming");

  // Controls visibility of the filter panel
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const myName = normalizeString(currentUser?.name || "");

  // Filter for "All events" vs "Contributed events"
  const baseEvents = useMemo(() => {
    if (ownershipFilter === "all") return events;
    if (!currentUser) return [];

    return events.filter((ev) => {
      const items = Array.isArray(ev.items) ? ev.items : [];
      return items.some((it) => {
        const hasId = !!it?.assigneeId;
        const idMatches = it?.assigneeId === currentUser.uid;
        const nameMatches =
          !hasId && myName && normalizeString(it?.assignee || "") === myName;
        return idMatches || nameMatches;
      });
    });
  }, [events, ownershipFilter, currentUser, myName]);

  // Split into upcoming and past buckets once, then pick the active one via timeFilter
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const upcomingWithDate = [];
    const pastWithDate = [];

    baseEvents.forEach((ev) => {
      const dt = parseEventDateTime(ev);

      if (!dt) {
        upcomingWithDate.push({ ev, dt: null });
        return;
      }

      if (dt >= now) {
        upcomingWithDate.push({ ev, dt });
      } else {
        pastWithDate.push({ ev, dt });
      }
    });

    upcomingWithDate.sort((a, b) => {
      if (!a.dt && !b.dt) return 0;
      if (!a.dt) return 1;
      if (!b.dt) return -1;
      return a.dt - b.dt;
    });

    pastWithDate.sort((a, b) => {
      if (!a.dt && !b.dt) return 0;
      if (!a.dt) return 1;
      if (!b.dt) return -1;
      return b.dt - a.dt;
    });

    return {
      upcomingEvents: upcomingWithDate.map(({ ev }) => ev),
      pastEvents: pastWithDate.map(({ ev }) => ev),
    };
  }, [baseEvents]);

  const visibleEvents = timeFilter === "upcoming" ? upcomingEvents : pastEvents;

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
      navigate(`/events/${docRef.id}`);
    } catch (error) {
      console.error("Error adding event to Firestore: ", error);
    }
  };

  const hasAnyEvents =
    ownershipFilter === "all" ? events.length > 0 : baseEvents.length > 0;

  const emptyMessage = (() => {
    if (!hasAnyEvents) {
      return ownershipFilter === "all"
        ? "Your events will appear here."
        : "No events with your contributions yet.";
    }

    if (timeFilter === "upcoming") {
      return ownershipFilter === "all"
        ? "There are no upcoming events."
        : "There are no upcoming events with your contributions.";
    } else {
      return ownershipFilter === "all"
        ? "There are no past events yet."
        : "There are no past events with your contributions.";
    }
  })();

  const timeLabel = timeFilter === "upcoming" ? "Upcoming" : "Past";
  const ownershipLabel =
    ownershipFilter === "all" ? "All events" : "My contributions";

  const filterSummary = `${timeLabel} • ${ownershipLabel}`;

  return (
    <div className="mx-auto max-w-5xl pb-8 pt-8">
      {/* Header with title, summary and actions */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-primaryDark sm:text-xl">
            Events
          </h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Plan upcoming gatherings and see what everyone is bringing.
          </p>

          {/* Summary, filter button, and filters */}
          <div className="mt-2 flex flex-col gap-2">
            {/* Top row: summary + filter button */}
            <div className="flex items-center justify-between">
              <div className="flex w-full justify-between md:w-auto md:gap-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-primaryRed" />
                  <span className="text-xs font-medium text-gray-700">
                    {filterSummary}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {visibleEvents.length}{" "}
                    {visibleEvents.length === 1 ? "event" : "events"}
                  </span>
                </div>

                {/* Icon-only filter button */}
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-primaryRed text-white hover:bg-secondaryRed"
                  aria-label={showFilters ? "Hide filters" : "Show filters"}
                >
                  <FaFilter className="text-sm" />
                </button>
              </div>

              <div>
                {/* Desktop filters inline to the right of the icon */}
                {showFilters && (
                  <div className="hidden items-center gap-5 sm:flex">
                    {/* When group */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        When
                      </span>
                      <div className="inline-flex rounded-full bg-white p-0.5 shadow-md">
                        <button
                          type="button"
                          onClick={() => setTimeFilter("upcoming")}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            timeFilter === "upcoming"
                              ? "bg-primaryRed text-white"
                              : "text-gray-700 hover:bg-white/60"
                          }`}
                          aria-pressed={timeFilter === "upcoming"}
                        >
                          Upcoming
                        </button>
                        <button
                          type="button"
                          onClick={() => setTimeFilter("past")}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            timeFilter === "past"
                              ? "bg-primaryRed text-white"
                              : "text-gray-700 hover:bg-white/60"
                          }`}
                          aria-pressed={timeFilter === "past"}
                        >
                          Past
                        </button>
                      </div>
                    </div>

                    {/* Participation group */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Participation
                      </span>
                      <div className="inline-flex rounded-full bg-white p-0.5 shadow-md">
                        <button
                          type="button"
                          onClick={() => setOwnershipFilter("all")}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            ownershipFilter === "all"
                              ? "bg-primaryRed text-white"
                              : "text-gray-700 hover:bg-white/60"
                          }`}
                          aria-pressed={ownershipFilter === "all"}
                        >
                          All events
                        </button>
                        <button
                          type="button"
                          onClick={() => setOwnershipFilter("mine")}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            ownershipFilter === "mine"
                              ? "bg-primaryRed text-white"
                              : "text-gray-700 hover:bg-white/60"
                          }`}
                          aria-pressed={ownershipFilter === "mine"}
                        >
                          My contributions
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile filters: stacked underneath, full width */}
            {showFilters && (
              <div className="flex flex-col gap-2 sm:hidden">
                {/* When group */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    When
                  </span>
                  <div className="inline-flex w-full rounded-full bg-white p-0.5 shadow-md">
                    <button
                      type="button"
                      onClick={() => setTimeFilter("upcoming")}
                      className={`flex-1 rounded-full px-2.5 py-1 text-center text-xs font-semibold transition ${
                        timeFilter === "upcoming"
                          ? "bg-primaryRed text-white"
                          : "text-gray-700 hover:bg-white/60"
                      }`}
                      aria-pressed={timeFilter === "upcoming"}
                    >
                      Upcoming
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeFilter("past")}
                      className={`flex-1 rounded-full px-2.5 py-1 text-center text-xs font-semibold transition ${
                        timeFilter === "past"
                          ? "bg-primaryRed text-white"
                          : "text-gray-700 hover:bg-white/60"
                      }`}
                      aria-pressed={timeFilter === "past"}
                    >
                      Past
                    </button>
                  </div>
                </div>

                {/* Participation group */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Participation
                  </span>
                  <div className="inline-flex w-full rounded-full bg-white p-0.5 shadow-md">
                    <button
                      type="button"
                      onClick={() => setOwnershipFilter("all")}
                      className={`flex-1 rounded-full px-2.5 py-1 text-center text-xs font-semibold transition ${
                        ownershipFilter === "all"
                          ? "bg-primaryRed text-white"
                          : "text-gray-700 hover:bg-white/60"
                      }`}
                      aria-pressed={ownershipFilter === "all"}
                    >
                      All events
                    </button>
                    <button
                      type="button"
                      onClick={() => setOwnershipFilter("mine")}
                      className={`flex-1 rounded-full px-2.5 py-1 text-center text-xs font-semibold transition ${
                        ownershipFilter === "mine"
                          ? "bg-primaryRed text-white"
                          : "text-gray-700 hover:bg-white/60"
                      }`}
                      aria-pressed={ownershipFilter === "mine"}
                    >
                      My contributions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Add button */}
        <button
          className="hidden items-center gap-2 rounded-xl bg-primaryRed px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondaryRed md:flex"
          onClick={handleAddEvent}
        >
          <FaPlus className="text-xs" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Event list or empty state for current filters */}
      {visibleEvents.length > 0 ? (
        <EventCard events={visibleEvents} />
      ) : (
        <p className="mt-8 text-center text-gray-600">{emptyMessage}</p>
      )}

      {showAddEventModal && (
        <EventModal
          closeModal={() => setShowAddEventModal(false)}
          onSubmit={addEventToFirestore}
        />
      )}

      {/* Mobile floating Add button */}
      <button
        onClick={handleAddEvent}
        className="fixed bottom-24 right-4 rounded-full bg-primaryRed p-4 text-white shadow-md md:hidden"
      >
        <FaPlus />
      </button>
    </div>
  );
}
