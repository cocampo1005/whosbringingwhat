import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import EventModal from "../components/EventModal";
import { FaPlus } from "react-icons/fa6";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  endBefore,
  where,
  or,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import EventCard from "../components/EventCard";
import { useNavigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";
import { pickRandomEventBannerColor } from "../constants/eventBannerColors";
import CookingLoader from "../components/CookingLoader";

export default function Events() {
  const { currentUser } = useAuth();
  const role = useRole();
  const isAdmin = role === "admin";

  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState("upcoming");

  const isSidePanelOpen = showAddEventModal;

  const navigate = useNavigate();

  // Migration Effect
  useEffect(() => {
    const migrateEvents = async () => {
      if (!currentUser) return;
      try {
        // Fetch all events to check for legacy dates
        // We limit to a reasonable number to avoid reading too many if DB is huge, 
        // but for migration we might want to catch all. 
        // Let's assume < 500 events for now or just query ones that look like legacy?
        // Actually, we can't easily query for "date format".
        // We'll just fetch recent 100 events and check.
        const q = query(collection(db, "events"), limit(100));
        const snapshot = await getDocs(q);
        
        const updates = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (typeof data.date === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
            // It's a legacy date string, try to parse and update
            const parsed = new Date(data.date);
            if (!isNaN(parsed)) {
              const offset = parsed.getTimezoneOffset();
              const adjusted = new Date(parsed.getTime() - offset * 60 * 1000);
              const isoDate = adjusted.toISOString().split("T")[0];
              updates.push(updateDoc(doc(db, "events", docSnap.id), { date: isoDate }));
            }
          }
        });

        if (updates.length > 0) {
          await Promise.all(updates);
          console.log(`Migrated ${updates.length} events to ISO date format.`);
        }
      } catch (error) {
        console.error("Migration error:", error);
      }
    };

    migrateEvents();
  }, [currentUser]);

  const fetchEvents = async (isLoadMore = false) => {
    if (!currentUser) return;
    
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoadingEvents(true);
      }

      const today = new Date();
      const offset = today.getTimezoneOffset();
      const adjustedToday = new Date(today.getTime() - offset * 60 * 1000);
      const todayISO = adjustedToday.toISOString().split("T")[0];

      let q = query(
        collection(db, "events"),
        or(
          where("members", "array-contains", currentUser.uid),
          where("hostId", "==", currentUser.uid),
          where("createdById", "==", currentUser.uid)
        )
      );

      // Common: Filter by date relative to today
      if (tab === "upcoming") {
        q = query(
          q,
          where("date", ">=", todayISO),
          orderBy("date", "asc")
        );
      } else {
        // For past events, we still use 'asc' order to utilize the existing index.
        // We filter for dates < today.
        q = query(
          q,
          where("date", "<", todayISO),
          orderBy("date", "asc")
        );
      }

      // Pagination and Limits
      if (tab === "upcoming") {
        // Standard forward pagination
        if (isLoadMore && lastDoc) {
          q = query(q, startAfter(lastDoc));
        }
        q = query(q, limit(10));
      } else {
        // "Previous" tab: We want the *latest* past events (closest to today).
        // Since the order is 'asc' (oldest -> newest), the ones closest to today are at the END.
        // So we use limitToLast(10).
        
        if (isLoadMore && lastDoc) {
          // For loading *older* events (which are 'before' in the asc list),
          // we use endBefore(lastDoc).
          q = query(q, endBefore(lastDoc));
        }
        q = query(q, limitToLast(10));
      }

      const snapshot = await getDocs(q);
      let newEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (tab === "past") {
        // The query returns events in Ascending order (Oldest -> Newest).
        // We want to display them Newest -> Oldest.
        newEvents.reverse();
      }

      if (isLoadMore) {
        setEvents((prev) => [...prev, ...newEvents]);
      } else {
        setEvents(newEvents);
      }

      // Update cursor
      if (snapshot.docs.length > 0) {
        if (tab === "upcoming") {
          // Cursor is the last doc (latest date in batch)
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        } else {
          // Cursor is the first doc (oldest date in batch) because we are moving backwards
          setLastDoc(snapshot.docs[0]);
        }
      }
      
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch and tab change
  useEffect(() => {
    setEvents([]);
    setLastDoc(null);
    setHasMore(true);
    fetchEvents(false);
  }, [tab, currentUser]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEvents(true);
    }
  };

  const handleAddEvent = () => {
    setShowAddEventModal(true);
  };

  const addEventToFirestore = async (eventData) => {
    try {
      let imageUrl = (eventData.imageUrl || "").trim() || null;

      if (!imageUrl) {
        try {
          const params = new URLSearchParams({
            title: eventData.title || "",
            location: eventData.location || "",
          });

          if (eventData.description) {
            params.set("description", eventData.description);
          }

          if (eventData.date) {
            params.set("date", eventData.date);
          }

          const baseUrl = import.meta.env.DEV
            ? "https://us-central1-whos-bringing-what.cloudfunctions.net/randomPotluckImage"
            : "/api/randomPotluckImage";

          const response = await fetch(`${baseUrl}?${params.toString()}`);

          if (response.ok) {
            const data = await response.json();
            if (data && data.imageUrl) {
              imageUrl = data.imageUrl;
            }
          }
        } catch (err) {
          console.error("Error fetching potluck image: ", err);
        }
      }

      const normalizedImageUrl = imageUrl || null;
      const bannerColor =
        eventData.bannerColor && eventData.bannerColor.trim()
          ? eventData.bannerColor
          : pickRandomEventBannerColor();

      const payload = {
        ...eventData,
        imageUrl: normalizedImageUrl,
        bannerColor,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "events"), payload);
      setShowAddEventModal(false);

      // Navigate to the newly created event
      navigate(`/events/${docRef.id}`);
    } catch (error) {
      console.error("Error adding event to Firestore: ", error);
    }
  };

  return (
    <div
      className={`mx-auto max-w-5xl pb-8 pt-8 transition-all duration-200 ease-out ${
        isSidePanelOpen ? "md:mr-[12rem] lg:mr-[14rem]" : ""
      }`}
    >
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
            {events.length} loaded
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
      {loadingEvents ? (
        <div className="flex justify-center py-8">
          <CookingLoader />
        </div>
      ) : events.length > 0 ? (
        <>
          <EventCard events={events} />
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-full bg-gray-100 px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More Events"}
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-gray-600">
          {tab === "upcoming"
            ? "You do not have any upcoming events yet."
            : "You do not have any previous events yet."}
        </p>
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
