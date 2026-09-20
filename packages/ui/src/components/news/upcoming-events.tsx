import * as stylex from "@stylexjs/stylex";

import {
  COLLEGE_EVENTS,
  EVENTS_EMPTY_BODY,
  EVENTS_EMPTY_HEADING,
  EVENTS_EYEBROW,
  EVENTS_HEADING,
  formatEventDate,
} from "../../content/news";
import type { CollegeEvent } from "../../content/news";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Section,
  VisuallyHidden,
} from "../primitives/layout";

const styles = stylex.create({
  list: {
    display: "flex",
    flexDirection: "column",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  /*
   * The mock is a hard `120px 1fr auto` three-column row with a 40px gap - at
   * 320px that leaves ~80px for the title. Below 48rem the row becomes a
   * stack: badge and copy side by side, the action on its own line beneath.
   */
  row: {
    display: "grid",
    gap: {
      default: space.md,
      [bp.lg]: space.xl,
    },
    gridTemplateColumns: {
      default: "auto minmax(0, 1fr)",
      [bp.lg]: "7.5rem minmax(0, 1fr) auto",
    },
    alignItems: "center",
    paddingBlock: space.lg,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderInverse,
  },
  badge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minInlineSize: "4.5rem",
    paddingBlock: space.xs,
    paddingInline: space["2xs"],
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
  },
  badgeDay: {
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.accentOnInverse,
  },
  badgeMonth: {
    marginBlockStart: space["3xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseSubtle,
  },
  copy: {
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    textWrap: "pretty",
  },
  detail: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onInverseSubtle,
  },
  action: {
    // Full width under the copy on a phone, intrinsic in its own column from
    // 48rem - the mock's `justify-content:space-between` strands it against
    // the right edge the moment the row wraps.
    gridColumn: {
      default: "1 / -1",
      [bp.lg]: "auto",
    },
    justifySelf: {
      default: "stretch",
      [bp.lg]: "end",
    },
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minBlockSize: "2.75rem",
    paddingBlock: space.xs,
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderInverse,
      ":hover": color.accent,
    },
    backgroundColor: {
      default: "transparent",
      ":hover": color.accent,
    },
    color: {
      default: color.onInverse,
      ":hover": color.onAccent,
    },
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
  },

  empty: {
    borderWidth: space.px,
    borderStyle: "dashed",
    borderColor: color.borderInverse,
    paddingBlock: space["2xl"],
    paddingInline: space.lg,
    textAlign: "center",
  },
  emptyHeading: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.sizeXl,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
  },
  emptyBody: {
    margin: 0,
    marginBlockStart: space.xs,
    marginInline: "auto",
    maxWidth: "48ch",
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
  header: {
    marginBlockEnd: space.xl,
  },
});

/**
 * The college calendar strip.
 *
 * Every row is driven by a real ISO date - the mock's `[dd]`/`[MON]` badge
 * placeholders cannot ship, and an event whose date will not parse is dropped
 * rather than rendered as "NaN".
 */
export const UpcomingEvents = ({
  events = COLLEGE_EVENTS,
}: {
  events?: readonly CollegeEvent[];
}) => {
  const dated = events
    .map((event) => ({ event, formatted: formatEventDate(event.date) }))
    .filter(
      (
        entry
      ): entry is {
        event: CollegeEvent;
        formatted: NonNullable<ReturnType<typeof formatEventDate>>;
      } => entry.formatted !== null
    );

  return (
    <Section id="events" labelledBy="events-title" tone="inverse">
      <Container>
        <div {...stylex.props(styles.header)}>
          <Eyebrow inverse>{EVENTS_EYEBROW}</Eyebrow>
          <Heading id="events-title" level={2}>
            {EVENTS_HEADING}
          </Heading>
        </div>

        {dated.length > 0 ? (
          <ul {...stylex.props(styles.list)}>
            {dated.map(({ event, formatted }) => (
              <li key={event.id} {...stylex.props(styles.row)}>
                {/* `<time>` carries the machine-readable date; the badge's
                    split day/month is decoration over it. */}
                <time dateTime={event.date} {...stylex.props(styles.badge)}>
                  <span aria-hidden="true" {...stylex.props(styles.badgeDay)}>
                    {formatted.day}
                  </span>
                  <span aria-hidden="true" {...stylex.props(styles.badgeMonth)}>
                    {formatted.month}
                  </span>
                  <VisuallyHidden>{formatted.label}</VisuallyHidden>
                </time>

                <div {...stylex.props(styles.copy)}>
                  <h3 {...stylex.props(styles.title)}>{event.title}</h3>
                  {event.venue || event.time ? (
                    <p {...stylex.props(styles.detail)}>
                      {[event.venue, event.time].filter(Boolean).join(" • ")}
                    </p>
                  ) : null}
                </div>

                {/* No `href="#"`: the action appears only once the event has a
                    real page to link to. */}
                {event.href ? (
                  <a href={event.href} {...stylex.props(styles.action)}>
                    Details
                    <VisuallyHidden>: {event.title}</VisuallyHidden>
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div {...stylex.props(styles.empty)}>
            <p {...stylex.props(styles.emptyHeading)}>{EVENTS_EMPTY_HEADING}</p>
            <p {...stylex.props(styles.emptyBody)}>{EVENTS_EMPTY_BODY}</p>
          </div>
        )}
      </Container>
    </Section>
  );
};
