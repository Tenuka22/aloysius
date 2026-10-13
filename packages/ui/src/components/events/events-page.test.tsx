import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventAgenda } from "./event-agenda";
import type { AgendaEvent } from "./event-agenda";
import { EventHonours } from "./event-honours";
import { NextEventLead } from "./event-lead";
import { RecentEvents } from "./event-recent";
import { EventsPage } from "./events-page";

const event = (overrides: Partial<AgendaEvent> = {}): AgendaEvent => ({
  clubName: null,
  coverImageUrl: null,
  description: null,
  endsAt: null,
  galleries: [],
  id: "e1",
  location: null,
  startsAt: "2026-03-12T09:00:00.000Z",
  title: "Inter-House Athletics Meet",
  ...overrides,
});

describe(EventsPage, () => {
  it("exposes a main landmark the skip link can reach", () => {
    render(<EventsPage events={[event()]} />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(
      screen.getByRole("link", { name: "Skip to main content" })
    ).toHaveAttribute("href", "#main-content");
  });

  it("has one h1 and an h2 per band", () => {
    render(
      <EventsPage
        achievements={[
          {
            id: "a1",
            category: "Sporting",
            detail: null,
            achievedOn: null,
            title: "Southern Province rugby champions",
          },
        ]}
        events={[event()]}
      />
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Events" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "What is coming up" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "What our clubs have achieved",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Inter-House Athletics Meet",
      })
    ).toBeInTheDocument();
  });

  it("marks Events as the current page in the primary nav", () => {
    render(<EventsPage events={[event()]} />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Events" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("offers the honours jump link only when there are honours", () => {
    const { rerender } = render(<EventsPage events={[event()]} />);

    // A link to a section this page did not render is a dead control.
    expect(screen.queryByRole("link", { name: "See the honours" })).toBeNull();

    rerender(
      <EventsPage
        achievements={[
          {
            id: "a1",
            category: null,
            detail: null,
            achievedOn: null,
            title: "A published honour",
          },
        ]}
        events={[event()]}
      />
    );

    expect(
      screen.getByRole("link", { name: "See the honours" })
    ).toHaveAttribute("href", "#honours");
    expect(
      screen.getByRole("region", { name: "What our clubs have achieved" })
    ).toBeInTheDocument();
  });
});

describe(EventAgenda, () => {
  it("reads each entry as one machine-readable date", () => {
    const { container } = render(<EventAgenda events={[event()]} />);

    const entry = container.querySelector("#event-e1");
    expect(entry).not.toBeNull();

    const time = within(entry as HTMLElement).getByText("12");
    expect(time.closest("time")).toHaveAttribute(
      "dateTime",
      "2026-03-12T09:00:00.000Z"
    );
    // The month and weekday are part of the same date, not separate fragments.
    expect(
      within(entry as HTMLElement).getByText("Mar 2026")
    ).toBeInTheDocument();
    expect(
      within(entry as HTMLElement).getByText("Thursday")
    ).toBeInTheDocument();
  });

  it("shows a club only where the record has one", () => {
    render(
      <EventAgenda
        events={[
          event(),
          event({
            clubName: "Photography Club",
            id: "e2",
            title: "Photo walk",
          }),
        ]}
      />
    );

    expect(screen.getByText("Photography Club")).toBeInTheDocument();
    // The unattributed entry carries no invented club name.
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("says nothing is scheduled rather than showing an empty list", () => {
    render(<EventAgenda events={[]} />);

    expect(
      screen.getByText(/Nothing is scheduled at the moment/u)
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe(NextEventLead, () => {
  it("states the countdown in whole days", () => {
    const { rerender } = render(
      <NextEventLead
        event={{
          clubName: null,
          coverImageUrl: null,
          daysAway: 9,
          description: null,
          galleries: [],
          id: "e1",
          location: null,
          startsAt: "2026-03-12T09:00:00.000Z",
          title: "Inter-House Athletics Meet",
        }}
      />
    );

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Inter-House Athletics Meet",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();

    rerender(
      <NextEventLead
        event={{
          clubName: null,
          coverImageUrl: null,
          daysAway: 0,
          description: null,
          galleries: [],
          id: "e1",
          location: null,
          startsAt: "2026-03-12T09:00:00.000Z",
          title: "Inter-House Athletics Meet",
        }}
      />
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("links the galleries it was given", () => {
    render(
      <NextEventLead
        event={{
          clubName: "Photography Club",
          coverImageUrl: null,
          daysAway: 3,
          description: null,
          galleries: [
            { id: "g1", slug: "science-fair-2026", title: "Science Fair" },
          ],
          id: "e1",
          location: "Main Hall",
          startsAt: "2026-03-12T09:00:00.000Z",
          title: "Science Exhibition 2026",
        }}
      />
    );

    expect(screen.getByRole("link", { name: "Science Fair" })).toHaveAttribute(
      "href",
      "/galleries/science-fair-2026"
    );
    // The club and the place are in the meta line, and the club is shown because
    // the record has one.
    expect(screen.getByText(/Photography Club/u)).toBeInTheDocument();
  });
});

describe(RecentEvents, () => {
  it("renders no band at all when nothing has run", () => {
    const { container } = render(<RecentEvents events={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("counts galleries rather than saying there are photographs", () => {
    render(
      <RecentEvents
        events={[
          {
            coverImageUrl: null,
            galleries: [
              { id: "g1", slug: "a", title: "One" },
              { id: "g2", slug: "b", title: "Two" },
            ],
            id: "e1",
            location: "Main Hall",
            startsAt: "2026-01-10T09:00:00.000Z",
            title: "Science Exhibition 2026",
          },
        ]}
      />
    );

    expect(screen.getByText("2 galleries")).toBeInTheDocument();
  });
});

describe(EventHonours, () => {
  it("renders no band at all when nothing has been published", () => {
    const { container } = render(<EventHonours achievements={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("joins only the fields the record carries", () => {
    render(
      <EventHonours
        achievements={[
          {
            id: "a1",
            category: "Sporting",
            detail: null,
            achievedOn: null,
            title: "Provincial champions",
          },
        ]}
      />
    );

    // No date, so no trailing separator left dangling after the category.
    expect(screen.getByText("Sporting")).toBeInTheDocument();
  });
});
