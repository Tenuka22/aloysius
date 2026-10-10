import * as stylex from "@stylexjs/stylex";

import type { Achievement, GalleryItem, NavItem } from "../../content/home";
import type { Club } from "../../content/students";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Achievements } from "../home/achievements";
import { Gallery } from "../home/gallery";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { ClubsSocieties } from "../students/clubs-societies";

const MAIN_ID = "main-content";
const NO_ACHIEVEMENTS: readonly Achievement[] = [];
const NO_EVENTS: readonly StudentEvent[] = [];

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  hero: {
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
  heroMedia: {
    marginBlockStart: space.lg,
  },
  content: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    maxWidth: space.measure,
    marginInline: "auto",
  },
});

export interface StudentsPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  extraNavItems?: readonly NavItem[];
  achievements?: readonly Achievement[];
  galleryItems?: readonly GalleryItem[];
  events?: readonly StudentEvent[];
  clubs?: readonly Club[];
}

export interface StudentEvent {
  id: string;
  title: string;
  startsAt: string;
  location?: string | null;
}

/*
 * No body section and no `activitiesHeading` prop. Both existed only to hold
 * the "content will be displayed here once published" placeholder -
 * `ClubsSocieties` has always rendered its own heading from `CLUBS_HEADING` (see
 * components/students/clubs-societies.tsx), so the prop labelled nothing.
 */
export const StudentsPage = ({
  eyebrow,
  heading = "Student Life",
  tagline,
  heroImage,
  extraNavItems,
  achievements = NO_ACHIEVEMENTS,
  galleryItems,
  events = NO_EVENTS,
  clubs,
}: StudentsPageProps) => (
  <>
    <SiteHeader activeHref="/students" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.hero)}>
        {eyebrow && <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>}
        <h1 {...stylex.props(styles.heading)}>{heading}</h1>
        {tagline && <p {...stylex.props(styles.tagline)}>{tagline}</p>}
        {heroImage && (
          <Media
            placeholder=""
            ratio="16:9"
            source={heroImage}
            style={styles.heroMedia}
          />
        )}
      </section>
      {/*
       * No body section of its own. The page used to render "Student life
       * content will be displayed here once published" here, but the clubs,
       * sports and houses below are always populated from content/students.ts -
       * this section only ever existed to hold the placeholder.
       */}
      {events.length > 0 && (
        <section
          {...stylex.props(styles.content)}
          aria-labelledby="student-events-title"
        >
          <h2 id="student-events-title" {...stylex.props(styles.heading)}>
            Upcoming events
          </h2>
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.title}</strong> —{" "}
                {new Date(event.startsAt).toLocaleDateString()}
                {event.location ? ` · ${event.location}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
      {clubs && clubs.length > 0 && <ClubsSocieties clubs={clubs} />}
      {achievements.length > 0 && <Achievements achievements={achievements} />}
      {galleryItems && galleryItems.length > 0 && (
        <Gallery items={galleryItems} />
      )}
    </main>
    <SiteFooter />
  </>
);
