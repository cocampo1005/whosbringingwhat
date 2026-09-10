import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Every stylesheet rule is scoped as a descendant of `.wbw`, so this test only needs the DOM
// shape App produces, not routing or auth behavior: the router, its provider, and the three
// context providers are stubbed out so the wrapper markup can be asserted in isolation.
vi.mock("../../router", () => ({ createAppRouter: () => ({}) }));
vi.mock("@tanstack/react-router", () => ({ RouterProvider: () => null }));
vi.mock("../../contexts/AuthContext.jsx", () => ({
  AuthProvider: ({ children }) => children,
}));
vi.mock("../../contexts/RoleContext.jsx", () => ({
  RoleProvider: ({ children }) => children,
}));
vi.mock("../../contexts/UsersContext.jsx", () => ({
  UsersProvider: ({ children }) => children,
}));

import App from "../../App";

describe("App wrapper", () => {
  it("keeps the .wbw scope class on its own element standalone, with min-h-screen on the child", () => {
    const { container } = render(<App basename="/" />);

    const scopeElement = container.firstChild;
    expect(scopeElement.className).toBe("wbw");

    const layoutElement = scopeElement.firstChild;
    expect(layoutElement.classList.contains("min-h-screen")).toBe(true);
    expect(layoutElement.classList.contains("bg-yellow-50")).toBe(true);
    expect(layoutElement.classList.contains("wbw-embedded")).toBe(false);
    expect(layoutElement.firstChild.hasAttribute("class")).toBe(false);
  });

  it("mounts the app in a stable-height frame that pins fixed elements when under a basename", () => {
    const { container } = render(<App basename="/projects/wbw" />);

    const scopeElement = container.firstChild;
    const frameElement = scopeElement.firstChild;
    expect(frameElement.classList.contains("bg-yellow-50")).toBe(true);
    expect(frameElement.classList.contains("min-h-screen")).toBe(false);
    // The frame is the containing block for every `position: fixed` descendant (its transform)
    // and the stylesheet remaps the screen-height utilities under `.wbw-embedded` to fill it.
    expect(frameElement.classList.contains("wbw-embedded")).toBe(true);
    expect(frameElement.classList.contains("[transform:translateZ(0)]")).toBe(
      true,
    );
    expect(frameElement.classList.contains("h-[80dvh]")).toBe(true);
    expect(frameElement.classList.contains("min-h-[560px]")).toBe(true);

    const scrollElement = frameElement.firstChild;
    expect(scrollElement.classList.contains("h-full")).toBe(true);
    expect(scrollElement.classList.contains("overflow-y-auto")).toBe(true);
  });
});
