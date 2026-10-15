import * as stylex from "@stylexjs/stylex";

import {
  EVENTS_EYEBROW,
  EVENTS_HEADING,
  EVENTS_INTRO,
} from "../../content/students";
import { color, font, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
  SectionHeader,
} from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * Date-led cards on an auto-fit track: a diary entry is read by when it is
   * before anything else, so the date block leads and the title follows it in
   * the same cell. One row of hairline-ruled columns rather than a boxed card
   * grid - the events page already renders the same list as rows, and a second
   * treatment on the same data would make them look like different events.
   */
  grid: {
    display: "grid",
    listStyle: "none",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
    gap: space.lg,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))",
  },
  /*
   * The single elevation decision for these cells: a 2px gold rule, matching
   * the achievement cards. No shadow as well - a border under a soft shadow is
   * a ghost card, and this section sits on cream where a shadow reads as dirt.
   */
  entry: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    borderBlockStartWidth: "2px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.accent,
    paddingBlockStart: space.md,
  },
  /* `tabular-nums` so a column of days aligns on the digit, not on the glyph. */
  day: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
    fontVariantNumeric: "tabular-nums",
  },
  month: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  title: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "balance",
  },
  meta: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
});

export interface StudentEvent {
  id: string;
  title: string;
  startsAt: string;
  location?: string | null;
}

/*
 * Split out of `toLocaleDateString` so the day and the month can be set at
 * different sizes. Both come from one `Date`, read once per entry, and pinned
 * to `en-GB` the same way the events page pins its own formatting - an
 * unpinned locale would render the server's month names and the visitor's.
 */
const eventDate = (value: string): Date => new Date(value);

const formatDay = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "numeric", timeZone: "UTC" });

const formatMonth = (date: Date) =>
  date.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });

/**
 * The college's published diary, filtered to what is still to come by the
 * route. The section itself renders only when there is at least one entry -
 * an empty "Coming Up" heading with nothing under it is worse than its absence,
 * and the page has no invented placeholder to fall back on.
 */
export const StudentEvents = ({
  events,
}: {
  events: readonly StudentEvent[];
}) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <Section id="events" labelledBy="events-title" tone="surface">
      <Container>
        <SectionHeader>
          <Eyebrow>{EVENTS_EYEBROW}</Eyebrow>
          <Heading id="events-title" level={2}>
            {EVENTS_HEADING}
          </Heading>
        </SectionHeader>
        <Lead>{EVENTS_INTRO}</Lead>

        <Reveal direction="up">
          <ul {...stylex.props(styles.grid)}>
            {events.map((event) => {
              const date = eventDate(event.startsAt);

              return (
                <li key={event.id} {...stylex.props(styles.entry)}>
                  <p {...stylex.props(styles.day)}>{formatDay(date)}</p>
                  <p {...stylex.props(styles.month)}>{formatMonth(date)}</p>
                  <h3 {...stylex.props(styles.title)}>{event.title}</h3>
                  {/*
                    `dateTime` is the machine-readable value, so the visible
                    "12 March 2026, 09:00" is presentational only and a screen
                    reader gets the timestamp rather than the punctuation.
                  */}
                  <p {...stylex.props(styles.meta)}>
                    <time dateTime={event.startsAt}>
                      {date.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      })}
                    </time>
                    {event.location ? ` · ${event.location}` : null}
                  </p>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
};
