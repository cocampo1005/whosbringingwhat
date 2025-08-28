import Navbar from "../components/Navbar";
import { Link, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/logo-with-face-outlined.svg";

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
    <div className="flex min-h-screen flex-col overflow-hidden md:flex-row">
      <Navbar />

      <div className="flex flex-1 flex-col md:ml-56">
        {/* Top header */}
        <header className="fixed left-0 right-0 top-0 z-10 bg-primaryRed px-6 py-3 shadow md:left-56 md:bg-rose-100 md:pl-12">
          <div className="relative flex items-center justify-center gap-4 md:justify-start">
            <Link to="/" className="absolute left-0 md:hidden">
              <img src={logo} className="h-10" />
            </Link>
            <h1 className="text-primaryLight text-center text-[1.5rem] font-bold tracking-wide md:text-left md:text-2xl md:text-primaryRed">
              {getPageName()}
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
