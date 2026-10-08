/**
 * Outbound mail for authentication flows (one-time codes, password resets).
 *
 * The transport is chosen by configuration, never by guesswork (forensic
 * audit F-12). `MAIL_TRANSPORT`:
 *
 * - **`console`** — the message is printed to the server log, so the OTP flows
 *   can be completed locally without a mail account. **Refused in
 *   production**: a code printed to a log reaches nobody, and a log is not a
 *   place a one-time code should sit.
 * - **`smtp`** — sent through a real mailbox via SMTP (`nodemailer`):
 *   `SMTP_HOST`, `SMTP_PORT`, optionally `SMTP_USER`/`SMTP_PASS` for an
 *   authenticated relay, `SMTP_SECURE` for implicit TLS (port 465), and
 *   `MAIL_FROM` for the sender. A fresh connection is opened per send — no
 *   pooling — which matches the volume (one-time codes, not bulk mail) and
 *   keeps this transport as stateless as the one it replaced.
 * - **unset** — `console` in development and test; in production every send
 *   fails with a message naming the missing configuration. A silent no-op
 *   would look like a successful send while the code reached nobody, which for
 *   a password reset means a locked-out user and a support call.
 *
 * A provider error is thrown, never swallowed here — but better-auth runs the
 * send through `runInBackgroundOrAwait`, which catches and only logs it, so
 * the person asking still sees success. That is why `mail-guard.ts` refuses
 * the sending endpoints outright (503) when no transport is configured; a
 * configured provider failing at send time remains log-only.
 */

import { createTransport } from "nodemailer";

export interface OutboundMessage {
  to: string;
  subject: string;
  body: string;
}

export type MailDelivery = (message: OutboundMessage) => Promise<void>;

export interface MailConfig {
  NODE_ENV?: string;
  MAIL_TRANSPORT?: string;
  MAIL_FROM?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_SECURE?: string;
  SMTP_ALLOW_SELF_SIGNED?: string;
}

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  rejectUnauthorized: boolean;
  from: string;
  to: string;
  subject: string;
  text: string;
}

/** Injectable so tests never open a real socket. */
export type SmtpSend = (options: SmtpOptions) => Promise<void>;

/** Development transport: logs the message so a developer can finish the flow. */
const logToConsole: MailDelivery = ({ to, subject, body }) => {
  console.info(
    [
      "",
      "──────── auth email (console transport) ────────",
      `to:      ${to}`,
      `subject: ${subject}`,
      body
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n"),
      "────────────────────────────────────────────────",
      "",
    ].join("\n")
  );
  return Promise.resolve();
};

const refuse =
  (reason: string): MailDelivery =>
  ({ to }) =>
    Promise.reject(
      new Error(`Cannot send authentication email to ${to}: ${reason}`)
    );

const defaultSmtpSend: SmtpSend = async ({
  host,
  port,
  secure,
  auth,
  rejectUnauthorized,
  from,
  to,
  subject,
  text,
}) => {
  const transporter = createTransport({
    host,
    port,
    secure,
    auth,
    tls: { rejectUnauthorized },
  });
  try {
    await transporter.sendMail({ from, to, subject, text });
  } finally {
    transporter.close();
  }
};

const viaSmtp =
  (
    smtp: Omit<SmtpOptions, "from" | "to" | "subject" | "text">,
    from: string,
    sendImpl: SmtpSend
  ): MailDelivery =>
  async ({ to, subject, body }) => {
    try {
      await sendImpl({ ...smtp, from, to, subject, text: body });
    } catch (error) {
      // The provider's own error, not swallowed: it names the actual SMTP
      // failure (auth rejected, connection refused, relay denied) rather
      // than a generic "could not send".
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Mail provider refused the message to ${to}: ${reason}`, {
        cause: error,
      });
    }
  };

/** `"587"` -> `587`; anything that isn't a positive integer is a config error. */
const parseSmtpPort = (value: string | undefined): number | undefined => {
  if (!value) {
    return 587;
  }
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : undefined;
};

/** Picks the transport for a configuration. Pure, so it can be tested. */
export const createMailDelivery = (
  config: MailConfig,
  sendImpl: SmtpSend = defaultSmtpSend
): MailDelivery => {
  const production = config.NODE_ENV === "production";
  const transport = config.MAIL_TRANSPORT ?? (production ? "" : "console");

  if (transport === "console") {
    return production
      ? refuse(
          "MAIL_TRANSPORT=console is not allowed in production; configure a real provider"
        )
      : logToConsole;
  }

  if (transport === "smtp") {
    const port = parseSmtpPort(config.SMTP_PORT);
    if (!(config.SMTP_HOST && config.MAIL_FROM && port)) {
      return refuse(
        "MAIL_TRANSPORT=smtp needs SMTP_HOST, a numeric SMTP_PORT, and MAIL_FROM"
      );
    }
    const auth =
      config.SMTP_USER && config.SMTP_PASS
        ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
        : undefined;
    return viaSmtp(
      {
        host: config.SMTP_HOST,
        port,
        secure: config.SMTP_SECURE === "true" || config.SMTP_SECURE === "1",
        // Opt-in only, and loud about it: a self-signed or expired cert on a
        // mail server otherwise fails TLS verification (correctly — that is
        // what verification is for). This exists for the gap between "a real
        // certificate is being issued" and "it is bound to the mail service",
        // not as a way to skip getting a real certificate.
        rejectUnauthorized: !(
          config.SMTP_ALLOW_SELF_SIGNED === "true" ||
          config.SMTP_ALLOW_SELF_SIGNED === "1"
        ),
        auth,
      },
      config.MAIL_FROM,
      sendImpl
    );
  }

  return refuse(
    transport
      ? `unknown MAIL_TRANSPORT "${transport}"`
      : "no mail transport is configured (set MAIL_TRANSPORT=smtp with SMTP_HOST, SMTP_PORT, and MAIL_FROM)"
  );
};

/** True when authentication email can actually reach someone. */
export const isMailDeliveryConfigured = (
  config: MailConfig = process.env
): boolean => {
  const production = config.NODE_ENV === "production";
  const transport = config.MAIL_TRANSPORT ?? (production ? "" : "console");
  if (transport === "console") {
    return !production;
  }
  return (
    transport === "smtp" &&
    Boolean(config.SMTP_HOST) &&
    Boolean(config.MAIL_FROM) &&
    parseSmtpPort(config.SMTP_PORT) !== undefined
  );
};

/** Sends an authentication email through whichever transport is configured. */
export const sendAuthEmail: MailDelivery = (message) =>
  createMailDelivery(process.env)(message);
