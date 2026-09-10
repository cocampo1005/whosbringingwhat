import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";

// The router guards read Firebase directly; the pages touch Firestore. Stub both so the test
// exercises only routing under a basepath.
const authMock = vi.hoisted(() => ({
  currentUser: null,
  authStateReady: () => Promise.resolve(),
}));
vi.mock("../../firebase", () => ({ auth: authMock, db: {}, storage: {} }));
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

import { createAppRouter } from "../../router";

const BASEPATH = "/projects/wbw";

describe("router under a basepath", () => {
  it("sends a signed-out visitor to /login under the basepath and remembers the target", async () => {
    authMock.currentUser = null;
    const history = createMemoryHistory({
      initialEntries: [`${BASEPATH}/events`],
    });
    const router = createAppRouter({ basepath: BASEPATH, history });
    render(<RouterProvider router={router} />);

    await screen.findByText("Login page");
    expect(history.location.pathname).toBe(`${BASEPATH}/login`);
    const redirect = new URLSearchParams(history.location.search).get(
      "redirect",
    );
    expect(redirect).toBe(`${BASEPATH}/events`);
  });

  it("renders the events page under the basepath for a signed-in user", async () => {
    authMock.currentUser = { uid: "user-1" };
    const history = createMemoryHistory({
      initialEntries: [`${BASEPATH}/events`],
    });
    const router = createAppRouter({ basepath: BASEPATH, history });
    render(<RouterProvider router={router} />);

    await screen.findByText("Events page");
    expect(history.location.pathname).toBe(`${BASEPATH}/events`);
  });

  it("redirects the index to /events under the basepath", async () => {
    authMock.currentUser = { uid: "user-1" };
    const history = createMemoryHistory({ initialEntries: [`${BASEPATH}/`] });
    const router = createAppRouter({ basepath: BASEPATH, history });
    render(<RouterProvider router={router} />);

    await screen.findByText("Events page");
    expect(history.location.pathname).toBe(`${BASEPATH}/events`);
  });
});
