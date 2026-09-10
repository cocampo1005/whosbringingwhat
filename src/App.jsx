import { useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { UsersProvider } from "./contexts/UsersContext.jsx";
import { RoleProvider } from "./contexts/RoleContext.jsx";
import { createAppRouter } from "./router.jsx";

/** `basename` is "/" standalone; the portfolio's Bridge passes "/projects/wbw". */
export default function App({ basename = "/" }) {
  const [router] = useState(() => createAppRouter({ basepath: basename }));
  return (
    <AuthProvider>
      <RoleProvider>
        <UsersProvider>
          <RouterProvider router={router} />
        </UsersProvider>
      </RoleProvider>
    </AuthProvider>
  );
}
