import * as stylex from "@stylexjs/stylex";

import { AGENDA_EMPTY, AGENDA_HEADING } from "../../content/events";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Heading, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  /*
   * An `<ol>` because a diary is ordered, but styled as a plain stack: the order
   * is carried by the dates themselves, and numbers beside them would only
   * compete with the day for the eye.
   */
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    /*
     * The gap between the band heading and the first rule, matching the rhythm
     * every other section on the site uses (`2xl` under a section heading) so
     * the agenda reads as the same page rather than a different one.
     */
    marginBlockStart: space["2xl"],
  },
  /*
   * The diary's own track system.
   *
   * A fixed date column, a fluid body column, and a gallery column that only
   * takes width when there is something to put in it - `auto` against an empty
   * list collapses to zero rather than reserving a third of the measure for
   * photographs that do not exist.
   *
   * Below `lg` the columns become one: the date reads as a compact horizontal
   * band above the title rather than a column that would squeeze the body copy
   * to a few words per line.
   */
  row: {
    display: "grid",
    gap: space.md,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "minmax(0, 7.5rem) minmax(0, 1fr) auto",
    },
    columnGap: space.xl,
    alignItems: "start",
    /*
     * The only elevation on this page: a hairline above each entry. No card, no
     * shadow, no background - the rules are what make a continuous column read
     * as separate entries without boxing every one of them.
     */
    paddingBlockStart: space.xl,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
    /*
     * The anchor target for a link from a gallery. Keeps the entry's title clear
     * of the sticky header when a visitor arrives from
     * `/galleries/:slug#event-...` instead of reading down the page.
     */
    scrollMarginBlockStart: space["2xl"],
  },

  /* ---- the date column ---- */
  date: {
    display: "flex",
    flexDirection: {
      default: "row",
      [bp.lg]: "column",
    },
    alignItems: "baseline",
    gap: {
      default: space.sm,
      [bp.lg]: space["3xs"],
    },
    fontVariantNumeric: "tabular-nums",
  },
  /*
   * Month and year sit above the numeral: the numeral alone cannot place an
   * entry in a year, and the month is what a visitor scanning for "is that this
   * month?" actually reads.
   */
  month: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  /*
   * The largest type on the page, and deliberately so: the date is what the
   * visitor came for, and at this size the whole column can be found by shape
   * before a single word is read.
   */
  day: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
    /*
     * `lining-nums` for the same reason the lead's countdown needs it:
     * Cormorant Garamond defaults to old-style figures, where a zero is a
     * small oval - "20" reads as "2o" rather than as a date.
     */
    fontVariantNumeric: "lining-nums tabular-nums",
  },
  weekday: {
    margin: 0,
    fontSize: font.sizeXs,
    color: color.onSurfaceSubtle,
  },

  /* ---- the body column ---- */
  body: {
    minInlineSize: 0,
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "balance",
  },
  description: {
    margin: 0,
    marginBlockStart: space.xs,
    maxInlineSize: "62ch",
    fontSize: font.sizeMd,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  /*
   * Time, place and club on one line, separated by middots. `flexWrap` because
   * a long location plus a long club name must wrap rather than overflow the
   * column, and each separator rides on its own span so a wrapped line can never
   * begin with a stray mark.
   */
  meta: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: space["2xs"],
    rowGap: space["3xs"],
    margin: 0,
    marginBlockStart: space.sm,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceSubtle,
  },
  metaDivider: {
    color: color.borderStrong,
  },

  /* ---- the gallery column ---- */
  galleries: {
    display: "grid",
    gap: space.sm,
    alignContent: "start",
    gridTemplateColumns: {
      default: "repeat(auto-fill, minmax(min(100%, 7rem), 1fr))",
      [bp.lg]: "repeat(2, 8rem)",
    },
    listStyle: "none",
    margin: 0,
    padding: 0,
    /*
     * Below `lg` the row is one column, so the gallery strip reads as part of
     * the entry's flow; above it the strip sits in its own track at the right.
     */
    inlineSize: {
      default: "100%",
      [bp.lg]: "auto",
    },
  },
  galleryLink: {
    display: "grid",
    gap: space["3xs"],
    textDecoration: "none",
    color: "inherit",
    ":hover": { textDecoration: "none" },
  },
  galleryTitle: {
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    lineHeight: font.leadingNormal,
    color: color.accentOnSurface,
    textDecoration: {
      default: "none",
      ":hover": "underline",
    },
  },
  /* The strip's own label, so the thumbnails are never mistaken for the
   * event's own images - they belong to the galleries it links to. */
  galleriesLabel: {
    gridColumn: "1 / -1",
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  empty: {
    margin: 0,
    maxInlineSize: space.measure,
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
});

export interface AgendaGallery {
  id: string;
  slug: string;
  title: string;
  albumUrl: string | null;
  coverImageUrl: string | null;
}

