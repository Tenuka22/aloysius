import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

/**
 * A club's own public page - a *static* address for a *specific* club.
 *
 * The route that renders this component is hand-typed (`/photography-club`),
 * not a `$slug` parameter, because a club's page should exist the way its club
 * does: written on purpose, not reachable by guessing an address. The content,
 * though, is live approved data - the page shows the club's current galleries,
 * events, achievements and announcements without a redeploy, and it cannot
 * show anything unapproved, because the queries behind it only return approved
 * rows.
 *
 * Galleries lead, because this club's page is mostly about its photography.
 * Each gallery carries its own off-site album link where there is one: a
 * school photographer's full set rarely fits in this site's storage, and the
 * album URL is how the gallery says "there is more, over there".
 */

const MAIN_ID = "main-content";

export interface ClubPageGallery {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  albumUrl: string | null;
  albumLabel: string | null;
  coverImageUrl: string | null;
}

export interface ClubPageEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  coverImageUrl: string | null;
}

export interface ClubPageAchievement {
  id: string;
  title: string;
  detail: string | null;
  category: string | null;
  achievedOn: string | null;
  imageUrl: string | null;
}

export interface ClubPageAnnouncement {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string | null;
}

export interface ClubPageProps {
  /** The hand-typed address of this page, e.g. "/photography-club". */
  activeHref: string;
  eyebrow: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  backgroundImageUrl: string | null;
  galleries: readonly ClubPageGallery[];
  events: readonly ClubPageEvent[];
  achievements: readonly ClubPageAchievement[];
  announcements: readonly ClubPageAnnouncement[];
  extraNavItems?: readonly NavItem[];
}

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
    fontSize: font.size4xl,
    fontWeight: font.weightBold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
    textWrap: "balance",
  },
  tagline: {
    marginInline: "auto",
    marginBlockStart: space.xs,
    maxWidth: "62ch",
    fontSize: font.sizeLg,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  cover: {
    display: "block",
    marginInline: "auto",
    marginBlockStart: space.lg,
    maxWidth: "860px",
    borderRadius: "12px",
  },
  content: {
    display: "grid",
    gap: space["2xl"],
    padding: space.xl,
  },
  sectionHeading: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.size2xl,
    fontWeight: font.weightBold,
    color: color.onSurface,
  },
  empty: {
    margin: 0,
    fontSize: font.sizeMd,
    color: color.onSurfaceMuted,
  },
  list: {
    display: "grid",
    gap: space.md,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  galleryGrid: {
    display: "grid",
    gap: space.lg,
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 720px)": "repeat(2, 1fr)",
      "@media (min-width: 1080px)": "repeat(3, 1fr)",
    },
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  card: {
    display: "grid",
    gap: space["2xs"],
    alignContent: "start",
    padding: space.md,
    borderRadius: "12px",
    backgroundColor: color.surfaceRaised,
  },
  cardLink: {
    display: "grid",
    gap: space["2xs"],
    textDecoration: "none",
    color: "inherit",
  },
  cardTitle: {
    margin: 0,
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
    color: color.onSurface,
  },
  cardMeta: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
  album: {
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    color: color.accentOnSurface,
  },
  eventTitle: {
    margin: 0,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    color: color.onSurface,
  },
  body: {
    margin: 0,
    fontSize: font.sizeMd,
    lineHeight: font.leadingNormal,
    color: color.onSurface,
    textWrap: "pretty",
  },
});

