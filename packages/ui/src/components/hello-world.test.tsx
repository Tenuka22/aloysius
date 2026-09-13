import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelloWorld } from "./hello-world";

describe(HelloWorld, () => {
  it("renders the Hello, world! heading", () => {
    render(<HelloWorld />);
    expect(
      screen.getByRole("heading", { name: "Hello, world!" })
    ).toBeInTheDocument();
  });
});
