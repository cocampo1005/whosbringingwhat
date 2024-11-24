import React from "react";
import { MdOutlineAccessTimeFilled } from "react-icons/md";
import { FaCalendarAlt } from "react-icons/fa";
import { TiLocation } from "react-icons/ti";
import { Link } from "react-router-dom";

export default function EventCard({ events }) {
  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <Link
          to={`/events/${event.id}`}
          key={event.id}
          className="rounded-lg bg-white shadow-md"
        >
          <h3 className="bg-primaryRed rounded-t-lg py-2 text-center text-lg font-bold text-white">
            {event.title}
          </h3>
          <div className="p-4">
            <div className="flex items-center">
              <FaCalendarAlt className="text-primaryRed mr-2" />
              <p className="font-bold">{event.date}</p>
            </div>
            <div className="flex items-center">
              <MdOutlineAccessTimeFilled className="text-primaryRed mr-2" />
              <p className="font-bold">{event.time}</p>
            </div>
            <div className="flex items-center">
              <TiLocation className="text-primaryRed mr-2" />
              <p className="font-bold">{event.location}</p>
            </div>
            <p className="pt-2">{event.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
