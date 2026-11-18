import React from "react";
import { LuClock, LuMapPin } from "react-icons/lu";
import { Link } from "@tanstack/react-router";
import { formatTime } from "../utils/formatters";
import { eventBannerPastel } from "../constants/categoryTheme";
import ShareButton from "./ShareButton";

// Display-only chip text like "SAT NOV 29". ISO dates (YYYY-MM-DD) are read as calendar
// parts so no timezone shift happens; legacy strings fall back to Date parsing.
function formatChipDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  let d;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (iso) {
    d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d)) return dateStr;
  const text = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
    .format(d)
    .replace(",", "");
  return d.getFullYear() === new Date().getFullYear()
    ? text
    : `${text}, ${d.getFullYear()}`;
}

export default function EventCard({ events }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const time = event.time ? formatTime(event.time) : "";
        const hasImage = !!event.imageUrl;
        const chipDate = formatChipDate(event.date);

        return (
          <Link
            to={`/events/${event.id}`}
            key={event.id}
            className="flex h-full w-full flex-col rounded-card bg-white px-2 pb-4 pt-2 shadow-soft transition duration-150 ease-wbw hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selected focus-visible:ring-offset-2 focus-visible:ring-offset-ground"
          >
            {/* Media */}
            <div className="relative h-[170px] w-full overflow-hidden rounded-2xl lg:h-[148px]">
              {hasImage ? (
                <img
                  src={event.imageUrl}
                  alt={event.title || "Event image"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ backgroundColor: eventBannerPastel(event) }}
                />
              )}
              {chipDate && (
                <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white px-2.5 py-1 font-display text-[10px] font-extrabold uppercase leading-none tracking-[0.06em] text-ink">
                  {chipDate}
                </span>
              )}
              <div className="absolute right-2.5 top-2.5">
                <ShareButton eventId={event.id} eventTitle={event.title} />
              </div>
            </div>

            {/* Content area */}
            <div className="flex flex-col gap-1.5 px-2 pt-3">
              <h3 className="text-lg leading-tight">{event.title}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-muted">
                {time && (
                  <span className="flex items-center gap-1.5">
                    <LuClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {time}
                  </span>
                )}
                {event.location && (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <LuMapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{event.location}</span>
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
