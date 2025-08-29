import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { UsersProvider } from "./contexts/UsersContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UsersProvider>
          <App />
        </UsersProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
