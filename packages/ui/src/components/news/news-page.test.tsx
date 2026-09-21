import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { NewsStory } from "../../content/news";
import { FeaturedStory } from "./featured-story";
import { NewsArchive } from "./news-archive";
import { NewsPage } from "./news-page";
import { UpcomingEvents } from "./upcoming-events";

const story = (id: string, category: NewsStory["category"]): NewsStory => ({
  id,
  category,
  title: `Story ${id}`,
  href: `/news/${id}`,
});

describe(NewsPage, () => {
  it("exposes a main landmark the skip link can reach", () => {
    render(<NewsPage />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(
      screen.getByRole("link", { name: "Skip to main content" })
    ).toHaveAttribute("href", "#main-content");
  });

  it("has exactly one h1, and every section heading below it is an h2", () => {
    render(<NewsPage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "News & Events" })
    ).toBeInTheDocument();

    for (const name of ["Latest Stories", "Upcoming Events"]) {
      expect(
        screen.getByRole("heading", { level: 2, name })
      ).toBeInTheDocument();
    }
  });

  it("marks News as the current page in the primary nav", () => {
    render(<NewsPage />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "News" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("ships no CMS placeholder markers in visible copy", () => {
    const { container } = render(<NewsPage />);

    // The mock renders "[CMS]", "[CMS: date]", "[dd]" and "[MON]" as literal
    // text. None of it may reach a visitor.
    expect(container.textContent).not.toMatch(/\[CMS|\[dd\]|\[MON\]/u);
  });
});

describe(FeaturedStory, () => {
  it("renders nothing when no story is featured", () => {
    const { container } = render(<FeaturedStory />);

    expect(container).toBeEmptyDOMElement();
  });

  it("gives the read link a destination distinct from its visible label", () => {
    render(
      <FeaturedStory
        story={{ ...story("f", "Academic"), title: "Results announced" }}
      />
    );

    // SC 2.4.4: "Read the story" on its own is not a destination.
    expect(
      screen.getByRole("link", { name: "Read the story: Results announced" })
    ).toHaveAttribute("href", "/news/f");
  });

  it("omits the date entirely when the story has none", () => {
    const { container } = render(
      <FeaturedStory story={story("f", "Sports")} />
    );

    // Never a guessed date, and never an empty <time> box.
    expect(container.querySelector("time")).toBeNull();
  });
});

describe(NewsArchive, () => {
  it("offers only categories that actually have stories", () => {
    render(
      <NewsArchive stories={[story("a", "Sports"), story("b", "Sports")]} />
    );

    const filter = screen.getByRole("group", {
      name: "Filter stories by category",
    });
    const chips = within(filter).getAllByRole("button");
    // "All" + "Sports" only — the mock's seven fixed chips guaranteed five
    // filters that matched nothing.
    expect(chips.map((chip) => chip.textContent)).toStrictEqual([
      "All",
      "Sports",
    ]);
  });

  it("filters the grid and reflects the pressed state", () => {
    render(
      <NewsArchive stories={[story("a", "Sports"), story("b", "Academic")]} />
    );

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Academic" }));

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 3, name: "Story b" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Academic" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("shows no pagination until there is a second page", () => {
    const { rerender } = render(
      <NewsArchive pageSize={2} stories={[story("a", "Sports")]} />
    );

    expect(
      screen.queryByRole("navigation", { name: "Story archive pages" })
    ).toBeNull();

    rerender(
      <NewsArchive
        pageSize={2}
        stories={[
          story("a", "Sports"),
          story("b", "Sports"),
          story("c", "Sports"),
        ]}
      />
    );

    const pages = screen.getByRole("navigation", {
      name: "Story archive pages",
    });
    expect(
      within(pages).getByRole("button", { name: "Page 1" })
    ).toHaveAttribute("aria-current", "page");
    // The mock's bare "→" had no accessible name at all.
    expect(
      within(pages).getByRole("button", { name: "Next page" })
    ).toBeEnabled();
  });

  it("pages through the archive and disables next on the last page", () => {
    render(
      <NewsArchive
        pageSize={2}
        stories={[
          story("a", "Sports"),
          story("b", "Sports"),
          story("c", "Sports"),
        ]}
      />
    );

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 3, name: "Story c" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("clamps the page when a filter shrinks the result set", () => {
    render(
      <NewsArchive
        pageSize={2}
        stories={[
          story("a", "Sports"),
          story("b", "Sports"),
          story("c", "Sports"),
          story("d", "Academic"),
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    // Filtering to a one-story category while on page 2 must not leave the
    // grid empty.
    fireEvent.click(screen.getByRole("button", { name: "Academic" }));

    expect(
      screen.getByRole("heading", { level: 3, name: "Story d" })
    ).toBeInTheDocument();
  });

  it("distinguishes an empty archive from an empty filter", () => {
    const { rerender } = render(<NewsArchive stories={[]} />);

    expect(screen.getByText("No stories published yet")).toBeInTheDocument();
    // With nothing published there is nothing to filter by either.
    expect(
      screen.queryByRole("group", { name: "Filter stories by category" })
    ).toBeNull();

    rerender(<NewsArchive stories={[story("a", "Sports")]} />);
    fireEvent.click(screen.getByRole("button", { name: "Sports" }));
    expect(
      screen.getByRole("heading", { level: 3, name: "Story a" })
    ).toBeInTheDocument();
  });

  it("announces the visible count in a live region", () => {
    render(<NewsArchive stories={[story("a", "Sports")]} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Showing 1 of 1 stories, page 1 of 1."
    );
  });
});

describe(UpcomingEvents, () => {
  it("shows an empty state rather than placeholder rows", () => {
    render(<UpcomingEvents events={[]} />);

    expect(screen.getByText("No events scheduled")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).toBeNull();
  });

  it("builds the date badge from the event's real date", () => {
    const { container } = render(
      <UpcomingEvents
        events={[
          {
            id: "feast",
            title: "College Feast",
            date: "2026-06-21",
            venue: "Main Hall",
          },
        ]}
      />
    );

    const time = container.querySelector("time");
    expect(time).toHaveAttribute("datetime", "2026-06-21");
    // The visible badge is decoration; the accessible name is the full date.
    expect(time).toHaveTextContent("21");
    expect(time).toHaveTextContent("21 June 2026");
  });

  it("drops an event whose date cannot be parsed", () => {
    render(
      <UpcomingEvents
        events={[{ id: "bad", title: "Broken", date: "not-a-date" }]}
      />
    );

    // Better an empty state than a badge reading "NaN".
    expect(screen.queryByText("Broken")).toBeNull();
    expect(screen.getByText("No events scheduled")).toBeInTheDocument();
  });

  it("renders a details link only when the event has a real destination", () => {
    const { rerender } = render(
      <UpcomingEvents
        events={[{ id: "e", title: "Prize Giving", date: "2026-03-04" }]}
      />
    );

    expect(screen.queryByRole("link", { name: /Details/u })).toBeNull();

    rerender(
      <UpcomingEvents
        events={[
          {
            id: "e",
            title: "Prize Giving",
            date: "2026-03-04",
            href: "/events/prize-giving",
          },
        ]}
      />
    );
    expect(
      screen.getByRole("link", { name: "Details: Prize Giving" })
    ).toHaveAttribute("href", "/events/prize-giving");
  });
});
