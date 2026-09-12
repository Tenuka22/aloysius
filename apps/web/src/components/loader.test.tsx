import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Loader from "./loader";

describe("Loader", () => {
  it("renders an accessible loading status indicator", () => {
    render(<Loader />);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});
