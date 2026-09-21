import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactDetails } from "./contact-details";
import { ContactForm } from "./contact-form";
import { ContactPage } from "./contact-page";

const VALID_ENQUIRY = {
  name: "A. Perera",
  email: "perera@example.lk",
  subject: "Admissions enquiry",
  message: "Please send the admissions dates for the next academic year.",
};

const fill = (overrides: Partial<typeof VALID_ENQUIRY> = {}) => {
  const values = { ...VALID_ENQUIRY, ...overrides };
  fireEvent.change(screen.getByLabelText(/full name/iu), {
    target: { value: values.name },
  });
  fireEvent.change(screen.getByLabelText(/^email/iu), {
    target: { value: values.email },
  });
  fireEvent.change(screen.getByLabelText(/subject/iu), {
    target: { value: values.subject },
  });
  fireEvent.change(screen.getByLabelText(/message/iu), {
    target: { value: values.message },
  });
};

const submit = () => {
  fireEvent.click(screen.getByRole("button", { name: /send message/iu }));
};

describe(ContactPage, () => {
  it("exposes a main landmark the skip link can reach", () => {
    render(<ContactPage />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(
      screen.getByRole("link", { name: "Skip to main content" })
    ).toHaveAttribute("href", "#main-content");
  });

  it("has exactly one h1, and both section headings below it are h2", () => {
    render(<ContactPage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Contact the College" })
    ).toBeInTheDocument();
    for (const name of ["College Office", "Send a Message"]) {
      expect(
        screen.getByRole("heading", { level: 2, name })
      ).toBeInTheDocument();
    }
  });

  it("marks Contact as the current page in the primary nav", () => {
    render(<ContactPage />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByRole("link", { name: "Contact" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});

describe(ContactDetails, () => {
  it("omits a detail the CMS has not supplied rather than showing an empty row", () => {
    render(<ContactDetails telephone="091 223 4567" />);

    expect(screen.getByText("Telephone")).toBeInTheDocument();
    // Email and office hours were not supplied, so they must not appear at all
    // - no empty row, and no `[CMS: ...]` placeholder like the mock had.
    expect(screen.queryByText("Email")).not.toBeInTheDocument();
    expect(screen.queryByText("Office hours")).not.toBeInTheDocument();
  });

  it("dials a stripped number and mails the address", () => {
    render(
      <ContactDetails email="office@example.lk" telephone="+94 (91) 223 4567" />
    );

    // Spaces and brackets in a `tel:` target are invalid and some Android
    // dialers drop the call, so the href must be digits only.
    expect(
      screen.getByRole("link", { name: "+94 (91) 223 4567" })
    ).toHaveAttribute("href", "tel:+94912234567");
    expect(
      screen.getByRole("link", { name: "office@example.lk" })
    ).toHaveAttribute("href", "mailto:office@example.lk");
  });

  it("renders the map badge as a link only when a map URL is configured", () => {
    const { rerender } = render(<ContactDetails />);
    expect(
      screen.queryByRole("link", { name: /view on map/iu })
    ).not.toBeInTheDocument();

    rerender(<ContactDetails mapUrl="https://maps.example/galle" />);
    const link = screen.getByRole("link", { name: /view on map/iu });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe(ContactForm, () => {
  it("reports an empty field and moves focus to it", () => {
    render(
      <ContactForm
        onSubmit={vi.fn<() => Promise<void>>(() => Promise.resolve())}
      />
    );

    submit();

    const nameField = screen.getByLabelText(/full name/iu);
    expect(nameField).toHaveAttribute("aria-invalid", "true");
    // Without this the keyboard user is left on the submit button with the
    // errors announced but no idea where they are (WCAG 2.2 SC 3.3.1).
    expect(nameField).toHaveFocus();
    expect(
      screen.getByText(/enter your name so the office knows/iu)
    ).toBeInTheDocument();
  });

  it("keeps the visible label and shows the example only while focused", () => {
    render(<ContactForm />);

    const nameField = screen.getByLabelText(/full name/iu);
    // The label is the accessible name at rest and while typing - the floating
    // treatment moves it, it never replaces it with a placeholder (SC 3.3.2).
    expect(nameField).toHaveAttribute("placeholder", "");

    fireEvent.focus(nameField);
    expect(nameField).toHaveAttribute("placeholder", "Nimal Perera");

    fireEvent.blur(nameField);
    expect(nameField).toHaveAttribute("placeholder", "");
    expect(screen.getByLabelText(/full name/iu)).toBe(nameField);
  });

  it("links each error to its field with aria-describedby", () => {
    render(
      <ContactForm
        onSubmit={vi.fn<() => Promise<void>>(() => Promise.resolve())}
      />
    );

    submit();

    const messageField = screen.getByLabelText(/message/iu);
    const errorId = messageField.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(
      document.querySelector(`#${errorId as string}`)?.textContent
    ).toMatch(/write your message/iu);
  });

  it("does not submit an incomplete email address", () => {
    const onSubmit = vi.fn<() => Promise<void>>(() => Promise.resolve());
    render(<ContactForm onSubmit={onSubmit} />);

    fill({ email: "perera@example" });
    submit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText(/enter a complete email address/iu)
    ).toBeInTheDocument();
  });

  it("submits a valid enquiry, clears the fields and confirms in a live region", async () => {
    const onSubmit = vi.fn<() => Promise<void>>(() => Promise.resolve());
    render(<ContactForm onSubmit={onSubmit} />);

    fill();
    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ ...VALID_ENQUIRY })
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /your message has been sent/iu
      )
    );
    expect(screen.getByLabelText(/full name/iu)).toHaveValue("");
  });

  it("says the message failed when the endpoint rejects", async () => {
    const onSubmit = vi.fn<() => Promise<void>>(() =>
      Promise.reject(new Error("network"))
    );
    render(<ContactForm onSubmit={onSubmit} />);

    fill();
    submit();

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /could not be sent/iu
      )
    );
    // The typed message must survive a failure so it can be retried.
    expect(screen.getByLabelText(/full name/iu)).toHaveValue(
      VALID_ENQUIRY.name
    );
  });

  it("never claims success when no endpoint is wired up", async () => {
    render(<ContactForm />);

    fill();
    submit();

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /not connected yet/iu
      )
    );
    expect(screen.getByRole("status")).not.toHaveTextContent(/thank you/iu);
  });
});
