import React from "react";
import Navbar from "../components/Navbar";
import { Outlet, useLocation } from "react-router-dom";

export default function Home() {
  const location = useLocation();

  // Determine page name based on the current path
  const getPageName = () => {
    switch (location.pathname) {
      case "/events":
        return "Events";
      case "/my-items":
        return "My Items";
      case "/profile":
        return "Profile";
      default:
        return "Events"; // Default page name if the path doesn't match
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col md:ml-56">
        {/* Top header */}
        <header className="bg-rose-100 shadow px-4 py-3 fixed top-0 left-0 md:left-56 right-0 z-10">
          <h1 className="text-center md:text-left text-lg sm:text-xl md:text-2xl font-bold text-primaryRed tracking-wide">
            {getPageName()}
          </h1>
        </header>

        <main className="mt-3 md:mt-20 mb-16 px-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}