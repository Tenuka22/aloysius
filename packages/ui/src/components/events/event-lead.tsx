import * as stylex from "@stylexjs/stylex";

import {
  NEXT_UP_DAYS_AGO,
  NEXT_UP_EYEBROW,
  NEXT_UP_SOON,
  NEXT_UP_TODAY,
  NEXT_UP_TOMORROW,
} from "../../content/events";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ArrowLink } from "../primitives/button";
import { Container } from "../primitives/layout";
import { Media } from "../primitives/media";

const styles = stylex.create({
  /*
   * A deep-green band, and the only one on the page. Everything else is cream
   * and raised - so the soonest event is separated from the rest of the diary
   * by colour rather than by a border or a card, which is the one thing a
   * single lead item can afford on a page that is otherwise one long column.
   *
   * This is a raw `<section>`, not the `Section` primitive, because `Section`
   * only paints a tone and the padding lives in the band style itself. That
   * padding is load-bearing: without it the gallery link sits flush against the
   * band edge and its underline is clipped by the boundary below.
   */
  band: {
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingBlock: space["2xl"],
    paddingInline: space.gutter,
    // Contain paint, same as `Section`, so nothing can widen the document.
    overflowX: "clip",
  },
  layout: {
    display: "grid",
    gap: space.lg,
    alignItems: "center",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "minmax(0, 1.15fr) minmax(0, 1fr)",
    },
    columnGap: space["2xl"],
  },
  body: {
    minInlineSize: 0,
  },
  eyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  /*
   * Bigger than the agenda's `2xl` titles and set on the inverse ground, so the
   * lead reads as the lead by weight of type alone. `2xl` on the rows keeps
   * the step down obvious rather than subtle.
   */
  title: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    color: color.onInverse,
    textWrap: "balance",
  },
  description: {
    margin: 0,
    marginBlockStart: space.sm,
    maxInlineSize: "52ch",
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: space["2xs"],
    rowGap: space["3xs"],
    margin: 0,
    marginBlockStart: space.lg,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onInverseSubtle,
  },
  /*
   * The countdown, as a stamped badge rather than a sentence inside the copy.
   * It answers the only question the lead has to answer - how long have I got -
   * in a shape the eye finds before it reads.
   *
   * `lining-nums` is load-bearing, not decoration: Cormorant Garamond defaults
   * to old-style figures, whose zero is a small oval sitting on the baseline
   * beside full-height numerals. Without this the badge read "1O IN DAYS".
   */
  countdown: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: space["2xs"],
    marginBlockStart: space.md,
    paddingBlock: space["3xs"],
    paddingInline: space.sm,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderInverse,
    inlineSize: "fit-content",
  },
  countdownNumber: {
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.accentOnInverse,
    fontVariantNumeric: "lining-nums tabular-nums",
  },
  countdownUnit: {
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseMuted,
  },
  media: {
    /*
     * A 4:3 landscape box, reserved whether or not a cover exists, so a cover
     * uploaded later cannot shift the band.
     */
    inlineSize: "100%",
  },
  galleryLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.md,
    margin: 0,
    marginBlockStart: space.lg,
    padding: 0,
    listStyle: "none",
  },
});

/** The countdown's wording. Spelled out here rather than in the component. */
const countdownText = (days: number): { number: string; unit: string } => {
  if (days < 0) {
    return { number: NEXT_UP_DAYS_AGO, unit: "" };
  }
  if (days === 0) {
    return { number: NEXT_UP_TODAY, unit: "" };
  }
  if (days === 1) {
    return { number: NEXT_UP_TOMORROW, unit: "" };
  }
  return { number: String(days), unit: NEXT_UP_SOON };
};

export interface LeadEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  clubName: string | null;
  coverImageUrl: string | null;
  galleries: readonly { id: string; slug: string; title: string }[];
  /**
   * Whole days from the server's "now" to the event, computed in the route.
   * Passing the number rather than recomputing it in the browser is what keeps
   * the server-rendered HTML and the hydrated tree from disagreeing about it.
   */
  daysAway: number;
}

/**
 * The soonest event, given the page's one non-cream band.
 *
 * A diary's first entry earns more than a list row: it is what the visitor came
 * for, and a reader who leaves after one viewport should be able to say what the
 * next thing at this college is. Everything on this band is a field the record
 * actually carries - no invented attendance, no invented capacity.
 */
export const NextEventLead = ({ event }: { event: LeadEvent }) => {
  const countdown = countdownText(event.daysAway);
  const meta = [
    event.location,
    event.clubName,
    // The clock time, read in UTC for the same reason the agenda reads dates
    // in UTC: a server and a browser that disagree produce a hydration
    // mismatch, and this band is the first thing on the page.
    new Date(event.startsAt).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }),
  ].filter((item): item is string => Boolean(item));

  return (
    <section aria-labelledby="next-event-title" {...stylex.props(styles.band)}>
      <Container>
        <div {...stylex.props(styles.layout)}>
          <div {...stylex.props(styles.body)}>
            <p {...stylex.props(styles.eyebrow)}>{NEXT_UP_EYEBROW}</p>
            <h2 id="next-event-title" {...stylex.props(styles.title)}>
              {event.title}
            </h2>

            <p {...stylex.props(styles.countdown)}>
              <span {...stylex.props(styles.countdownNumber)}>
                {countdown.number}
              </span>
              {countdown.unit ? (
                <span {...stylex.props(styles.countdownUnit)}>
                  {countdown.unit}
                </span>
              ) : null}
            </p>

            {event.description ? (
              <p {...stylex.props(styles.description)}>{event.description}</p>
            ) : null}

            {meta.length > 0 ? (
              <p {...stylex.props(styles.meta)}>{meta.join(" · ")}</p>
            ) : null}

            {event.galleries.length > 0 ? (
              <ul {...stylex.props(styles.galleryLinks)}>
                {event.galleries.map((gallery) => (
                  <li key={gallery.id}>
                    {/*
                      `inverse`, because the default link colour is crimson -
                      correct on cream and unreadable on the deep green this
                      band sits on.
                    */}
                    <ArrowLink href={`/galleries/${gallery.slug}`} inverse>
                      {gallery.title}
                    </ArrowLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Media
            placeholder={event.title}
            ratio="4:3"
            source={
              event.coverImageUrl
                ? { src: event.coverImageUrl, alt: "" }
                : undefined
            }
            style={styles.media}
            zoom
          />
        </div>
      </Container>
    </section>
  );
};
