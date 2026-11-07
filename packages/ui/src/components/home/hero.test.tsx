import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "./hero";

describe(Hero, () => {
  it("offers no links and only the labelled scroll-to-next-section control", () => {
    render(<Hero />);

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Scroll to the next section" })
    ).toBeInTheDocument();
  });
});
