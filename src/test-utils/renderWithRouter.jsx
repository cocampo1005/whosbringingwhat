import { render } from "@testing-library/react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";

/** Renders `ui` inside a one-route memory router so `Link`, `useNavigate` and friends work. */
export function renderWithRouter(
  ui,
  { initialEntries = ["/"], basepath = "/" } = {},
) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    basepath,
    history: createMemoryHistory({ initialEntries }),
  });
  return { router, ...render(<RouterProvider router={router} />) };
}
