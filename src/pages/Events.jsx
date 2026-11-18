import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import EventModal from "../components/EventModal";
import { LuPlus } from "react-icons/lu";
import { Button, PageTitle, SegmentedTabs } from "../components/ui";
import AssigneeAvatar from "../components/AssigneeAvatar";
import lettermark from "../assets/brand/logos/wbw-lettermark.svg";
import charGreen from "../assets/brand/characters/char-green.svg";
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
import { Link, useNavigate } from "@tanstack/react-router";
import { useRole } from "../hooks/useRole";
import { pickRandomEventBannerColor } from "../constants/eventBannerColors";
import { RANDOM_POTLUCK_IMAGE_URL } from "../constants/api";
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
          if (
            typeof data.date === "string" &&
            !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
          ) {
            // It's a legacy date string, try to parse and update
            const parsed = new Date(data.date);
            if (!isNaN(parsed)) {
              const offset = parsed.getTimezoneOffset();
              const adjusted = new Date(parsed.getTime() - offset * 60 * 1000);
              const isoDate = adjusted.toISOString().split("T")[0];
              updates.push(
                updateDoc(doc(db, "events", docSnap.id), { date: isoDate }),
              );
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
          where("createdById", "==", currentUser.uid),
        ),
      );

      // Common: Filter by date relative to today
      if (tab === "upcoming") {
        q = query(q, where("date", ">=", todayISO), orderBy("date", "asc"));
      } else {
        // For past events, we still use 'asc' order to utilize the existing index.
        // We filter for dates < today.
        q = query(q, where("date", "<", todayISO), orderBy("date", "asc"));
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

          const baseUrl = RANDOM_POTLUCK_IMAGE_URL;

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
      navigate({ to: `/events/${docRef.id}` });
    } catch (error) {
      console.error("Error adding event to Firestore: ", error);
    }
  };

  const tabOptions = [
    { value: "upcoming", label: "Upcoming" },
    { value: "past", label: "Previous" },
  ];

  return (
    <div className="mx-auto max-w-5xl pb-8 md:pt-2">
      {/* Phone: yellow band bleeding to the screen edges (cancels main's px-4 pt-6) */}
      <div className="-mx-4 -mt-6 mb-5 rounded-b-band bg-sidebar px-4 pb-9 pt-5 md:hidden">
        <div className="flex items-center justify-between">
          <img src={lettermark} alt="" aria-hidden="true" className="h-8 w-auto" />
          {currentUser && (
            <Link
              to="/profile"
              aria-label="Profile"
              className="rounded-full ring-2 ring-white"
            >
              <AssigneeAvatar
                assigneeId={currentUser.uid}
                displayName={currentUser.name}
                size={36}
                showName={false}
              />
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddEvent}
          className="relative mt-12 block w-full rounded-3xl bg-white px-4 pb-8 pt-12 text-center shadow-soft"
        >
          <img
            src={charGreen}
            alt=""
            aria-hidden="true"
            className="absolute -top-10 left-1/2 h-24 w-auto -translate-x-1/2"
          />
          <span className="font-display text-sm font-extrabold uppercase tracking-wide [font-stretch:125%]">
            Host an Event
          </span>
          <span className="absolute -bottom-5 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full bg-accent text-white shadow-action ring-4 ring-white">
            <LuPlus size={20} aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* Phone: tabs above the big title */}
      <div className="mb-3 md:hidden">
        <SegmentedTabs
          variant="chips"
          ariaLabel="Event tabs"
          tabs={tabOptions}
          value={tab}
          onChange={setTab}
        />
      </div>

      <PageTitle
        className="mb-6 md:mb-9"
        title="Events"
        subtitle={`${events.length} loaded`}
        actions={
          <div className="hidden items-center gap-3 md:flex">
            <SegmentedTabs
              ariaLabel="Event tabs"
              tabs={tabOptions}
              value={tab}
              onChange={setTab}
            />
            <Button leftIcon={<LuPlus size={16} aria-hidden="true" />} onClick={handleAddEvent}>
              Add Event
            </Button>
          </div>
        }
      />

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
              <Button
                variant="soft"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More Events"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mx-auto flex max-w-sm flex-col items-center rounded-card bg-white px-6 py-8 text-center shadow-soft">
          <img src={charGreen} alt="" aria-hidden="true" className="mb-4 h-24 w-auto" />
          <p className="text-muted">
            {tab === "upcoming"
              ? "You do not have any upcoming events yet."
              : "You do not have any previous events yet."}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleAddEvent}
        aria-label="Add Event"
        className="fixed bottom-4 left-4 z-30 grid h-[54px] w-[54px] place-items-center rounded-full bg-accent text-white shadow-action ring-4 ring-white md:hidden"
      >
        <LuPlus size={24} aria-hidden="true" />
      </button>

      {showAddEventModal && (
        <EventModal
          closeModal={() => setShowAddEventModal(false)}
          onSubmit={addEventToFirestore}
        />
      )}
    </div>
  );
}
