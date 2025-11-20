import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { TiLocation } from "react-icons/ti";
import { formatTime } from "../utils/formatters";

export default function MyItems() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("myItems"); // "myItems" | "onBehalfOf"

  // Load all events (newest first)
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const normalize = (s = "") => s.trim().replace(/\s+/g, " ").toLowerCase();
  const myName = normalize(currentUser?.name || "");

  const groupedByEvent = useMemo(() => {
    if (!currentUser) return [];
    const out = [];

    for (const ev of events) {
      const items = Array.isArray(ev.items) ? ev.items : [];

      const mine = items.filter((it) => {
        const hasId = !!it?.assigneeId;
        const idMatches = it?.assigneeId === currentUser.uid;
        const nameMatches =
          !hasId && myName && normalize(it?.assignee || "") === myName;
        return idMatches || nameMatches;
      });

      const myItems = mine.filter((it) => !it.isOnBehalfOf);
      const onBehalfOfItems = mine.filter((it) => it.isOnBehalfOf === true);

      if (myItems.length > 0 || onBehalfOfItems.length > 0) {
        out.push({
          eventId: ev.id,
          eventTitle: ev.title,
          eventDate: ev.date,
          eventTime: ev.time,
          eventLocation: ev.location,
          myItems,
          onBehalfOfItems,
        });
      }
    }
    return out;
  }, [events, currentUser, myName]);

  if (!currentUser) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-center text-gray-600">
          Please log in to see your contributions.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-primaryRed" />
      </div>
    );
  }

  const hasAnyItems = groupedByEvent.length > 0;

  const eventsForTab = groupedByEvent
    .map((ev) => ({
      ...ev,
      items: tab === "myItems" ? ev.myItems : ev.onBehalfOfItems,
    }))
    .filter((ev) => ev.items.length > 0);

  const totalItemsInTab = eventsForTab.reduce(
    (sum, ev) => sum + ev.items.length,
    0,
  );

  return (
    <div className="max-w-5xl mx-auto pt-8 pb-8 md:pt-8">
      {!hasAnyItems ? (
        <p className="text-center text-gray-600">
          Items you bring will show up here.
        </p>
      ) : (
        <>
          <div className="mb-9 flex w-full items-center justify-between gap-4 md:w-auto md:justify-start">
            <div className="inline-flex rounded-xl bg-white p-1 shadow-md">
              <button
                type="button"
                onClick={() => setTab("myItems")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  tab === "myItems"
                    ? "bg-primaryRed text-white"
                    : "text-primaryDark hover:bg-gray-50"
                }`}
                aria-pressed={tab === "myItems"}
              >
                My Items
              </button>
              <button
                type="button"
                onClick={() => setTab("onBehalfOf")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  tab === "onBehalfOf"
                    ? "bg-primaryRed text-white"
                    : "text-primaryDark hover:bg-gray-50"
                }`}
                aria-pressed={tab === "onBehalfOf"}
              >
                On Behalf Of
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {totalItemsInTab} items
            </span>
          </div>

          {eventsForTab.length === 0 ? (
            <p className="text-center text-gray-600">
              {tab === "myItems"
                ? "You do not have any items assigned directly to you yet."
                : "You are not currently bringing any items on behalf of someone else."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {eventsForTab.map((ev) => (
                <Link
                  key={ev.eventId}
                  to={`/events/${ev.eventId}`}
                  className="block rounded-2xl bg-white shadow-md"
                >
                  {/* Card header: Event name */}
                  <div className="rounded-t-2xl bg-primaryRed py-2 text-center text-lg font-bold text-white">
                    {ev.eventTitle}
                  </div>

                  {/* Optional compact event meta */}
                  <div className="px-4 pt-3">
                    <div className="flex items-center text-sm">
                      <FaCalendarAlt className="mr-2 text-primaryRed" />
                      <span className="font-semibold">{ev.eventDate}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MdOutlineAccessTimeFilled className="mr-2 text-primaryRed" />
                      <span className="font-semibold">
                        {formatTime(ev.eventTime)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <TiLocation className="mr-2 text-primaryRed" />
                      <span className="font-semibold">{ev.eventLocation}</span>
                    </div>
                  </div>

                  {/* Card body: Your items for this event */}
                  <div className="px-4 pb-4 pt-2">
                    <div className="rounded-xl bg-rose-50 p-3 shadow-md">
                      <p className="mb-2 text-sm font-bold text-rose-700">
                        Your Contributions
                      </p>
                      <ul className="space-y-2">
                        {ev.items.map((it) => {
                          const displayAssignee =
                            it.isOnBehalfOf && it.onBehalfOfName
                              ? it.onBehalfOfName
                              : it.assignee;

                          return (
                            <li
                              key={it.id}
                              className="flex items-start justify-between rounded-lg bg-white p-2 shadow-sm"
                            >
                              <div className="pr-3">
                                <p className="text-sm font-semibold">{it.title}</p>
                                {displayAssignee && (
                                  <p className="text-xs text-gray-500">
                                    {displayAssignee}
                                  </p>
                                )}
                              </div>
                              {it.category && (
                                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                  {it.category}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
