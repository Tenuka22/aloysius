import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

/**
 * The events page: what is coming up, and what a club has already run.
 *
 * This is the page that makes a club's events real. A club could propose an
 * event, a reviewer could approve it, and until this existed the record had
 * nowhere to appear - `listClubEvents` had no caller at all, so an approved club
 * event was a row in a database and nothing else.
 *
 * ## Why an event holds no images of its own
 *
 * An event has exactly one image: its cover. Everything else about it -
 * the photographs, the video, the scans - is a gallery that somebody curates,
 * attached through `gallery_link`. That is the whole reason this page can be
 * written without an event-to-image relationship existing: the images arrive
 * with the galleries, already shaped, already captioned, already carrying their
 * own alt text.
 *
 * The consequence worth stating for whoever edits this next: an event page is
 * only as good as the links somebody made. A club event with no linked gallery
 * is a title and a date, and that is a legitimate thing to publish - the
 * inter-house cross-country run does not need a gallery to have happened.
 */

const MAIN_ID = "main-content";

/** A stable reference, so the default prop is not a new array on every render. */
const NO_ACHIEVEMENTS: readonly EventPageAchievement[] = [];

export interface EventPageGallery {
  id: string;
  slug: string;
  title: string;
  albumUrl: string | null;
  albumLabel: string | null;
  coverImageUrl: string | null;
}

export interface EventPageEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  clubName: string | null;
  clubSlug: string | null;
  coverImageUrl: string | null;
  galleries: readonly EventPageGallery[];
}

export interface EventPageAchievement {
  id: string;
  title: string;
  detail: string | null;
  category: string | null;
  achievedOn: string | null;
  clubName: string | null;
  clubSlug: string | null;
}

