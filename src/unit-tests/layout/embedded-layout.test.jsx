import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "../../test-utils/renderWithRouter";

// The layout only needs a signed-out user: the sidebar then skips the avatar, which would read
// Firestore. Nothing else in Home or Navbar touches Firebase.
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ currentUser: null }),
}));

import Home from "../../pages/Home";

const BASEPATH = "/projects/wbw";

/** The signed-in layout's landmarks, in DOM order: desktop sidebar, mobile tab bar, header. */
async function findLayout() {
  const [sidebar, tabBar] = await screen.findAllByRole("navigation");
  const header = screen.getByRole("banner");
  const column = header.parentElement;
  const root = column.parentElement;
  return { sidebar, tabBar, header, column, root };
}

describe("signed-in layout", () => {
  it("standalone pins the sidebar, tab bar and header to the viewport", async () => {
    renderWithRouter(<Home />);
    const { sidebar, tabBar, header, column, root } = await findLayout();

    expect(sidebar.classList.contains("fixed")).toBe(true);
    expect(sidebar.classList.contains("h-screen")).toBe(true);
    expect(tabBar.classList.contains("fixed")).toBe(true);
    expect(header.classList.contains("fixed")).toBe(true);
    expect(column.classList.contains("md:ml-56")).toBe(true);
    expect(root.classList.contains("min-h-screen")).toBe(true);
  });

  it("embedded keeps every part of the layout inside the host's box", async () => {
    const { container } = renderWithRouter(<Home />, {
      basepath: BASEPATH,
      initialEntries: [BASEPATH],
    });
    const { sidebar, tabBar, header, column, root } = await findLayout();

    expect(container.querySelectorAll(".fixed")).toHaveLength(0);
    expect(header.classList.contains("fixed")).toBe(false);
    expect(sidebar.classList.contains("h-screen")).toBe(false);
    expect(sidebar.classList.contains("w-56")).toBe(true);
    expect(sidebar.classList.contains("md:flex")).toBe(true);
    expect(tabBar.classList.contains("order-last")).toBe(true);
    expect(column.classList.contains("relative")).toBe(true);
    expect(column.classList.contains("md:ml-56")).toBe(false);
    expect(root.classList.contains("min-h-screen")).toBe(false);
  });
});
