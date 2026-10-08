/**
 * A URL segment from a title.
 *
 * Every "propose something" form in the club portal has a slug field the club
 * never sees, so it is derived here rather than asked for. Shared because three
 * screens need it and a slug rule that drifts between them produces two
 * galleries with the same title at different addresses.
 *
 * Falls back to `gallery` for a title with no letters or digits in it. That is
 * deliberate: the alternative is a form that refuses to submit because somebody
 * typed a title in Sinhala or Tamil, which is a much worse outcome than an
 * unremarkable address.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[0-9a-z]+)*$/u;

export const slugify = (title: string) =>
  title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "")
    .slice(0, 60);

/** A title turned into a "New <thing>" label, for a submission queue row. */
export const describeTarget = (target: string) =>
  target
    .replaceAll(/(?<lower>[a-z])(?<upper>[A-Z])/gu, "$<lower> $<upper>")
    .replaceAll("_", " ")
    .toLowerCase();

/** Tone for the operation pill on a queue row or a review card. */
export const operationTone = (operation: string) => {
  if (operation === "create") {
    return "warning" as const;
  }
  if (operation === "delete") {
    return "danger" as const;
  }
  return "neutral" as const;
};

/** How long ago a submission or audit entry was made, in reviewer-facing words. */
export const relativeDay = (value: Date) => {
  const days = Math.round(
    (Date.now() - new Date(value).getTime()) / 86_400_000
  );
  if (days <= 0) {
    return "today";
  }
  if (days === 1) {
    return "yesterday";
  }
  return `${days} days ago`;
};

/** How a submission operation reads in a sentence. */
export const describeOperation = (operation: string) => {
  if (operation === "create") {
    return "a new record";
  }
  if (operation === "delete") {
    return "a removal";
  }
  return "an edit";
};

/** Best-effort title out of a stored JSON payload, for a queue row. */
export const titleFromPayload = (payload: string, target?: string) => {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      const { title } = record;
      if (typeof title === "string" && title.length > 0) {
        return title;
      }
      const { name } = record;
      if (typeof name === "string" && name.length > 0) {
        return name;
      }
      /*
       * `galleryItem`, `galleryLink` and a `club` profile update have no name
       * field of their own - see the server-side twin of this function in
       * `packages/api/src/routers/list-format.ts` for why that is three
       * targets, not zero. A gallery item's title is the job it does.
       */
      if (target === "galleryItem") {
        const role = record.imageRole;
        if (role === "cover") {
          return "Cover photo";
        }
        if (role === "banner") {
          return "Banner photo";
        }
        const { altText } = record;
        if (typeof altText === "string" && altText.length > 0) {
          return altText;
        }
      }
      if (target === "galleryLink") {
        const linkTarget = record.target;
        if (typeof linkTarget === "string") {
          return `Link to ${describeTarget(linkTarget)}`;
        }
      }
      if (target === "club") {
        return "Club profile";
      }
    }
  } catch {
    /* an unreadable payload still renders, just without a title */
  }
  return "Untitled";
};

/** Tone for the status pill on a row that may now be decided, not just pending. */
export const statusTone = (status: string) => {
  if (status === "approved") {
    return "positive" as const;
  }
  if (status === "rejected") {
    return "danger" as const;
  }
  return "warning" as const;
};

/*
 * A fixed locale, deliberately. `toLocaleString()` with no locale renders the
 * server's format during SSR and the browser's on hydration, and a timestamp
 * that changes shape between the two is a hydration mismatch - the same bargain
 * `admin/audit.tsx` makes for its own timestamps.
 */
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** A date and time, in the one fixed shape every club screen shows one in. */
export const formatDateTime = (value: Date | string) =>
  DATE_TIME.format(new Date(value));

/**
 * `datetime-local` reads and writes `YYYY-MM-DDTHH:mm` in the browser's own
 * timezone; this is the one conversion every edit form that prefills one needs.
 */
export const toDatetimeLocalValue = (value: Date | string) => {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export type EventStatus = "live" | "pending" | "archived";

/**
 * Whether a club event is still in review, live and current, or over.
 *
 * Unlike a gallery, a club event has no status column of its own - only
 * `publishedAt`, set once a CMS editor approves the submission that created or
 * last changed it. "Archived" is derived, not stored: the public events strip
 * (`routes/events.tsx`) filters out anything whose end has passed, so a
 * published event past its end is functionally retired even though nothing in
 * the database says so.
 */
export const eventStatus = (event: {
  publishedAt: Date | string | null;
  startsAt: Date | string;
  endsAt: Date | string | null;
}): EventStatus => {
  if (!event.publishedAt) {
    return "pending";
  }
  const end = new Date(event.endsAt ?? event.startsAt).getTime();
  return end < Date.now() ? "archived" : "live";
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  archived: "Archived",
  live: "Live",
  pending: "Pending",
};

export const EVENT_STATUS_TONE: Record<
  EventStatus,
  "positive" | "neutral" | "warning"
> = {
  archived: "neutral",
  live: "positive",
  pending: "warning",
};

/**
 * Whether a live club announcement is actually visible to a site visitor right
 * now, derived the same way `withinWindow` decides it server-side in
 * `clubs/public.ts`: the row is "live" once its optional `effectiveFrom` has
 * passed and until its optional `expiresAt` arrives, "scheduled" before that
 * window opens, and "expired" after it closes. A row with neither bound is
 * always live.
 */
export type ClubAnnouncementStatus = "live" | "scheduled" | "expired";

export const clubAnnouncementStatus = (row: {
  effectiveFrom: Date | string | null;
  expiresAt: Date | string | null;
}): ClubAnnouncementStatus => {
  const now = Date.now();
  if (row.expiresAt && new Date(row.expiresAt).getTime() < now) {
    return "expired";
  }
  if (row.effectiveFrom && new Date(row.effectiveFrom).getTime() > now) {
    return "scheduled";
  }
  return "live";
};

export const CLUB_ANNOUNCEMENT_STATUS_LABEL: Record<
  ClubAnnouncementStatus,
  string
> = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Expired",
};

export const CLUB_ANNOUNCEMENT_STATUS_TONE: Record<
  ClubAnnouncementStatus,
  "positive" | "warning" | "neutral"
> = {
  live: "positive",
  scheduled: "warning",
  expired: "neutral",
};
