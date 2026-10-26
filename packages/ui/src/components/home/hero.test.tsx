import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MANAGEMENT_URL } from "../../content/home";
import { Hero } from "./hero";

describe(Hero, () => {
  it("has exactly one button, and it opens the management portal", () => {
    render(<Hero />);

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", MANAGEMENT_URL);
    expect(links[0]).toHaveAccessibleName("Management Portal");
    expect(links[0]?.getAttribute("rel")).toContain("noopener");
  });

  it("no longer offers an Admissions button", () => {
    render(<Hero />);

    expect(
      screen.queryByRole("link", { name: /admissions/iu })
    ).not.toBeInTheDocument();
  });
});
