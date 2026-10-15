import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultsPage } from "./results-page";

const DATA = {
  "2025": {
    summary: { alThreeA: "34" },
    alRankers: {
      "physical-science": [
        { id: "a", name: "A. Perera", result: "3A", islandRank: "41" },
        { id: "b", name: "B. Silva", result: "2A B" },
      ],
    },
  },
  "2024": {},
};

describe(ResultsPage, () => {
  it("has one h1 and shows empty states when no results are published", () => {
    render(<ResultsPage results={{}} years={["2025"]} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getAllByText(/have not been published for this year yet/iu).length
    ).toBeGreaterThan(0);
  });

  it("lists the stream first and the rest, and omits figures not supplied", () => {
    render(<ResultsPage results={DATA} years={["2025", "2024"]} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "A. Perera" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 4, name: "B. Silva" })
    ).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.queryByText("Z-score")).not.toBeInTheDocument();
  });

  it("switches year", () => {
    render(<ResultsPage results={DATA} years={["2025", "2024"]} />);

    fireEvent.click(screen.getByRole("button", { name: "2024" }));

    expect(screen.getByRole("button", { name: "2024" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.queryByRole("heading", { name: "A. Perera" })
    ).not.toBeInTheDocument();
  });
});
