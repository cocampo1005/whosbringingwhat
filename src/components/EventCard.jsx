import React from "react";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { TiLocation } from "react-icons/ti";
import { Link } from "react-router-dom";
import { formatTime } from "../utils/formatters";
import ShareButton from "./ShareButton";

export default function EventCard({ events }) {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const time = formatTime(event.time);
        const hasImage = !!event.imageUrl;
        const bannerColor = event.bannerColor || "#f94a5a";

        return (
          <Link
            to={`/events/${event.id}`}
            key={event.id}
            className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-md"
          >
            {/* Hero area */}
            <div className="relative h-44 w-full overflow-hidden">
              {hasImage ? (
                <img
                  src={event.imageUrl}
                  alt={event.title || "Event image"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ backgroundColor: bannerColor }}
                />
              )}
              <div className="absolute right-3 top-3">
                <ShareButton
                  eventId={event.id}
                  eventTitle={event.title}
                  className="flex items-center justify-center rounded-full bg-white/80 p-1.5 text-primaryDark shadow-sm backdrop-blur-sm hover:bg-white"
                  iconClassName="text-sm"
                />
              </div>
            </div>

            {/* Content area */}
            <div className="flex flex-col gap-1.5 px-4 pb-3 pt-3">
              <h3 className="text-base font-semibold text-primaryDark">
                {event.title}
              </h3>
              <div className="flex items-center text-sm">
                <FaCalendarAlt className="mr-2 text-primaryRed" />
                <p className="font-medium text-gray-600">{event.date}</p>
              </div>
              <div className="flex items-center text-sm">
                <MdOutlineAccessTimeFilled className="mr-2 text-primaryRed" />
                <p className="font-medium text-gray-600">{time}</p>
              </div>
              <div className="flex items-center text-sm">
                <TiLocation className="mr-2 text-primaryRed" />
                <p className="font-medium text-gray-600">{event.location}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
