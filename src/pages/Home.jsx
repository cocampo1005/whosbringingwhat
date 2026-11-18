import Navbar from "../components/Navbar";
import { Outlet } from "@tanstack/react-router";

export default function Home() {
  return (
    // Page background lives here: App.jsx still paints bg-yellow-50 behind it.
    <div className="flex min-h-screen flex-col overflow-hidden bg-ground md:flex-row">
      <Navbar />

      {/* md:ml-[16rem] clears the sidebar (1rem inset + 14rem card + 1rem gap). */}
      <div className="flex min-w-0 flex-1 flex-col md:ml-[16rem]">
        {/* Each page renders its own title (PageTitle), so the shell has none. */}
        <main className="mx-auto w-full max-w-[75rem] flex-1 px-4 pb-[6.875rem] pt-6 md:px-6 md:pb-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
