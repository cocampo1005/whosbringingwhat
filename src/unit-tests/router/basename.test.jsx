import { useEffect } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  RouterProvider,
  useNavigate,
} from "@tanstack/react-router";
import { renderWithRouter } from "../../test-utils/renderWithRouter";

// The router guards read Firebase directly; the pages touch Firestore. Stub both so the test
// exercises only routing under a basepath.
const authMock = vi.hoisted(() => ({
  currentUser: null,
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

import { createAppRouter, loginRoute } from "../../router";

const BASEPATH = "/projects/wbw";

/** Mounted by the round-trip test below; navigates once on mount via a captured href. */
function NavigateOnMount({ href }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ href, replace: true });
  }, [navigate, href]);
  return null;
}

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

  it("sends a signed-out visitor to /login without a basepath (basepath '/')", async () => {
    authMock.currentUser = null;
    const history = createMemoryHistory({ initialEntries: ["/events"] });
    const router = createAppRouter({ basepath: "/", history });
    render(<RouterProvider router={router} />);

    await screen.findByText("Login page");
    expect(history.location.pathname).toBe("/login");
    const redirect = new URLSearchParams(history.location.search).get(
      "redirect",
    );
    expect(redirect).toBe("/events");
  });

  it("round-trips a captured publicHref back through navigate({ href }) under a basepath", async () => {
    const { router } = renderWithRouter(
      <NavigateOnMount href={`${BASEPATH}/my-items`} />,
      { basepath: BASEPATH, initialEntries: [`${BASEPATH}/login`] },
    );

    await waitFor(() => {
      expect(router.history.location.pathname).toBe(`${BASEPATH}/my-items`);
    });
  });
});

describe("readRedirect search validation (open-redirect guard)", () => {
  it("drops an absolute URL pointing off-site", () => {
    expect(
      loginRoute.options.validateSearch({ redirect: "https://evil.example/" }),
    ).toEqual({ redirect: undefined });
  });

  it("drops a protocol-relative URL pointing off-site", () => {
    expect(
      loginRoute.options.validateSearch({ redirect: "//evil.example" }),
    ).toEqual({ redirect: undefined });
  });

  it("keeps a same-origin, root-relative path", () => {
    expect(
      loginRoute.options.validateSearch({
        redirect: "/projects/wbw/my-items",
      }),
    ).toEqual({ redirect: "/projects/wbw/my-items" });
  });
});
