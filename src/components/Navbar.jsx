import React from "react";
import { FaCalendarAlt, FaClipboardList, FaUser } from "react-icons/fa";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const navLinkStyles = ({ isActive }) =>
    `flex flex-col items-center justify-center text-sm ${
      isActive ? "text-primaryRed" : "text-gray-500"
    }`;

  return (
    <nav className="fixed bottom-0 flex w-full justify-around bg-yellow-50 py-4 shadow-md">
      {/* Events Nav */}
      <NavLink to="/events" className={navLinkStyles}>
        <FaCalendarAlt size={24} />
        <span>Events</span>
      </NavLink>

      {/* MyItems Nav */}
      <NavLink to="/my-items" className={navLinkStyles}>
        <FaClipboardList size={24} />
        <span>My Items</span>
      </NavLink>

      {/* Profile Nav */}
      <NavLink to="/profile" className={navLinkStyles}>
        <FaUser size={24} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
