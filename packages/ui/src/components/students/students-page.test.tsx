import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClubsSocieties } from "./clubs-societies";
import { StudentsPage } from "./students-page";

describe(StudentsPage, () => {
  it("exposes a main landmark the skip link can reach", () => {
    render(<StudentsPage />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(
      screen.getByRole("link", { name: "Skip to main content" })
    ).toHaveAttribute("href", "#main-content");
  });

  it("has exactly one h1, and every section heading below it is an h2", () => {
    render(<StudentsPage />);

    // A skipped or duplicated level breaks screen-reader heading navigation,
    // which is the primary way a hub page like this gets scanned.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Student Life" })
    ).toBeInTheDocument();

    for (const name of [
      "On the Field",
      "Beyond the Classroom",
      "Annual Encounters",
      "The College Houses",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name })
      ).toBeInTheDocument();
    }
  });

  it("has only the design's sections: no jump links, events, achievements, gallery or prefects", () => {
    render(<StudentsPage />);

    expect(
      screen.queryByRole("navigation", { name: "On this page" })
    ).toBeNull();
    for (const name of ["Coming Up", "Prefects' Guild & Student Leadership"]) {
      expect(screen.queryByRole("heading", { name })).toBeNull();
    }
  });

  it("marks Students as the current page in the primary nav", () => {
    render(<StudentsPage />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Students" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("counts the sports from the two lists: four main and eleven more", () => {
    const { container } = render(<StudentsPage />);

    const sports = container.querySelector("#sports") as HTMLElement;
    expect(within(sports).getByText("15")).toBeInTheDocument();
    expect(within(sports).getByText("11 more sports")).toBeInTheDocument();
    for (const name of ["Cricket", "Rugby", "Hockey", "Football"]) {
      expect(
        within(sports).getByRole("heading", { level: 3, name })
      ).toBeInTheDocument();
    }
  });

  it("lists the three annual encounters", () => {
    const { container } = render(<StudentsPage />);

    const encounters = container.querySelector("#encounters") as HTMLElement;
    expect(
      within(encounters).getAllByRole("heading", { level: 3 })
    ).toHaveLength(3);
    expect(
      within(encounters).getByRole("heading", {
        level: 3,
        name: "The Battle of Dreams",
      })
    ).toBeInTheDocument();
  });

  it("shows all five houses by name", () => {
    const { container } = render(<StudentsPage />);

    const houses = container.querySelector("#houses") as HTMLElement;
    for (const name of [
      "Cooreman",
      "Murphy",
      "Neut",
      "Standaert",
      "Van Reeth",
    ]) {
      expect(
        within(houses).getByRole("heading", { level: 3, name })
      ).toBeInTheDocument();
    }
  });
});

describe(ClubsSocieties, () => {
  it("shows a description only for a club that has one", () => {
    render(
      <ClubsSocieties
        descriptions={{ scouts: "Weekly troop meetings and camps." }}
      />
    );

    expect(
      screen.getByText("Weekly troop meetings and camps.")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(8);
    // No invented filler under the clubs without one.
    expect(
      screen.getAllByText(/./u).filter((node) => node.tagName === "P")
    ).toHaveLength(1);
  });
});
