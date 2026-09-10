import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareButton from "../../components/ShareButton";
import { renderWithRouter } from "../../test-utils/renderWithRouter";

describe("ShareButton", () => {
  afterEach(() => vi.restoreAllMocks());

  it("builds the link from the current origin and basepath", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: undefined,
      configurable: true,
    });
    vi.spyOn(window, "alert").mockImplementation(() => {});

    renderWithRouter(<ShareButton eventId="event-1" eventTitle="Brunch" />, {
      initialEntries: ["/projects/wbw/events/event-1"],
      basepath: "/projects/wbw",
    });
    await userEvent.click(await screen.findByRole("button"));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/projects/wbw/events/event-1`,
    );
  });
});
