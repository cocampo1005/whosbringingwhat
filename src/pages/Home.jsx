import Navbar from "../components/Navbar";
import { Link, Outlet, useMatches } from "@tanstack/react-router";
import logo from "../assets/logo-with-face-outlined.svg";
import { useEmbedded } from "../hooks/useEmbedded";

/**
 * Standalone, the sidebar, header and tab bar are pinned to the viewport and the content is
 * offset to make room for them. Embedded in a host (the portfolio), `position: fixed` would
 * escape the remote's box and cover the host's chrome, so the same parts flow inside the layout.
 */
const LAYOUT = {
  standalone: {
    root: "flex min-h-screen flex-col overflow-hidden md:flex-row",
    column: "flex flex-1 flex-col md:ml-56",
    header:
      "fixed left-0 right-0 top-0 z-10 bg-primaryRed px-6 py-3 shadow md:left-56 md:bg-rose-100 md:pl-12",
    main: "mb-[64px] mt-[60px] flex-1 px-8 sm:px-8 md:mt-16 lg:px-8",
  },
  embedded: {
    root: "flex flex-col overflow-hidden md:flex-row",
    column: "relative flex flex-1 flex-col",
    header: "bg-primaryRed px-6 py-3 shadow md:bg-rose-100 md:pl-12",
    main: "my-6 flex-1 px-8",
  },
};

export default function Home() {
  const matches = useMatches();
  const layout = useEmbedded() ? LAYOUT.embedded : LAYOUT.standalone;
  const pageName =
    [...matches].reverse().find((match) => match.staticData?.pageName)
      ?.staticData.pageName ?? "Events";

  return (
    <div className={layout.root}>
      <Navbar />

      <div className={layout.column}>
        {/* Top header */}
        <header className={layout.header}>
          <div className="relative flex items-center justify-center gap-4 md:justify-start">
            <Link to="/" className="absolute left-0 md:hidden">
              <img src={logo} className="h-10" />
            </Link>
            <h1 className="text-center text-[1.5rem] font-bold tracking-wide text-primaryLight md:text-left md:text-2xl md:text-primaryRed">
              {pageName}
            </h1>
          </div>
        </header>

        <main className={layout.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
