import Navbar from "../components/Navbar";
import { Link, Outlet, useMatches } from "@tanstack/react-router";
import logo from "../assets/logo-with-face-outlined.svg";

export default function Home() {
  const matches = useMatches();
  const pageName =
    [...matches].reverse().find((match) => match.staticData?.pageName)
      ?.staticData.pageName ?? "Events";

  return (
    <div className="flex min-h-screen flex-col overflow-hidden md:flex-row">
      <Navbar />

      <div className="flex flex-1 flex-col md:ml-56">
        {/* Top header */}
        <header className="fixed left-0 right-0 top-0 z-10 bg-primaryRed px-6 py-3 shadow md:left-56 md:bg-rose-100 md:pl-12">
          <div className="relative flex items-center justify-center gap-4 md:justify-start">
            <Link to="/" className="absolute left-0 md:hidden">
              <img src={logo} className="h-10" />
            </Link>
            <h1 className="text-center text-[1.5rem] font-bold tracking-wide text-primaryLight md:text-left md:text-2xl md:text-primaryRed">
              {pageName}
            </h1>
          </div>
        </header>

        <main className="mb-[64px] mt-[60px] flex-1 px-8 sm:px-8 md:mt-16 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
