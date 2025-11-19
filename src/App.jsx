import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";
import Events from "./pages/Events";
import MyItems from "./pages/MyItems";
const EventDetails = lazy(() => import("./pages/EventDetails"));
const Profile = lazy(() => import("./pages/Profile"));

function App() {
  const { currentUser } = useAuth();

  const RequireAuth = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" />;
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
            <Suspense fallback={<div>Loading event...</div>}>
              <EventDetails />
            </Suspense>
          }
        />
        <Route path="my-items" element={<MyItems />} />
        <Route
          path="profile"
          element={
            <Suspense fallback={<div>Loading profile...</div>}>
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
