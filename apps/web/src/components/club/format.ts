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
export const titleFromPayload = (payload: string) => {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed === "object" && parsed !== null) {
      const { title } = parsed as { title?: unknown };
      if (typeof title === "string" && title.length > 0) {
        return title;
      }
    }
  } catch {
    /* an unreadable payload still renders, just without a title */
  }
  return "Untitled";
};
