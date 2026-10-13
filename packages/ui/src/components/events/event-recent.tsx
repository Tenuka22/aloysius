import * as stylex from "@stylexjs/stylex";

import { RECENT_HEADING, RECENT_INTRO } from "../../content/events";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Heading, Lead, Section } from "../primitives/layout";
import { Media } from "../primitives/media";
import { Reveal } from "../primitives/reveal";

const styles = stylex.create({
  list: {
    display: "grid",
    gap: space.md,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(auto-fit, minmax(min(100%, 17rem), 1fr))",
    },
    listStyle: "none",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    minInlineSize: 0,
    /*
     * A hairline rather than a card: these are past entries, and a past entry
     * sitting in a box would read as a promotion. The rule marks the boundary
     * and nothing more.
     */
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
    paddingBlockStart: space.md,
  },
  date: {
    margin: 0,
    fontSize: font.sizeXs,
    letterSpacing: font.trackingWide,
    color: color.onSurfaceSubtle,
    fontVariantNumeric: "tabular-nums",
  },
  title: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeMd,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "pretty",
  },
  meta: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
  media: {
    marginBlockStart: space.sm,
  },
  /*
   * "3 photographs" - a count, not a label. The photographs are linked below,
   * so this is the honest summary of what is actually there.
   */
  photoCount: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  galleryLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.xs,
    margin: `${space["3xs"]} ${space["3xs"]} ${space["2xs"]}`,
    padding: 0,
    listStyle: "none",
  },
});

export interface RecentEvent {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  coverImageUrl: string | null;
  galleries: readonly { id: string; slug: string; title: string }[];
}

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * What the college has already run.
 *
 * This is the band that makes the page a diary rather than a to-do list: a
 * visitor who has been before can find the thing they came for. Every row is a
 * real published record with a real date - nothing here is a "last year" claim
 * standing in for an archive that does not exist.
 */
export const RecentEvents = ({
  events,
  heading = RECENT_HEADING,
  intro = RECENT_INTRO,
}: {
  events: readonly RecentEvent[];
  heading?: string;
  intro?: string;
}) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <Section id="recent" labelledBy="recent-title" tone="surface">
      <Container>
        <Heading id="recent-title" level={2}>
          {heading}
        </Heading>
        <Lead>{intro}</Lead>

        <Reveal direction="up">
          <ul {...stylex.props(styles.list)}>
            {events.map((event) => {
              const photoCount = event.galleries.length;

              return (
                <li key={event.id} {...stylex.props(styles.card)}>
                  <p {...stylex.props(styles.date)}>
                    <time dateTime={event.startsAt}>
                      {formatDay(event.startsAt)}
                    </time>
                  </p>
                  <h3 {...stylex.props(styles.title)}>{event.title}</h3>
                  {event.location ? (
                    <p {...stylex.props(styles.meta)}>{event.location}</p>
                  ) : null}

                  {event.galleries.length > 0 ? (
                    <>
                      <p {...stylex.props(styles.photoCount)}>
                        {photoCount}{" "}
                        {photoCount === 1 ? "gallery" : "galleries"}
                      </p>
                      <ul {...stylex.props(styles.galleryLinks)}>
                        {event.galleries.map((gallery) => (
                          <li key={gallery.id}>
                            <a href={`/galleries/${gallery.slug}`}>
                              {gallery.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {event.coverImageUrl ? (
                    <Media
                      placeholder={event.title}
                      ratio="3:2"
                      source={{ src: event.coverImageUrl, alt: "" }}
                      style={styles.media}
                      zoom
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
};
