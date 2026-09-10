import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "../../test-utils/renderWithRouter";
import { useEmbedded } from "../../hooks/useEmbedded";

const BASEPATH = "/projects/wbw";

/** Prints the hook's answer so the test can read it off the DOM. */
function EmbeddedProbe() {
  const embedded = useEmbedded();
  return <p>{embedded ? "embedded" : "standalone"}</p>;
}

describe("useEmbedded", () => {
  it("is false when the router mounts at the origin root", async () => {
    renderWithRouter(<EmbeddedProbe />);

    expect(await screen.findByText("standalone")).toBeInTheDocument();
  });

  it("is true when the router mounts under a host basepath", async () => {
    renderWithRouter(<EmbeddedProbe />, {
      basepath: BASEPATH,
      initialEntries: [BASEPATH],
    });

    expect(await screen.findByText("embedded")).toBeInTheDocument();
  });
});
