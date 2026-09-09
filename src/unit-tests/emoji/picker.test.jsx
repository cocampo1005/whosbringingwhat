import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// jsdom does not implement these browser APIs, and emoji-mart's vanilla
// Picker (mounted from @emoji-mart/react's effect) reaches for all three
// during its first render: `matchMedia` for "auto" theme detection, and
// ResizeObserver/IntersectionObserver for laying out emoji rows. None of
// this is React-19-specific; it is jsdom's usual gap for browser platform
// APIs, so it is shimmed here rather than skipped.
let originalMatchMedia;
let originalResizeObserver;
let originalIntersectionObserver;

beforeEach(() => {
  originalMatchMedia = window.matchMedia;
  originalResizeObserver = window.ResizeObserver;
  originalIntersectionObserver = window.IntersectionObserver;

  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));

  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
  window.ResizeObserver = originalResizeObserver;
  window.IntersectionObserver = originalIntersectionObserver;
});

describe("emoji-mart Picker on React 19", () => {
  it("renders and mounts the emoji-mart custom element without throwing", async () => {
    const { container } = render(
      <Picker data={data} onEmojiSelect={() => {}} />,
    );

    await waitFor(() => {
      expect(container.querySelector("em-emoji-picker")).not.toBeNull();
    });
  });
});
