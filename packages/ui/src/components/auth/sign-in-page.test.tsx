import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignInPage } from "./sign-in-page";

const noop = () => Promise.resolve();

const fillAndSubmit = ({
  username = "principal",
  password = "hunter2",
}: { username?: string; password?: string } = {}) => {
  fireEvent.change(screen.getByLabelText("USERNAME"), {
    target: { value: username },
  });
  fireEvent.change(screen.getByLabelText("PASSWORD"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "SIGN IN" }));
};

describe(SignInPage, () => {
  it("exposes a main landmark and a single h1", () => {
    render(<SignInPage onSubmit={noop} />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("submits the typed credentials with the remember-me state", async () => {
    const onSubmit = vi.fn<() => Promise<void>>(() => Promise.resolve());
    render(<SignInPage onSubmit={onSubmit} />);

    fillAndSubmit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        username: "principal",
        password: "hunter2",
        rememberMe: true,
      })
    );
  });

  it("lets the user opt out of a persistent session", async () => {
    const onSubmit = vi.fn<() => Promise<void>>(() => Promise.resolve());
    render(<SignInPage onSubmit={onSubmit} />);

    fireEvent.click(
      screen.getByRole("checkbox", { name: /keep me signed in/iu })
    );
    fillAndSubmit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ rememberMe: false })
      )
    );
  });

  it("toggles the password between masked and revealed", () => {
    render(<SignInPage onSubmit={noop} />);

    const password = screen.getByLabelText("PASSWORD");
    expect(password).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: "SHOW" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);

    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "HIDE" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  /*
   * The bug this component was written to fix: a rejected auth call used to
   * leave the previous route's submit button disabled forever, with no message.
   */
  it("recovers from a rejected submit instead of hanging in the busy state", async () => {
    const onSubmit = vi.fn<() => Promise<void>>(() =>
      Promise.reject(new Error("network down"))
    );
    render(<SignInPage onSubmit={onSubmit} />);

    fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/not recognised/u)
    );

    const button = screen.getByRole("button", { name: "SIGN IN" });
    expect(button).toHaveAttribute("aria-busy", "false");
    expect(button).not.toBeDisabled();
  });

  it("announces a caller-supplied error and wires it to both fields", () => {
    render(
      <SignInPage
        error="Those credentials were not recognised."
        onSubmit={noop}
      />
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();

    for (const label of ["USERNAME", "PASSWORD"]) {
      const field = screen.getByLabelText(label);
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(field).toHaveAttribute("aria-describedby", alert.id);
    }
  });
});
