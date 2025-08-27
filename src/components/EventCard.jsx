import React from "react";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { TiLocation } from "react-icons/ti";
import { Link } from "react-router-dom";
import { formatTime } from "../utils/formatters";

export default function EventCard({ events }) {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const time = formatTime(event.time);
        return (
          <Link
            to={`/events/${event.id}`}
            key={event.id}
            className="rounded-2xl bg-white shadow-md w-full"
          >
            <h3 className="rounded-t-2xl bg-primaryRed py-2 text-center text-lg font-bold text-white">
              {event.title}
            </h3>
            <div className="p-4">
              <div className="flex items-center">
                <FaCalendarAlt className="mr-2 text-primaryRed" />
                <p className="font-bold">{event.date}</p>
              </div>
              <div className="flex items-center">
                <MdOutlineAccessTimeFilled className="mr-2 text-primaryRed" />
                <p className="font-bold">{time}</p>
              </div>
              <div className="flex items-center">
                <TiLocation className="mr-2 text-primaryRed" />
                <p className="font-bold">{event.location}</p>
              </div>
              <p className="pt-2">{event.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
