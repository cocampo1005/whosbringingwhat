import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Link } from "@tanstack/react-router";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { LuMapPin } from "react-icons/lu";
import { formatTime } from "../utils/formatters";
import { getCategoryTheme } from "../constants/categoryTheme";
import { PageTitle, SegmentedTabs } from "../components/ui";
import charYellow from "../assets/brand/characters/char-yellow.svg";

const TABS = [
  { value: "myItems", label: "My Items" },
  { value: "onBehalfOf", label: "On Behalf Of" },
];

function renderEmpty(text) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-card bg-raised px-6 py-10 text-center shadow-soft">
      <img src={charYellow} alt="" className="mb-4 h-24 w-24" />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

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
        <p className="text-center text-muted">
          Please log in to see your contributions.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-selected-text" />
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

  const subtitle =
    totalItemsInTab > 0
      ? `${totalItemsInTab} ${totalItemsInTab === 1 ? "item" : "items"} across ${eventsForTab.length} ${eventsForTab.length === 1 ? "event" : "events"}`
      : undefined;

  return (
    <div className="pb-4">
      <PageTitle
        title="My Items"
        subtitle={subtitle}
        actions={
          hasAnyItems ? (
            <SegmentedTabs
              tabs={TABS}
              value={tab}
              onChange={setTab}
              ariaLabel="Item view"
            />
          ) : null
        }
      />

      <div className="mt-6">
        {!hasAnyItems ? (
          renderEmpty("Items you bring will show up here.")
        ) : eventsForTab.length === 0 ? (
          renderEmpty(
            tab === "myItems"
              ? "You do not have any items assigned directly to you yet."
              : "You are not currently bringing any items on behalf of someone else.",
          )
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventsForTab.map((ev) => (
              <Link
                key={ev.eventId}
                to={`/events/${ev.eventId}`}
                className="block rounded-card bg-raised p-5 shadow-soft transition duration-150 ease-wbw hover:shadow-raised"
              >
                <span className="inline-block rounded-full bg-selected-soft px-2.5 py-1 font-display text-[10px] font-extrabold uppercase tracking-wide text-selected-text">
                  {ev.eventDate} · {formatTime(ev.eventTime)}
                </span>
                <h2 className="mt-3 text-lg leading-tight">{ev.eventTitle}</h2>
                {ev.eventLocation && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-muted">
                    <LuMapPin aria-hidden="true" className="shrink-0" />
                    <span>{ev.eventLocation}</span>
                  </p>
                )}

                <div className="my-4 h-px bg-line" />

                <p className="mb-2.5 font-display text-[10px] font-extrabold uppercase tracking-wider text-muted">
                  {tab === "onBehalfOf"
                    ? "On Behalf Of Contributions"
                    : "Your Contributions"}
                </p>
                <ul className="space-y-2">
                  {ev.items.map((it) => {
                    const displayAssignee =
                      it.isOnBehalfOf && it.onBehalfOfName
                        ? it.onBehalfOfName
                        : it.assignee;
                    const theme = getCategoryTheme(it.category);

                    return (
                      <li
                        key={it.id}
                        className="flex items-center gap-3 rounded-[14px] bg-surface2 px-3 py-2.5"
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: theme.pastel }}
                        >
                          <img src={theme.icon} alt="" className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">
                            {it.title}
                          </p>
                          {displayAssignee && (
                            <p className="truncate text-xs text-muted">
                              {displayAssignee}
                            </p>
                          )}
                        </div>
                        {it.category && (
                          <span
                            className="shrink-0 font-display text-[10px] font-extrabold uppercase tracking-wide"
                            style={{ color: theme.accent }}
                          >
                            {it.category}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
