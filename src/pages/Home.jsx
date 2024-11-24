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
    <>
      <div className="flex min-h-screen flex-col">
        <header className="bg-primaryRed">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-center text-3xl font-bold tracking-tight text-white">
              {getPageName()}
            </h1>
          </div>
        </header>

        {/* Nested Route Content */}
        <main className="relative mb-[76px] flex-1">
          <Outlet />
        </main>

        {/* Bottom Navbar */}
        <Navbar />
      </div>
    </>
  );
}
