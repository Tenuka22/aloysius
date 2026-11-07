import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PrincipalContent } from "../../content/principal";
import { PrincipalMessage } from "./principal-message";

const CONTENT: PrincipalContent = {
  eyebrow: "From the principal",
  quote: "A short pull quote.",
  body: "<p>The complete message.</p>",
  role: "Principal",
  link: { href: "/about#principal", label: "Read the full message" },
  hidden: false,
};

describe(PrincipalMessage, () => {
  it("expands the full message in place instead of linking away", () => {
    render(<PrincipalMessage content={CONTENT} />);

    const toggle = screen.getByRole("button", {
      name: "Read the full message",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("The complete message.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /read the full/iu })).toBeNull();

    fireEvent.click(toggle);

    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByText("The complete message.")).toBeInTheDocument();
  });
});
