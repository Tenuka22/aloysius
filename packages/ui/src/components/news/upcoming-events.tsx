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
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { VisuallyHidden } from "../primitives/layout";

/*
 * Measurements are the approved design's (News.dc.html): 110px section
 * padding, a 120px date badge, 19px bold titles and an outlined "Details"
 * button. Below 48rem the row stacks - badge and copy side by side, the action
 * on its own line - because a 120px column plus a 40px gap leaves a phone
 * about 80px for the title.
 */
const styles = stylex.create({
  section: {
    paddingBlock: "clamp(56px, 9vw, 110px)",
  },
  header: {
    marginBlockEnd: "clamp(36px, 5vw, 56px)",
  },
  heading: {
    fontSize: "clamp(34px, 4.2vw, 50px)",
    lineHeight: 1.1,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  row: {
    display: "grid",
    gap: {
      default: "20px",
      [bp.lg]: "40px",
    },
    gridTemplateColumns: {
      default: "auto minmax(0, 1fr)",
      [bp.lg]: "120px minmax(0, 1fr) auto",
    },
    alignItems: "center",
    paddingBlock: "30px",
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(255, 248, 231, 0.12)",
  },
  badge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minInlineSize: "72px",
    paddingBlock: "14px",
    paddingInline: "10px",
    textAlign: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255, 178, 3, 0.4)",
  },
  badgeDay: {
    fontFamily: font.display,
    fontSize: "34px",
    fontWeight: 600,
    color: "#FFB203",
    lineHeight: 1,
  },
  badgeMonth: {
    marginBlockStart: "6px",
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "rgba(255, 248, 231, 0.6)",
    textTransform: "uppercase",
  },
  copy: {
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontWeight: 700,
    fontSize: "19px",
    textWrap: "pretty",
  },
  detail: {
    margin: 0,
    marginBlockStart: "6px",
    fontSize: "13px",
    color: "rgba(255, 248, 231, 0.6)",
  },
  action: {
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
    paddingBlock: "11px",
    paddingInline: "22px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      default: "rgba(255, 248, 231, 0.4)",
      ":hover": "#FFB203",
    },
    color: {
      default: "#FFF8E7",
      ":hover": "#FFB203",
    },
    fontSize: "12.5px",
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  empty: {
    borderWidth: "1px",
    borderStyle: "dashed",
    borderColor: "rgba(255, 248, 231, 0.2)",
    paddingBlock: "64px",
    paddingInline: "24px",
    textAlign: "center",
  },
  emptyHeading: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "28px",
    lineHeight: 1.2,
  },
  emptyBody: {
    margin: 0,
    marginBlockStart: "12px",
    marginInline: "auto",
    maxWidth: "48ch",
    fontSize: "15px",
    lineHeight: 1.7,
    color: "rgba(255, 248, 231, 0.75)",
    textWrap: "pretty",
  },
});

/**
 * The college calendar strip.
 *
 * Every row is driven by a real ISO date - an event whose date will not parse
 * is dropped rather than rendered as "NaN".
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
    <DcSection
      id="events"
      labelledBy="events-title"
      style={styles.section}
      tone="green"
    >
      <DcInner>
        <div {...stylex.props(styles.header)}>
          <DcEyebrow gold>{EVENTS_EYEBROW}</DcEyebrow>
          <DcHeading id="events-title" style={styles.heading}>
            {EVENTS_HEADING}
          </DcHeading>
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
      </DcInner>
    </DcSection>
  );
};
