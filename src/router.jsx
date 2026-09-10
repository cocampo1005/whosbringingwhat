import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from "@tanstack/react-router";
import { auth } from "./firebase";
import Home from "./pages/Home";
import Events from "./pages/Events";
import MyItems from "./pages/MyItems";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CookingLoader from "./components/CookingLoader";

const rootRoute = createRootRoute({ component: Outlet });

// Signed-in layout. `authStateReady()` resolves once Firebase has restored the session (or
// decided there is none), so a page refresh never bounces a signed-in user to /login. The
// redirect target is the full public href (basepath included) — `location.href` is the
// router's internal, basepath-stripped representation, while `location.publicHref` is the
// actual browser-visible path that `navigate({ href })` expects back — which Login navigates
// back to as-is.
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "home",
  beforeLoad: async ({ location }) => {
    await auth.authStateReady();
    if (!auth.currentUser) {
      throw redirect({
        to: "/login",
        search: { redirect: location.publicHref },
        replace: true,
      });
    }
  },
  component: Home,
});

const indexRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/events", replace: true });
  },
});

const eventsRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: "/events",
  component: Events,
  staticData: { pageName: "Events" },
});

const eventDetailsRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: "/events/$eventId",
  component: lazyRouteComponent(() => import("./pages/EventDetails")),
  staticData: { pageName: "Events" },
});

const myItemsRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: "/my-items",
  component: MyItems,
  staticData: { pageName: "My Items" },
});

const profileRoute = createRoute({
  getParentRoute: () => homeRoute,
  path: "/profile",
  component: lazyRouteComponent(() => import("./pages/Profile")),
  staticData: { pageName: "Profile" },
});

// NOTE: the brief this router was built from also specifies a `/users` route gated by
// `RequireChef`. Neither `src/components/RequireChef.jsx` nor `src/pages/Users/index.jsx`
// exist at this worktree's base commit (6d6a7d5, derived from `main`@f8f2c14 + Task 1) — that
// work lives only on the unmerged `feature-user-page` branch (commit 53141ef). Both pieces are
// intentionally omitted here; wire them in once that branch merges. See task-2-report.md.

const readRedirect = (search) => ({
  redirect: typeof search.redirect === "string" ? search.redirect : undefined,
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
  validateSearch: readRedirect,
});

export const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: Signup,
  validateSearch: readRedirect,
});

export { eventDetailsRoute };

const routeTree = rootRoute.addChildren([
  homeRoute.addChildren([
    indexRoute,
    eventsRoute,
    eventDetailsRoute,
    myItemsRoute,
    profileRoute,
  ]),
  loginRoute,
  signupRoute,
]);

/**
 * One router per mounted App. `basepath` is "/" on Firebase Hosting and "/projects/wbw" when
 * the portfolio shell mounts the remote; every `to` in the app stays root-relative and the
 * router prefixes it. `history` is only passed by tests (memory history).
 */
export function createAppRouter({ basepath = "/", history } = {}) {
  return createRouter({
    routeTree,
    basepath,
    history,
    defaultPendingComponent: CookingLoader,
    defaultPreload: false,
    scrollRestoration: true,
  });
}
