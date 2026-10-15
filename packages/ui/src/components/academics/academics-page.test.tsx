import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AcademicsPage } from "./academics-page";

describe(AcademicsPage, () => {
  it("exposes a main landmark the skip link can reach", () => {
    render(<AcademicsPage />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(
      screen.getByRole("link", { name: "Skip to main content" })
    ).toHaveAttribute("href", "#main-content");
  });

  it("has exactly one h1, and every section heading below it is an h2", () => {
    render(<AcademicsPage />);

    // A skipped or duplicated level breaks screen-reader heading navigation,
    // which is the primary way this page gets scanned.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Academic Excellence" })
    ).toBeInTheDocument();

    for (const name of [
      "Sections of Study",
      "A/L Streams",
      "Where Aloysians learn & grow",
      "Examination Results & Achievements",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name })
      ).toBeInTheDocument();
    }
  });

  it("points every jump link at a section that actually exists", () => {
    const { container } = render(<AcademicsPage />);

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

  it("marks Academics as the current page in the primary nav", () => {
    render(<AcademicsPage />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(nav).getByRole("link", { name: "Academics" })
    ).toHaveAttribute("aria-current", "page");
  });

  it("lists all four A/L streams", () => {
    const { container } = render(<AcademicsPage />);

    // Scoped to the streams section: "Commerce" is legitimately both a stream
    // and a subject department, so an unscoped query matches twice.
    const streams = container.querySelector("#streams");
    expect(streams).not.toBeNull();

    for (const name of [
      "Physical Science",
      "Biological Science",
      "Commerce",
      "Arts & Technology",
    ]) {
      expect(
        within(streams as HTMLElement).getByRole("heading", { level: 3, name })
      ).toBeInTheDocument();
    }
  });
});
