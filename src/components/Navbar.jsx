import React from "react";
import { FaCalendarAlt, FaClipboardList, FaUser } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import logo from "../assets/light-outline-logo.svg";

export default function Navbar() {
  const navLinkStyles = ({ isActive }) =>
    `flex flex-col items-center justify-center text-xs font-medium ${
      isActive ? "text-white" : "text-rose-200"
    }`;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed top-0 left-0 h-screen w-56 bg-primaryRed flex-col px-4 py-6 z-40 shadow-[6px_0_12px_-2px_rgba(0,0,0,0.2)]">
      {/* Logo */}
      <div className="flex flex-col flex-grow">
        <img
          alt="Who's Bringing What Logo"
          src={logo}
          className="mx-auto mb-12 h-28 w-auto"
        />

        {/* Top Nav Links */}
        <div className="flex flex-col gap-4">
          <NavLink to="/events" className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-primaryRed"
                : "text-white hover:bg-white/10"
            }`
          }>
            <FaCalendarAlt size={18} />
            <span>Events</span>
          </NavLink>

          <NavLink to="/my-items" className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-primaryRed"
                : "text-white hover:bg-white/10"
            }`
          }>
            <FaClipboardList size={18} />
            <span>My Items</span>
          </NavLink>
        </div>
      </div>

        {/* Bottom Profile Link */}
        <div>
          <NavLink to="/profile" className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-primaryRed"
                : "text-white hover:bg-white/10"
            }`
          }>
            <FaUser size={18} />
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-primaryRed flex justify-around items-center h-16 md:hidden z-20">
        <NavLink to="/events" className={navLinkStyles}>
          <FaCalendarAlt size={20} />
          <span>Events</span>
        </NavLink>
        <NavLink to="/my-items" className={navLinkStyles}>
          <FaClipboardList size={20} />
          <span>My Items</span>
        </NavLink>
        <NavLink to="/profile" className={navLinkStyles}>
          <FaUser size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </>
  );
}