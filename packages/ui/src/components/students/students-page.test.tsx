import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClubsSocieties } from "./clubs-societies";
import { HouseSystem } from "./house-system";
import { PrefectsCta } from "./prefects-cta";
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
      "The College Houses",
      "Prefects' Guild & Student Leadership",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name })
      ).toBeInTheDocument();
    }
  });

  it("points every jump link at a section that actually exists", () => {
    const { container } = render(<StudentsPage />);

    const jumpNav = screen.getByRole("navigation", { name: "On this page" });
    const links = within(jumpNav).getAllByRole("link");
    expect(links).toHaveLength(4);

    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href.startsWith("#")).toBeTruthy();
      // A jump link to a missing id is a dead control, and nothing in the type
      // system catches it - only this assertion does.
      expect(container.querySelector(href)).not.toBeNull();
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

  it("names every sport the design lists", () => {
    const { container } = render(<StudentsPage />);

    const sports = container.querySelector("#sports");
    expect(sports).not.toBeNull();

    for (const name of ["Cricket", "Rugby", "Athletics"]) {
      expect(
        within(sports as HTMLElement).getByRole("heading", { level: 3, name })
      ).toBeInTheDocument();
    }
    // The overflow panel is a real list, not a bullet-separated string, so its
    // items are individually announced.
    for (const name of ["Swimming", "Football", "Chess"]) {
      expect(within(sports as HTMLElement).getByText(name)).toBeInTheDocument();
    }
  });
});

describe(ClubsSocieties, () => {
  it("renders a description only when the society supplies one", () => {
    render(
      <ClubsSocieties
        clubs={[
          {
            id: "media",
            name: "Media Unit",
            description: "Runs the newsroom.",
          },
          { id: "scouts", name: "Scouts" },
        ]}
      />
    );

    expect(screen.getByText("Runs the newsroom.")).toBeInTheDocument();
    // The unpublished one must degrade to an empty slot, never to a filler
    // dash or a `[CMS: ...]` marker.
    const scouts = screen
      .getByRole("heading", { level: 3, name: "Scouts" })
      .closest("li");
    expect(scouts?.textContent).toBe("Scouts");
  });
});

describe(HouseSystem, () => {
  it("announces every house by text, never by its colour alone", () => {
    const { container } = render(<HouseSystem />);

    // Four cards, four headings: the swatch is decoration and must not be the
    // only thing identifying a house (WCAG 2.2 SC 1.4.1).
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(4);
    for (const swatch of container.querySelectorAll("span[aria-hidden]")) {
      expect(swatch.textContent).toBe("");
    }
  });

  it("prefers a published house name and invents none when it is missing", () => {
    render(
      <HouseSystem
        houses={[
          {
            id: "crimson",
            swatch: "crimson",
            colorName: "Crimson",
            name: "Loyola House",
          },
          { id: "gold", swatch: "gold", colorName: "Gold" },
        ]}
      />
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Loyola House" })
    ).toBeInTheDocument();
    // Unpublished: the colour name carries the card, and nothing else appears.
    const gold = screen
      .getByRole("heading", { level: 3, name: "Gold" })
      .closest("li");
    expect(gold?.textContent).toBe("Gold");
  });
});

describe(PrefectsCta, () => {
  it("renders no call to action until a real destination exists", () => {
    const { rerender } = render(<PrefectsCta />);

    // The mock's `href="#"` is a button that navigates nowhere; shipping none
    // is the honest alternative.
    expect(screen.queryByRole("link")).toBeNull();

    rerender(<PrefectsCta href="/prefects" />);
    expect(
      screen.getByRole("link", { name: "Meet the prefects" })
    ).toHaveAttribute("href", "/prefects");
  });
});
