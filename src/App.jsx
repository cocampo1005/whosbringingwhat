import { useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { UsersProvider } from "./contexts/UsersContext.jsx";
import { RoleProvider } from "./contexts/RoleContext.jsx";
import { createAppRouter } from "./router.jsx";

/** `basename` is "/" standalone; the portfolio's Bridge passes "/projects/wbw". */
export default function App({ basename = "/" }) {
  const [router] = useState(() => createAppRouter({ basepath: basename }));
  // Every stylesheet rule is scoped as a descendant of `.wbw`, so the scope class lives on an
  // element of its own and the layout classes on a child, where they can match. The full-height
  // rule is standalone-only: inside a host the host owns the page height.
  const standalone = basename === "/";
  return (
    <div className="wbw">
      <div
        className={standalone ? "min-h-screen bg-yellow-50" : "bg-yellow-50"}
      >
        <AuthProvider>
          <RoleProvider>
            <UsersProvider>
              <RouterProvider router={router} />
            </UsersProvider>
          </RoleProvider>
        </AuthProvider>
      </div>
    </div>
  );
}
