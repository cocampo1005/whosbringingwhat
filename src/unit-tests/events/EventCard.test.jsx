import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import EventCard from "../../components/EventCard";
import { renderWithRouter } from "../../test-utils/renderWithRouter";

vi.mock("../../components/ShareButton", () => ({
  default: ({ eventId }) => (
    <button type="button" data-testid={`share-${eventId}`}>
      share
    </button>
  ),
}));

describe("EventCard", () => {
  const baseEvent = {
    id: "event-1",
    title: "Test Event",
    date: "Jan 1, 2025",
    time: "18:00",
    location: "Test Location",
    description: "Test description",
    bannerColor: "#111827",
  };

  it("renders hero image when imageUrl is present", async () => {
    const events = [
      { ...baseEvent, imageUrl: "https://example.com/image.jpg" },
    ];

    renderWithRouter(<EventCard events={events} />);

    const img = await screen.findByAltText("Test Event");
    expect(img).toBeInTheDocument();
  });

  it("renders colored banner when imageUrl is missing", async () => {
    const events = [{ ...baseEvent, imageUrl: "" }];

    renderWithRouter(<EventCard events={events} />);

    // There should be no <img>, but the title and share button should render
    expect(await screen.findByText("Test Event")).toBeInTheDocument();
    expect(screen.queryByAltText("Test Event")).toBeNull();
    expect(screen.getByTestId("share-event-1")).toBeInTheDocument();
  });
});
