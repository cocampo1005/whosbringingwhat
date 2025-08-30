import React from "react";
import { FaCalendarAlt, FaClipboardList, FaUser } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/logo-with-face-outlined.svg";
import { useAuth } from "../contexts/AuthContext";
import AssigneeAvatar from "./AssigneeAvatar";

export default function Navbar() {
  const { currentUser } = useAuth();
  const navLinkStyles = ({ isActive }) =>
    `flex flex-col items-center justify-center text-xs font-medium ${
      isActive ? "text-white" : "text-rose-200"
    }`;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="fixed left-0 top-0 z-40 hidden h-screen w-56 flex-col bg-primaryRed px-4 py-6 shadow-[6px_0_12px_-2px_rgba(0,0,0,0.2)] md:flex">
        {/* Logo */}
        <div className="flex flex-grow flex-col">
          <Link to="/">
            <img
              alt="Who's Bringing What Logo"
              src={logo}
              className="mx-auto mb-12 h-36 w-auto"
            />
          </Link>

          {/* Top Nav Links */}
          <div className="flex flex-col gap-4">
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                  ? "bg-white/20 text-white"        // translucent white background, keep text white
                  : "text-white hover:bg-white/10"
                }`
              }
            >
              <FaCalendarAlt size={18} />
              <span>Events</span>
            </NavLink>

            <NavLink
              to="/my-items"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                  ? "bg-white/20 text-white"        // translucent white background, keep text white
                  : "text-white hover:bg-white/10"
                }`
              }
            >
              <FaClipboardList size={18} />
              <span>My Items</span>
            </NavLink>
          </div>
        </div>

        {/* Bottom Profile Link */}
        <div>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                ? "bg-white/20 text-white"        // translucent white background, keep text white
                : "text-white hover:bg-white/10"
              }`
            }
          >
            {/* Left: avatar with initials fallback */}
            <div className="flex items-center gap-3">
              {currentUser?.uid && (
                <AssigneeAvatar assigneeId={currentUser.uid} size={28} showName={false} />
              )}
              <span className="text-white md:text-inherit">Profile</span>
            </div>
          </NavLink>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-around bg-primaryRed shadow md:hidden">
        <NavLink to="/events" className={navLinkStyles}>
          <FaCalendarAlt size={20} />
          <span>Events</span>
        </NavLink>
        <NavLink to="/my-items" className={navLinkStyles}>
          <FaClipboardList size={20} />
          <span>My Items</span>
        </NavLink>
        <NavLink to="/profile" className={navLinkStyles}>
            {currentUser?.uid && (
              <AssigneeAvatar assigneeId={currentUser.uid} size={34} showName={false}/>
            )}
        </NavLink>
      </nav>
    </>
  );
}
