import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";
import Events from "./pages/Events";
import MyItems from "./pages/MyItems";
import { auth } from "./firebase";
import CookingLoader from "./components/CookingLoader";

const EventDetails = lazy(() => import("./pages/EventDetails"));
const Profile = lazy(() => import("./pages/Profile"));

function App() {
  const RequireAuth = ({ children }) => {
    const { currentUser } = useAuth();
    const location = useLocation();

    // Use immediate Firebase auth state as a fallback
    // so we do not redirect users during the brief period
    // before AuthContext finishes updating.
    const user = currentUser || auth.currentUser;

    // If not authenticated, redirect to login
    // and preserve the original URL for after login.
    if (!user) {
      const redirectTo = encodeURIComponent(
        `${location.pathname}${location.search || ""}`,
      );

      return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
    }

    // Authenticated: render protected content
    return children;
  };

  return (
    <Routes>
      {/* Authenticated Routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      >
        {/* Nested Routes */}
        <Route index element={<Navigate to="/events" replace />} />
        <Route path="events" element={<Events />} />
        <Route
          path="events/:eventId"
          element={
            <Suspense fallback={<CookingLoader />}>
              <EventDetails />
            </Suspense>
          }
        />
        <Route path="my-items" element={<MyItems />} />
        <Route
          path="profile"
          element={
            <Suspense fallback={<CookingLoader />}>
              <Profile />
            </Suspense>
          }
        />
      </Route>

      {/* Public Routes */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
