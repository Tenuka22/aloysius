import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NotFoundPage } from "./not-found-page";
import { ServerErrorPage } from "./server-error-page";
import { UnderConstructionPage } from "./under-construction-page";

describe(NotFoundPage, () => {
  it("names the status code in the heading, not only in the decorative numeral", () => {
    render(<NotFoundPage />);

    // The giant "404" is aria-hidden, so the code has to survive in the h1 for
    // anyone who never sees it.
    expect(
      screen.getByRole("heading", { level: 1, name: /404/u })
    ).toBeInTheDocument();
  });

  it("offers a route out of the dead end", () => {
    render(<NotFoundPage />);

    expect(
      screen.getByRole("link", { name: "Return to homepage" })
    ).toHaveAttribute("href", "/");

    const suggestions = screen.getByRole("navigation", { name: "Try instead" });
    expect(within(suggestions).getAllByRole("link")).toHaveLength(5);
  });

  it("exposes a main landmark the skip link can reach", () => {
    render(<NotFoundPage />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(
      screen.getByRole("link", { name: "Skip to main content" })
    ).toHaveAttribute("href", "#main-content");
  });
});

describe(UnderConstructionPage, () => {
  it("names the section being built", () => {
    render(<UnderConstructionPage sectionName="Alumni directory" />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Alumni directory/u })
    ).toBeInTheDocument();
  });

  it("reports build progress as a real progressbar", () => {
    render(<UnderConstructionPage percentComplete={40} />);

    expect(
      screen.getByRole("progressbar", { name: "Build progress" })
    ).toHaveValue(40);
  });

  it("clamps out-of-range percentages rather than overflowing the track", () => {
    render(<UnderConstructionPage percentComplete={140} />);

    expect(screen.getByRole("progressbar")).toHaveValue(100);
  });

  it("omits the indicator entirely when no percentage is known", () => {
    render(<UnderConstructionPage />);

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe(ServerErrorPage, () => {
  it("names the status code in the heading", () => {
    render(<ServerErrorPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /500/u })
    ).toBeInTheDocument();
  });

  it("shows the support reference when one is supplied", () => {
    render(
      <ServerErrorPage reference="abc123" timestamp="2026-09-14T09:30:00Z" />
    );

    expect(screen.getByText(/abc123/u)).toBeInTheDocument();
  });

  it("renders nothing about references when there is no correlation id", () => {
    render(<ServerErrorPage />);

    expect(screen.queryByText(/Reference/u)).not.toBeInTheDocument();
  });
});
