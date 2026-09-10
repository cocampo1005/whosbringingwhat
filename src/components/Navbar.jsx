import React from "react";
import { FaCalendarAlt, FaClipboardList, FaUser } from "react-icons/fa";
import { Link } from "@tanstack/react-router";
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
            <Link
              to="/events"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-white/20 text-white",
              }}
              inactiveProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors text-white hover:bg-white/10",
              }}
            >
              <FaCalendarAlt size={18} />
              <span>Events</span>
            </Link>

            <Link
              to="/my-items"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-white/20 text-white",
              }}
              inactiveProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors text-white hover:bg-white/10",
              }}
            >
              <FaClipboardList size={18} />
              <span>My Items</span>
            </Link>
          </div>
        </div>

        {/* Bottom Profile Link */}
        <div>
          <Link
            to="/profile"
            activeProps={{
              className:
                "flex items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-white/20 text-white",
            }}
            inactiveProps={{
              className:
                "flex items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors text-white hover:bg-white/10",
            }}
          >
            {/* Left: avatar with initials fallback */}
            <div className="flex items-center gap-3">
              {currentUser?.uid && (
                <AssigneeAvatar
                  assigneeId={currentUser.uid}
                  size={28}
                  showName={false}
                />
              )}
              <span className="text-white md:text-inherit">Profile</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-around bg-primaryRed shadow md:hidden">
        <Link
          to="/events"
          activeProps={{ className: navLinkStyles({ isActive: true }) }}
          inactiveProps={{ className: navLinkStyles({ isActive: false }) }}
        >
          <FaCalendarAlt size={20} />
          <span>Events</span>
        </Link>
        <Link
          to="/my-items"
          activeProps={{ className: navLinkStyles({ isActive: true }) }}
          inactiveProps={{ className: navLinkStyles({ isActive: false }) }}
        >
          <FaClipboardList size={20} />
          <span>My Items</span>
        </Link>
        <Link
          to="/profile"
          activeProps={{ className: navLinkStyles({ isActive: true }) }}
          inactiveProps={{ className: navLinkStyles({ isActive: false }) }}
        >
          {currentUser?.uid && (
            <AssigneeAvatar
              assigneeId={currentUser.uid}
              size={34}
              showName={false}
            />
          )}
        </Link>
      </nav>
    </>
  );
}