export const ClubPage = ({
  activeHref,
  eyebrow,
  name,
  description,
  coverImageUrl,
  backgroundImageUrl,
  galleries,
  events,
  achievements,
  announcements,
  extraNavItems,
}: ClubPageProps) => (
  <>
    <SiteHeader activeHref={activeHref} extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <header {...stylex.props(styles.header)}>
        <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>
        <h1 {...stylex.props(styles.heading)}>{name}</h1>
        {description ? (
          <p {...stylex.props(styles.tagline)}>{description}</p>
        ) : null}
        {coverImageUrl ? (
          <Media
            placeholder={name}
            ratio="16:9"
            source={{ src: coverImageUrl, alt: `${name} cover photograph` }}
          />
        ) : null}
        {/*
         * The background image is decoration, so it gets empty alt text and
         * is skipped entirely when absent rather than rendering a placeholder.
         */}
        {backgroundImageUrl ? (
          <Media
            placeholder=""
            ratio="16:9"
            source={{ src: backgroundImageUrl, alt: "" }}
          />
        ) : null}
      </header>

      <div {...stylex.props(styles.content)}>
        <section aria-labelledby="club-galleries-title">
          <h2
            id="club-galleries-title"
            {...stylex.props(styles.sectionHeading)}
          >
            Galleries
          </h2>
          {galleries.length === 0 ? (
            <p {...stylex.props(styles.empty)}>
              No photograph galleries have been published yet.
            </p>
          ) : (
            <ul {...stylex.props(styles.galleryGrid)}>
              {galleries.map((gallery) => (
                <li key={gallery.id} {...stylex.props(styles.card)}>
                  <a
                    href={`/galleries/${gallery.slug}`}
                    {...stylex.props(styles.cardLink)}
                  >
                    {gallery.coverImageUrl ? (
                      <Media
                        placeholder={gallery.title}
                        ratio="4:3"
                        source={{
                          src: gallery.coverImageUrl,
                          alt: `${gallery.title} cover photograph`,
                        }}
                      />
                    ) : null}
                    <h3 {...stylex.props(styles.cardTitle)}>{gallery.title}</h3>
                    {gallery.summary ? (
                      <p {...stylex.props(styles.cardMeta)}>
                        {gallery.summary}
                      </p>
                    ) : null}
                    <span {...stylex.props(styles.album)}>
                      View the gallery
                    </span>
                  </a>
                  {gallery.albumUrl ? (
                    <a
                      href={gallery.albumUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                      {...stylex.props(styles.cardLink)}
                    >
                      <span {...stylex.props(styles.album)}>
                        {gallery.albumLabel || "See the full album"} (hosted
                        off-site)
                      </span>
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="club-events-title">
          <h2 id="club-events-title" {...stylex.props(styles.sectionHeading)}>
            Events
          </h2>
          {events.length === 0 ? (
            <p {...stylex.props(styles.empty)}>No events published yet.</p>
          ) : (
            <ul {...stylex.props(styles.list)}>
              {events.map((event) => (
                <li
                  id={`event-${event.id}`}
                  key={event.id}
                  {...stylex.props(styles.card)}
                >
                  <h3 {...stylex.props(styles.eventTitle)}>{event.title}</h3>
                  <p {...stylex.props(styles.cardMeta)}>
                    <time dateTime={event.startsAt}>
                      {formatDay(event.startsAt)}
                    </time>
                    {event.location ? ` · ${event.location}` : null}
                  </p>
                  {event.description ? (
                    <p {...stylex.props(styles.body)}>{event.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {announcements.length > 0 ? (
          <section aria-labelledby="club-announcements-title">
            <h2
              id="club-announcements-title"
              {...stylex.props(styles.sectionHeading)}
            >
              Announcements
            </h2>
            <ul {...stylex.props(styles.list)}>
              {announcements.map((announcement) => (
                <li
                  id={`announcement-${announcement.id}`}
                  key={announcement.id}
                  {...stylex.props(styles.card)}
                >
                  <h3 {...stylex.props(styles.cardTitle)}>
                    {announcement.title}
                  </h3>
                  <p {...stylex.props(styles.body)}>{announcement.body}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {achievements.length > 0 ? (
          <section aria-labelledby="club-achievements-title">
            <h2
              id="club-achievements-title"
              {...stylex.props(styles.sectionHeading)}
            >
              Achievements
            </h2>
            <ul {...stylex.props(styles.list)}>
              {achievements.map((achievement) => (
                <li
                  id={`achievement-${achievement.id}`}
                  key={achievement.id}
                  {...stylex.props(styles.card)}
                >
                  <h3 {...stylex.props(styles.cardTitle)}>
                    {achievement.title}
                  </h3>
                  <p {...stylex.props(styles.cardMeta)}>
                    {[achievement.category, achievement.achievedOn]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {achievement.detail ? (
                    <p {...stylex.props(styles.body)}>{achievement.detail}</p>
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
