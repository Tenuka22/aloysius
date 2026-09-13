import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import App from "./App";

function setLocation(hostname: string, pathname: string, search: string) {
  Object.defineProperty(window, "location", {
    value: { hostname, pathname, search },
    writable: true,
    configurable: true,
  });
}

describe(App, () => {
  afterEach(() => {
    document.cookie.split(";").forEach((entry) => {
      const name = entry.split("=")[0]?.trim();
      if (name) {
        document.cookie = `${name}=; max-age=0`;
      }
    });
  });

  it("renders the college name and admissions call to action", () => {
    setLocation("example.com", "/", "");
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "St. Aloysius' College" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to Admissions" })
    ).toBeInTheDocument();
  });

  it("forwards the current path and query string to the admissions portal", () => {
    setLocation("example.com", "/application", "?key=abc123");
    render(<App />);

    expect(
      screen.getByRole("link", { name: "Go to Admissions" })
    ).toHaveAttribute(
      "href",
      "https://admissions.aloysiuscollege.lk/application?key=abc123"
    );
  });
});
