import { describe, it, expect, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";

// `beforeLoad` guards navigation; this test covers the session: signing out on a signed-in
// page flips the context's `currentUser` to null with no navigation at all. Firebase's auth
// object and the auth context are both replaced by mutable stands-ins the test drives.
const authMock = vi.hoisted(() => ({
  currentUser: null,
  authStateReady: () => Promise.resolve(),
}));
vi.mock("../../firebase", () => ({ auth: authMock, db: {}, storage: {} }));

const authStore = vi.hoisted(() => {
  let user = null;
  const listeners = new Set();
  return {
    read: () => user,
    write: (next) => {
      user = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});
vi.mock("../../contexts/AuthContext", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useAuth: () => ({
      currentUser: useSyncExternalStore(authStore.subscribe, authStore.read),
    }),
  };
});

vi.mock("../../pages/Home", async () => {
  const { Outlet } = await import("@tanstack/react-router");
  return { default: () => <Outlet /> };
});
// Reads the user the way the real pages do, so rendering it signed out throws.
vi.mock("../../pages/Events", async () => {
  const { useAuth } = await import("../../contexts/AuthContext");
  return {
    default: function EventsStub() {
      const { currentUser } = useAuth();
      return <h1>Events page for {currentUser.uid}</h1>;
    },
  };
});
vi.mock("../../pages/MyItems", () => ({ default: () => <h1>My items</h1> }));
vi.mock("../../pages/Login", () => ({ default: () => <h1>Login page</h1> }));
vi.mock("../../pages/Signup", () => ({ default: () => <h1>Signup page</h1> }));
vi.mock("../../components/CookingLoader", () => ({
  default: () => <p>loading</p>,
}));

import { createAppRouter } from "../../router";

const BASEPATH = "/projects/wbw";
const signedInUser = { uid: "user-1" };

describe("signing out on a signed-in page", () => {
  it("sends the visitor to /login and never renders the page without a user", async () => {
    authMock.currentUser = signedInUser;
    authStore.write(signedInUser);
    const history = createMemoryHistory({
      initialEntries: [`${BASEPATH}/events`],
    });
    const router = createAppRouter({ basepath: BASEPATH, history });
    render(<RouterProvider router={router} />);
    await screen.findByText("Events page for user-1");

    act(() => {
      authMock.currentUser = null;
      authStore.write(null);
    });

    await screen.findByText("Login page");
    expect(history.location.pathname).toBe(`${BASEPATH}/login`);
    const redirect = new URLSearchParams(history.location.search).get(
      "redirect",
    );
    expect(redirect).toBe(`${BASEPATH}/events`);
  });
});
