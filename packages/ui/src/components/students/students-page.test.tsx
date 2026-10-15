import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClubsSocieties } from "./clubs-societies";
import { HouseSystem } from "./house-system";
import { PrefectsCta } from "./prefects-cta";
import { StudentEvents } from "./student-events";
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

  it("orders the sections as the page's reading path", () => {
    const { container } = render(<StudentsPage />);

    // The jump links promise sports, clubs, houses and prefects in that order;
    // the DOM has to agree or keyboard order and the visual order diverge.
    const main = container.querySelector("main");
    const ids = [...(main?.querySelectorAll("section[id]") ?? [])].map(
      (section) => `#${section.id}`
    );

    expect(ids).toStrictEqual(["#sports", "#clubs", "#houses", "#prefects"]);
  });

  it("takes the hero and clubs heading from the CMS when it supplies one", () => {
    render(
      <StudentsPage
        activitiesHeading="Clubs, Teams & Societies"
        heading="Life Outside the Classroom"
      />
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Life Outside the Classroom",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Clubs, Teams & Societies",
      })
    ).toBeInTheDocument();
  });

  it("renames a house only where the CMS actually published one", () => {
    render(<StudentsPage houseNames={{ gold: "Loyola House" }} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Loyola House" })
    ).toBeInTheDocument();
    // The published name carries its colour as a sub-label; the unnamed houses
    // are still announced by the colour name alone, with nothing invented.
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Crimson" })
    ).toBeInTheDocument();
  });

  it("drops the overflow panel when the CMS clears the list", () => {
    render(<StudentsPage moreSports={[]} />);

    // "More sports" is the panel's only heading, so it standing or falling is
    // the whole assertion.
    expect(
      screen.queryByRole("heading", { level: 3, name: "More sports" })
    ).toBeNull();
  });

  it("uses the CMS prefects copy", () => {
    render(
      <StudentsPage
        prefectsBody="The Guild keeps the college's daily order."
        prefectsHeading="Student Leadership"
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Student Leadership" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /meet the/iu })).toBeNull();
  });

  it("renders no diary section until the college publishes an event", () => {
    const { rerender } = render(<StudentsPage events={[]} />);

    // An empty "Coming Up" heading with nothing beneath it teaches the visitor
    // the college has nothing scheduled, which is a claim, not a fact.
    expect(screen.queryByRole("heading", { name: "Coming Up" })).toBeNull();

    rerender(
      <StudentsPage
        events={[
          {
            id: "e1",
            startsAt: "2026-03-12T09:00:00.000Z",
            title: "Inter-house athletics",
            location: "College ground",
          },
        ]}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Coming Up" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Inter-house athletics" })
    ).toBeInTheDocument();
  });
});

describe(StudentEvents, () => {
  it("dates each entry with a machine-readable timestamp", () => {
    render(
      <StudentEvents
        events={[
          {
            id: "e1",
            startsAt: "2026-03-12T09:00:00.000Z",
            title: "Sports day",
          },
        ]}
      />
    );

    // The visible date is presentational; the `dateTime` attribute is what a
    // screen reader reads out, so it has to survive the formatting.
    const time = screen.getByText(/12 March 2026/u);
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("dateTime", "2026-03-12T09:00:00.000Z");
  });

  it("shows a location only when the event supplies one", () => {
    render(
      <StudentEvents
        events={[
          { id: "e1", startsAt: "2026-03-12T09:00:00.000Z", title: "Assembly" },
          {
            id: "e2",
            startsAt: "2026-03-14T09:00:00.000Z",
            location: "Chapel",
            title: "Vespers",
          },
        ]}
      />
    );

    expect(screen.getByText(/Chapel/u)).toBeInTheDocument();
    // No stray separator left behind on the entry that has no location.
    expect(
      screen.getByRole("heading", { level: 3, name: "Assembly" })
    ).toBeInTheDocument();
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
  it("renders the leadership copy with no call to action", () => {
    render(<PrefectsCta />);

    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
