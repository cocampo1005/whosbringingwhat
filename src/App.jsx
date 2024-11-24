import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";
import Events from "./pages/Events";
import MyItems from "./pages/MyItems";
import Profile from "./pages/Profile";
import EventDetails from "./pages/EventDetails";

function App() {
  const { currentUser } = useAuth();
  console.log(currentUser);

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
        <Route path="events/:eventId" element={<EventDetails />} />
        <Route path="my-items" element={<MyItems />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Public Routes */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
