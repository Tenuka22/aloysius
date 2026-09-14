import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { CmsApp } from "./cms-app";

/**
 * These cover the behaviour that is easy to break silently once the screens are
 * wired to real data: the landmarks, the switch semantics, and the fact that
 * the nav is rendered once rather than once per container.
 *
 * `fireEvent` rather than `user-event` deliberately - the assertions here are
 * about state and semantics, not pointer mechanics, and it avoids adding a
 * dependency for one file.
 */

const showModalStub = function showModalStub(this: HTMLDialogElement) {
  this.open = true;
};

const closeStub = function closeStub(this: HTMLDialogElement) {
  this.open = false;
};

describe(CmsApp, () => {
  beforeAll(() => {
    // jsdom implements neither of these, and the shell calls both on mount.
    if (!window.matchMedia) {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: (query: string) => ({
          matches: false,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }),
      });
    }
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = showModalStub;
      HTMLDialogElement.prototype.close = closeStub;
    }
  });

  it("opens on the homepage editor with a single h1", () => {
    render(<CmsApp />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Homepage Editor");
  });

  it("renders each nav destination exactly once", () => {
    render(<CmsApp />);
    // Two sidebar copies in the tree would make this return 2.
    expect(screen.getAllByRole("button", { name: /Dashboard/u })).toHaveLength(
      1
    );
  });

  it("marks the current screen with aria-current", () => {
    render(<CmsApp />);
    expect(
      screen.getByRole("button", { name: /Homepage Editor/u })
    ).toHaveAttribute("aria-current", "page");
  });

  it("switches screens from the nav", () => {
    render(<CmsApp />);
    fireEvent.click(screen.getByRole("button", { name: /Dashboard/u }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" })
    ).toBeInTheDocument();
    expect(screen.getByText("Pending approval")).toBeInTheDocument();
  });

  it("exposes permissions as real switches that toggle", () => {
    render(<CmsApp initialScreen="profile" />);
    const pages = screen.getByRole("switch", { name: "Pages" });
    expect(pages).toHaveAttribute("aria-checked", "true");
    fireEvent.click(pages);
    expect(pages).toHaveAttribute("aria-checked", "false");
  });

  it("never lets Users & Roles be granted from this screen", () => {
    render(<CmsApp initialScreen="profile" />);
    expect(
      screen.getByRole("switch", { name: "Users & Roles" })
    ).toBeDisabled();
  });

  it("feeds edited hero fields straight into the live preview", () => {
    render(<CmsApp />);

    fireEvent.change(screen.getByLabelText("Tagline"), {
      target: { value: "Certa Viriliter, always" },
    });

    const preview = screen.getByText("Live preview").closest("section");
    expect(preview).not.toBeNull();
    expect(
      within(preview as HTMLElement).getByText("Certa Viriliter, always")
    ).toBeInTheDocument();
  });

  it("labels row actions with the entry they act on", () => {
    render(<CmsApp />);
    fireEvent.click(screen.getByRole("button", { name: /Pages/u }));

    // "Edit" alone would be ambiguous across rows; the title disambiguates it.
    expect(
      screen.getByRole("button", { name: "Edit Homepage" })
    ).toBeInTheDocument();
  });

  it("renders an empty state rather than a bare table for seedless screens", () => {
    render(<CmsApp />);
    // Exact name: "Alumni" is both a nav destination and a homepage block, and
    // the editor's block list is on screen at the same time.
    fireEvent.click(screen.getByRole("button", { name: "Alumni" }));
    expect(screen.getByText(/No alumni entries yet/u)).toBeInTheDocument();
  });

  it("hides a section without removing it from the list", () => {
    render(<CmsApp />);
    const toggle = screen.getByRole("button", { name: /Hide Hero section/u });
    fireEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: /Show Hero section/u })
    ).toBeInTheDocument();
  });
});
