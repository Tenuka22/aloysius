/**
 * Best-effort title out of a stored JSON payload, for a queue row.
 *
 * The submission table stores its payload as a JSON string, and the searchable
 * text of a row - the title a reviewer scans for - lives inside that string.
 * This is the server-side read of the same field the review card renders; it is
 * duplicated rather than shared with the web app because the web copy renders
 * and this one filters, and a render that cannot parse must still show the row
 * while a filter that cannot parse must not drop it.
 *
 * Returns `""` rather than a label: the caller decides what an untitled row is
 * called, and a search for a term the title does not contain must not match a
 * placeholder this function invented.
 */
export const titleFromPayload = (payload: string): string => {
  try {
    const parsed: unknown = JSON.parse(payload);
    if (typeof parsed === "object" && parsed !== null) {
      const { title } = parsed as { title?: unknown };
      if (typeof title === "string") {
        return title;
      }
    }
  } catch {
    /* an unreadable payload is still a row; it just has no searchable title */
  }
  return "";
};