export interface EventsPageProps {
  events: readonly EventPageEvent[];
  achievements?: readonly EventPageAchievement[];
  extraNavItems?: readonly NavItem[];
}

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  header: {
    paddingBlockStart: space["3xl"],
    paddingBlockEnd: space.xl,
    paddingInline: space.md,
    backgroundColor: color.surface,
    textAlign: "center",
  },
  eyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  heading: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontSize: font.size4xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
  tagline: {
    margin: 0,
    marginBlockStart: space.sm,
    maxWidth: space.measure,
    marginInline: "auto",
    fontSize: font.sizeLg,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  content: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    maxWidth: space.measure,
    marginInline: "auto",
    display: "grid",
    gap: space.xl,
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "grid",
    gap: space.xl,
  },
  event: {
    display: "grid",
    gap: space["2xs"],
    /*
     * The anchor target for a link from a gallery. `scroll-margin-top` keeps the
     * heading clear of the sticky site header when someone arrives from
     * `/galleries/:slug#event-…` rather than reading down the page.
     */
    scrollMarginBlockStart: space["3xl"],
  },
  eventClub: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  eventTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "balance",
  },
  eventMeta: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
  eventDescription: {
    margin: 0,
    maxWidth: "62ch",
    fontSize: font.sizeMd,
    lineHeight: font.leadingNormal,
    color: color.onSurface,
    textWrap: "pretty",
  },
  galleriesHeading: {
    marginBlockStart: space.sm,
    marginBlockEnd: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceMuted,
  },
  galleries: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "grid",
    gap: space.md,
    gridTemplateColumns: {
      default: "1fr",
      [bp.md]: "repeat(auto-fill, minmax(14rem, 1fr))",
    },
  },
  galleryLink: {
    display: "grid",
    gap: space["3xs"],
    textDecoration: "none",
    color: color.onSurface,
    ":hover": { textDecoration: "none" },
    ":focus-visible": { outlineOffset: space["3xs"] },
  },
  galleryTitle: {
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    color: color.accentOnSurface,
    textDecoration: "underline",
  },
  album: {
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  sectionHeading: {
    margin: 0,
    marginBlockEnd: space.md,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
  },
  achievements: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "grid",
    gap: space.md,
  },
  achievement: {
    display: "grid",
    gap: space["3xs"],
    paddingBlockStart: space.md,
    borderTopWidth: space.px,
    borderTopStyle: "solid",
    borderTopColor: color.border,
    scrollMarginBlockStart: space["3xl"],
  },
  achievementTitle: {
    margin: 0,
    fontSize: font.sizeMd,
    fontWeight: font.weightBold,
    color: color.onSurface,
  },
  achievementMeta: {
    margin: 0,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  empty: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
});

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const EventsPage = ({
  events,
  achievements = NO_ACHIEVEMENTS,
  extraNavItems,
}: EventsPageProps) => (
  <>
    <SiteHeader activeHref="/events" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <header {...stylex.props(styles.header)}>
        <p {...stylex.props(styles.eyebrow)}>Life at the College</p>
        <h1 {...stylex.props(styles.heading)}>Events</h1>
        <p {...stylex.props(styles.tagline)}>
          Assemblies, competitions, expeditions and the events our clubs run.
          Photographs of each are published as galleries.
        </p>
      </header>

      <div {...stylex.props(styles.content)}>
        <section aria-labelledby="events-title">
          <h2 id="events-title" {...stylex.props(styles.sectionHeading)}>
            What is coming up
          </h2>

          {events.length === 0 ? (
            <p {...stylex.props(styles.empty)}>
              Nothing is scheduled at the moment. Check back closer to the
              season.
            </p>
          ) : (
            <ul {...stylex.props(styles.list)}>
              {events.map((event) => (
                <li
                  id={`event-${event.id}`}
                  key={event.id}
                  {...stylex.props(styles.event)}
                >
                  {event.clubName ? (
                    <p {...stylex.props(styles.eventClub)}>{event.clubName}</p>
                  ) : null}
                  <h3 {...stylex.props(styles.eventTitle)}>{event.title}</h3>
                  <p {...stylex.props(styles.eventMeta)}>
                    <time dateTime={event.startsAt}>
                      {formatDay(event.startsAt)}
                    </time>
                    {event.endsAt ? ` – ${formatTime(event.endsAt)}` : null}
                    {event.location ? ` · ${event.location}` : null}
                  </p>
                  {event.description ? (
                    <p {...stylex.props(styles.eventDescription)}>
                      {event.description}
                    </p>
                  ) : null}

                  {/*
                   * The event's only images are in its galleries. A cover image
                   * is deliberately not rendered here: it is one image chosen to
                   * represent the event in a list, and showing it above the
                   * galleries would suggest there were more images on the event
                   * itself when there are none.
                   */}
                  {event.galleries.length > 0 ? (
                    <>
                      <p {...stylex.props(styles.galleriesHeading)}>
                        Photographs
                      </p>
                      <ul {...stylex.props(styles.galleries)}>
                        {event.galleries.map((gallery) => (
                          <li key={gallery.id}>
                            <a
                              href={`/galleries/${gallery.slug}`}
                              {...stylex.props(styles.galleryLink)}
                            >
                              <Media
                                placeholder={gallery.title}
                                ratio="3:2"
                                source={
                                  gallery.coverImageUrl
                                    ? {
                                        src: gallery.coverImageUrl,
                                        alt: "",
                                      }
                                    : undefined
                                }
                              />
                              <span {...stylex.props(styles.galleryTitle)}>
                                {gallery.title}
                              </span>
                              {gallery.albumUrl ? (
                                <span {...stylex.props(styles.album)}>
                                  {gallery.albumLabel || "See the full album"}{" "}
                                  (hosted off-site)
                                </span>
                              ) : null}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {achievements.length > 0 ? (
          <section aria-labelledby="achievements-title">
            <h2
              id="achievements-title"
              {...stylex.props(styles.sectionHeading)}
            >
              What our clubs have achieved
            </h2>
            <ul {...stylex.props(styles.achievements)}>
              {achievements.map((achievement) => (
                <li
                  id={`achievement-${achievement.id}`}
                  key={achievement.id}
                  {...stylex.props(styles.achievement)}
                >
                  <p {...stylex.props(styles.achievementTitle)}>
                    {achievement.title}
                  </p>
                  <p {...stylex.props(styles.achievementMeta)}>
                    {[
                      achievement.clubName,
                      achievement.category,
                      achievement.achievedOn,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {achievement.detail ? (
                    <p {...stylex.props(styles.eventDescription)}>
                      {achievement.detail}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
    <SiteFooter />
  </>
);
