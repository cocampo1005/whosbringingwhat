import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";

// The router guards read Firebase directly; the real EventDetails page touches Firestore and a
// long tail of components. Stub both so the test exercises only route-id resolution: does
// `getRouteApi("/home/events/$eventId").useParams()` find an active match for this route.
const authMock = vi.hoisted(() => ({
  currentUser: { uid: "user-1" },
  authStateReady: () => Promise.resolve(),
}));
vi.mock("../../firebase", () => ({ auth: authMock, db: {}, storage: {} }));
// The signed-in layout also watches the auth context; mirror the Firebase stand-in there.
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ currentUser: authMock.currentUser }),
}));
vi.mock("../../pages/Home", async () => {
  const { Outlet } = await import("@tanstack/react-router");
  return { default: () => <Outlet /> };
});
vi.mock("../../pages/Events", () => ({ default: () => <h1>Events page</h1> }));
vi.mock("../../pages/MyItems", () => ({
  default: () => <h1>My items page</h1>,
}));
vi.mock("../../pages/Login", () => ({ default: () => <h1>Login page</h1> }));
vi.mock("../../pages/Signup", () => ({ default: () => <h1>Signup page</h1> }));
vi.mock("../../components/CookingLoader", () => ({
  default: () => <p>loading</p>,
}));
// `eventDetailsRoute` is a child of the pathless "home" layout route, so its composed route id
// is "/home/events/$eventId" — not "/events/$eventId" — and `useParams` must be called against
// that id to find an active match.
vi.mock("../../pages/EventDetails", async () => {
  const { getRouteApi } = await import("@tanstack/react-router");
  return {
    default: () => {
      const { eventId } = getRouteApi("/home/events/$eventId").useParams();
      return <h1>Event {eventId}</h1>;
    },
  };
});

import { createAppRouter } from "../../router";

const BASEPATH = "/projects/wbw";

describe("EventDetails route id under the home layout", () => {
  it("resolves useParams for /home/events/$eventId under a basepath", async () => {
    const history = createMemoryHistory({
      initialEntries: [`${BASEPATH}/events/abc123`],
    });
    const router = createAppRouter({ basepath: BASEPATH, history });
    render(<RouterProvider router={router} />);

    await screen.findByText("Event abc123");
  });
});