export interface AgendaEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  /**
   * The event's own cover photograph, resolved from its `coverImageId`. This is
   * one image chosen to represent the event in a list - it is not a gallery, and
   * the galleries below carry the event's photographs.
   */
  coverImageUrl: string | null;
  /**
   * The club running the event, when it is attributed to one. Omitted for the
   * normal CMS-authored event - a name is shown only where the record carries
   * one, rather than a club invented to fill the slot.
   */
  clubName: string | null;
  galleries: readonly AgendaGallery[];
}

/**
 * Every date is formatted in `en-GB` with `timeZone: "UTC"`, pinned rather than
 * left to the runtime: the server and the visitor's browser disagree about
 * locale and zone often enough that an unpinned `toLocaleDateString` is a
 * hydration mismatch waiting to happen, and a diary that moves an event across a
 * day boundary is worse than one in the wrong format.
 */
const formatDate = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Date(value).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });

const formatMonthYear = (value: string) =>
  formatDate(value, { month: "short", year: "numeric" });

const formatDay = (value: string) => formatDate(value, { day: "numeric" });

const formatWeekday = (value: string) => formatDate(value, { weekday: "long" });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

/**
 * One diary entry.
 *
 * The galleries sit in their own track rather than under the description: an
 * event holds no images of its own - every photograph belongs to a gallery
 * somebody curated, linked through `gallery_link` - so showing them as a strip
 * beside the entry is honest about what they are.
 */
const AgendaRow = ({ event }: { event: AgendaEvent }) => {
  const metaItems = [
    formatTime(event.startsAt),
    event.endsAt ? `– ${formatTime(event.endsAt)}` : null,
    event.location,
    event.clubName,
  ].filter((item): item is string => Boolean(item));

  return (
    <li id={`event-${event.id}`} {...stylex.props(styles.row)}>
      {/*
        One `<time>` per entry carries the machine-readable value, so the
        stacked month/day/weekday reads as a single date to a screen reader
        rather than three unrelated fragments.
      */}
      <time dateTime={event.startsAt} {...stylex.props(styles.date)}>
        <span {...stylex.props(styles.month)}>
          {formatMonthYear(event.startsAt)}
        </span>
        <span {...stylex.props(styles.day)}>{formatDay(event.startsAt)}</span>
        <span {...stylex.props(styles.weekday)}>
          {formatWeekday(event.startsAt)}
        </span>
      </time>

      <div {...stylex.props(styles.body)}>
        <h3 {...stylex.props(styles.title)}>{event.title}</h3>
        {event.description ? (
          <p {...stylex.props(styles.description)}>{event.description}</p>
        ) : null}
        {metaItems.length > 0 ? (
          <p {...stylex.props(styles.meta)}>
            {metaItems.map((item, index) => (
              <span key={item}>
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    {...stylex.props(styles.metaDivider)}
                  >
                    {" · "}
                  </span>
                ) : null}
                <span>{item}</span>
              </span>
            ))}
          </p>
        ) : null}
      </div>

      {event.galleries.length > 0 ? (
        <ul {...stylex.props(styles.galleries)}>
          {/*
            An `<li>` rather than a `<p>` because a `<ul>` may only hold list
            items. It spans both tracks so the label sits above the thumbnails
            rather than inside the first cell.
          */}
          <li {...stylex.props(styles.galleriesLabel)}>Photographs</li>
          {event.galleries.map((gallery) => (
            <li key={gallery.id}>
              <a
                href={`/galleries/${gallery.slug}`}
                {...stylex.props(styles.galleryLink)}
              >
                <Media
                  placeholder={gallery.title}
                  ratio="1:1"
                  source={
                    gallery.coverImageUrl
                      ? { src: gallery.coverImageUrl, alt: "" }
                      : undefined
                  }
                  zoom
                />
                <span {...stylex.props(styles.galleryTitle)}>
                  {gallery.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
};

/**
 * The diary.
 *
 * One continuous column rather than About's alternating bands: this page has a
 * single job, and a visitor scanning for a date should meet dates and nothing
 * else until the list ends.
 *
 * The heading sits in its own full-width row and the list is offset beneath it,
 * so the heading spans the measure while the rows keep the date column on the
 * left - the heading reads as the head of the column rather than as another
 * entry that happens to have no date.
 */
export const EventAgenda = ({
  events,
  heading = AGENDA_HEADING,
}: {
  events: readonly AgendaEvent[];
  heading?: string;
}) => (
  <Section id="agenda" labelledBy="agenda-title" tone="surface">
    <Container>
      {/* No eyebrow above this heading - the masthead already introduced the page. */}
      <Heading id="agenda-title" level={2}>
        {heading}
      </Heading>

      {events.length === 0 ? (
        <p {...stylex.props(styles.empty)}>{AGENDA_EMPTY}</p>
      ) : (
        <Reveal direction="up">
          <ol {...stylex.props(styles.list)}>
            {events.map((event) => (
              <AgendaRow event={event} key={event.id} />
            ))}
          </ol>
        </Reveal>
      )}
    </Container>
  </Section>
);
