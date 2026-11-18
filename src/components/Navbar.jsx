import { LuCalendar, LuListChecks, LuUser } from "react-icons/lu";
import { Link } from "@tanstack/react-router";
import logo from "../assets/brand/logos/wbw-primary-ink.svg";
import { useAuth } from "../contexts/AuthContext";
import AssigneeAvatar from "./AssigneeAvatar";

// Desktop sidebar pill rows (ink text on the yellow card; active = purple pill).
const sidebarRow =
  "flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[0.8125rem] leading-none transition duration-150 ease-wbw focus-visible:outline-ink";
const sidebarActive = `${sidebarRow} bg-selected font-bold text-white`;
const sidebarInactive = `${sidebarRow} font-semibold text-ink hover:bg-ink/10`;

// Foot member pill: white, turns purple on /profile.
const memberRow =
  "flex items-center gap-2.5 rounded-full py-2 pl-2 pr-3.5 text-xs font-semibold transition duration-150 ease-wbw focus-visible:outline-ink";
const memberActive = `${memberRow} bg-selected text-white`;
const memberInactive = `${memberRow} bg-raised text-ink`;

// Phone floating bar items: active = white pill with coral text + label, inactive = white icon only.
const barItem =
  "flex h-9 items-center justify-center gap-1.5 rounded-full font-display text-xs font-bold transition duration-150 ease-wbw focus-visible:outline-white";
const barActive = `${barItem} bg-raised px-3.5 text-accent`;
const barInactive = `${barItem} w-9 text-white`;

export default function Navbar() {
  const { currentUser } = useAuth();
  const memberName = currentUser?.name || currentUser?.displayName;

  return (
    <>
      {/* Desktop sidebar: inset yellow card, 14rem wide, 1rem from the top/left/bottom edges.
          Content in Home.jsx clears it with md:ml-[16rem] (1rem inset + 14rem + 1rem gap). */}
      <nav className="fixed bottom-4 left-4 top-4 z-20 hidden w-56 flex-col overflow-y-auto rounded-card bg-sidebar px-3 pb-5 pt-5 md:flex">
        <div className="flex flex-grow flex-col">
          <Link to="/" className="-mx-3 -mt-5 mb-5 block px-3 pb-4 pt-2">
            <img
              alt="Who's Bringing What Logo"
              src={logo}
              className="mx-auto h-auto w-full"
            />
          </Link>

          {/* Top Nav Links */}
          <div className="flex flex-col gap-1.5">
            <Link
              to="/events"
              activeProps={{ className: sidebarActive }}
              inactiveProps={{ className: sidebarInactive }}
            >
              <LuCalendar size={17} aria-hidden="true" />
              <span>Events</span>
            </Link>

            <Link
              to="/my-items"
              activeProps={{ className: sidebarActive }}
              inactiveProps={{ className: sidebarInactive }}
            >
              <LuListChecks size={17} aria-hidden="true" />
              <span>My Items</span>
            </Link>
          </div>
        </div>

        {/* Bottom Profile Link */}
        <div>
          <Link
            to="/profile"
            activeProps={{ className: memberActive }}
            inactiveProps={{ className: memberInactive }}
          >
            {currentUser?.uid ? (
              <AssigneeAvatar
                assigneeId={currentUser.uid}
                size={32}
                showName={false}
              />
            ) : (
              <LuUser size={17} aria-hidden="true" className="mx-1.5" />
            )}
            {memberName ? (
              <span className="min-w-0 truncate">
                <span className="sr-only">Profile, </span>
                {memberName}
              </span>
            ) : (
              <span>Profile</span>
            )}
          </Link>
        </div>
      </nav>

      {/* Phone floating nav. Layout contract: the bottom-LEFT slot (left-4 bottom-4, 54x54px) is
          reserved for each page's own circular "+" button; this pill starts at left 5.25rem. */}
      <nav
        aria-label="Primary"
        className="fixed bottom-4 left-[5.25rem] right-4 z-20 flex h-[3.375rem] items-center justify-around rounded-full bg-accent px-2 shadow-raised md:hidden"
      >
        <Link
          to="/events"
          activeProps={{ className: barActive }}
          inactiveProps={{ className: barInactive }}
        >
          {({ isActive }) => (
            <>
              <LuCalendar size={17} aria-hidden="true" />
              <span className={isActive ? undefined : "sr-only"}>Events</span>
            </>
          )}
        </Link>
        <Link
          to="/my-items"
          activeProps={{ className: barActive }}
          inactiveProps={{ className: barInactive }}
        >
          {({ isActive }) => (
            <>
              <LuListChecks size={17} aria-hidden="true" />
              <span className={isActive ? undefined : "sr-only"}>My Items</span>
            </>
          )}
        </Link>
        <Link
          to="/profile"
          activeProps={{ className: barActive }}
          inactiveProps={{ className: barInactive }}
        >
          {({ isActive }) => (
            <>
              {currentUser?.uid ? (
                <AssigneeAvatar
                  assigneeId={currentUser.uid}
                  size={isActive ? 24 : 34}
                  showName={false}
                />
              ) : (
                <LuUser size={17} aria-hidden="true" />
              )}
              <span className={isActive ? undefined : "sr-only"}>Profile</span>
            </>
          )}
        </Link>
      </nav>
    </>
  );
}
