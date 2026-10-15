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
import { ContactMap } from "./contact-map";
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

/**
 * `window.location.href` is assigned to navigate the browser, which jsdom
 * cannot do, so it is stubbed and asserted on instead. The point of the
 * assertion is that the message is *composed and handed off* - the page
 * never claims it sent anything itself.
 */
const stubLocationHref = () => {
  const assign = vi.fn<(value: string) => void>();
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...original,
      get href() {
        return original.href;
      },
      set href(value: string) {
        assign(value);
      },
    },
    writable: true,
  });
  return {
    assign,
    restore: () => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: original,
        writable: true,
      });
    },
  };
};

describe(ContactPage, () => {
  it("exposes a main landmark the skip link can reach", () => {
    render(<ContactPage />);

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(
      screen.getByRole("link", { name: "Skip to main content" })
    ).toHaveAttribute("href", "#main-content");
  });

  it("has exactly one h1, and the form heading below it is an h2", () => {
    render(<ContactPage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Visit, call or write to us.",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Send us a message" })
    ).toBeInTheDocument();
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
});

describe(ContactMap, () => {
  it("renders directions as a link only when a map URL is configured", () => {
    const { rerender } = render(<ContactMap />);
    expect(
      screen.queryByRole("link", { name: /get directions/iu })
    ).not.toBeInTheDocument();

    rerender(<ContactMap mapUrl="https://maps.example/galle" />);
    const link = screen.getByRole("link", { name: /get directions/iu });
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

  it("keeps a visible label above each field alongside the example text", () => {
    render(<ContactForm />);

    const nameField = screen.getByLabelText(/full name/iu);
    // The label is always the accessible name; the placeholder is only a
    // worked example and never stands in for it (SC 3.3.2).
    expect(nameField).toHaveAttribute("placeholder", "Nimal Perera");
    expect(screen.getByText("Full name")).toBeVisible();
  });

  it("prefills the subject from the topic and says where it is sent", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/subject/iu)).toHaveValue("General enquiry");
    fireEvent.click(screen.getByRole("button", { name: "Admissions" }));

    expect(screen.getByLabelText(/subject/iu)).toHaveValue(
      "Admissions enquiry"
    );
    // No department address is configured, so it still goes to the main
    // office, and the form says so rather than naming the Admissions Office.
    expect(screen.getByText("College Office")).toBeInTheDocument();
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
      expect(onSubmit).toHaveBeenCalledWith({ ...VALID_ENQUIRY, telephone: "" })
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

  it("composes a mailto URL addressed to the College office when no endpoint is wired up", async () => {
    const { assign, restore } = stubLocationHref();

    try {
      render(<ContactForm />);

      fill();
      submit();

      await waitFor(() => expect(assign.mock.calls.length).toBeGreaterThan(0));

      const mailto = assign.mock.calls[0]?.[0] as string;
      expect(mailto.startsWith("mailto:info@aloysiuscollege.lk?")).toBeTruthy();
      const params = new URLSearchParams(mailto.split("?")[1]);
      expect(params.get("subject")).toBe(VALID_ENQUIRY.subject);
    } finally {
      restore();
    }
  });

  it("carries the typed fields in the composed mailto body", async () => {
    const { assign, restore } = stubLocationHref();

    try {
      render(<ContactForm />);

      fill();
      submit();

      await waitFor(() => expect(assign.mock.calls.length).toBeGreaterThan(0));

      const mailto = assign.mock.calls[0]?.[0] as string;
      const params = new URLSearchParams(mailto.split("?")[1]);
      expect(params.get("body")).toContain(VALID_ENQUIRY.name);
      expect(params.get("body")).toContain(VALID_ENQUIRY.email);
      expect(params.get("body")).toContain(VALID_ENQUIRY.message);
    } finally {
      restore();
    }
  });

  it("says the email app was opened, not that the message was sent, and keeps it in the field", async () => {
    const { assign, restore } = stubLocationHref();

    try {
      render(<ContactForm />);

      fill();
      submit();

      await waitFor(() => expect(assign.mock.calls.length).toBeGreaterThan(0));

      // It says the app was opened, never that the message was sent.
      expect(screen.getByRole("status")).toHaveTextContent(
        /email app should now be open/iu
      );
      expect(screen.getByRole("status")).not.toHaveTextContent(/thank you/iu);

      // The typed message survives, so it can still be sent by hand.
      expect(screen.getByLabelText(/full name/iu)).toHaveValue(
        VALID_ENQUIRY.name
      );
    } finally {
      restore();
    }
  });

  it("refuses an over-long message rather than silently truncating it", async () => {
    const { assign, restore } = stubLocationHref();

    try {
      render(<ContactForm />);

      fill();
      // The message field allows 4,000 characters; a `mailto:` URL past about
      // 1,800 is where mail clients start dropping body text.
      const message = screen.getByLabelText(/message/iu);
      fireEvent.change(message, { target: { value: "x".repeat(4000) } });
      submit();

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          /too long to hand off/iu
        )
      );
      expect(assign).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });
});
