import * as stylex from "@stylexjs/stylex";

import type { Achievement, GalleryItem, NavItem } from "../../content/home";
import type { Club, House, SportTile } from "../../content/students";
import { HOUSES } from "../../content/students";
import { Achievements } from "../home/achievements";
import { Gallery } from "../home/gallery";
import { SkipLink } from "../primitives/layout";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { ClubsSocieties } from "./clubs-societies";
import { HouseSystem } from "./house-system";
import { PrefectsCta } from "./prefects-cta";
import { SportsGrid } from "./sports-grid";
import type { SportImages } from "./sports-grid";
import { StudentEvents } from "./student-events";
import type { StudentEvent } from "./student-events";
import { StudentsHero } from "./students-hero";

export type { StudentEvent } from "./student-events";

const MAIN_ID = "main-content";

const NO_ACHIEVEMENTS: readonly Achievement[] = [];

const styles = stylex.create({
  /*
   * `tabIndex={-1}` on <main> is what lets the skip link move focus here, but
   * it also makes the whole region focusable, so the global focus ring would
   * draw a 3px outline around the entire page. Suppressed on `:focus` only.
   */
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
});

export interface StudentsPageProps {
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
  /**
   * CMS hero copy. Everything below this point is CMS-resolved too - see
   * `content/cms.ts`'s `STUDENTS_BLOCKS`, which seeds each of these from the
   * same constants the components default to, so an unpublished field and an
   * untouched one render identically.
   */
  heading?: string;
  tagline?: string;
  /**
   * The CMS-published sport tiles, in display order, replacing `SPORT_TILES` -
   * see `apps/web/src/routes/students.tsx` for how its position derives each
   * tile's mosaic span.
   */
  tiles?: readonly SportTile[];
  /** Sports photographs keyed by tile id, once the CMS supplies them. */
  sportImages?: SportImages;
  sportsEyebrow?: string;
  sportsHeading?: string;
  /** Empty means "drop the overflow panel", not "show the default list". */
  moreSports?: readonly string[];
  prefectsHeading?: string;
  prefectsBody?: string;
  prefectsImage?: ImageSource;
  clubs?: readonly Club[];
  activitiesEyebrow?: string;
  activitiesHeading?: string;
  activitiesIntro?: string;
  housesEyebrow?: string;
  housesHeading?: string;
  housesIntro?: string;
  /** Published house names keyed by `House.id`; absent for an unnamed house. */
  houseNames?: Readonly<Record<string, string>>;
  /** Upcoming, still-to-come entries from the CMS `events` collection. */
  events?: readonly StudentEvent[];
  achievements?: readonly Achievement[];
  galleryItems?: readonly GalleryItem[];
}

/**
 * House names arrive from the CMS as a bare id-to-name map, because four
 * optional CMS fields have no shape a validator would accept. They are folded
 * onto the roster here, and a name for a house id the page does not render is
 * dropped rather than carried into an unused card.
 */
const withPublishedNames = (
  houses: readonly House[],
  names: Readonly<Record<string, string>> | undefined
): readonly House[] => {
  if (!names) {
    return houses;
  }
  let changed = false;
  const merged = houses.map((house) => {
    const name = names[house.id];
    if (!name || name === house.name) {
      return house;
    }
    changed = true;
    return { ...house, name };
  });
  return changed ? merged : houses;
};

/*
 * Section order is the page's primary reading path, and the tones are the
 * rhythm down it. No two neighbouring bands share a tone, so the eye is carried
 * from cream to green and back instead of sliding through one long field:
 *
 *   hero inverse -> sports surface -> clubs inverseGradient -> houses raised
 *   -> events surface -> achievements inverse -> gallery surface -> prefects inverse
 *
 * Sports leads the content because it is the largest photographic statement the
 * page owns; clubs, houses and the prefects CTA are the four jump-linked stops
 * the hero advertises. Events, achievements and gallery are CMS-supplied
 * supporting evidence and render only when there is something in them, so an
 * unpublished page keeps the same cadence with three bands missing rather than
 * three empty headings.
 */
export const StudentsPage = ({
  contact,
  extraNavItems,
  heading,
  tagline,
  tiles,
  sportImages,
  sportsEyebrow,
  sportsHeading,
  moreSports,
  prefectsHeading,
  prefectsBody,
  prefectsImage,
  clubs,
  activitiesEyebrow,
  activitiesHeading,
  activitiesIntro,
  housesEyebrow,
  housesHeading,
  housesIntro,
  houseNames,
  events,
  achievements = NO_ACHIEVEMENTS,
  galleryItems,
}: StudentsPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/students" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <StudentsHero intro={tagline} title={heading} />
      <SportsGrid
        eyebrow={sportsEyebrow}
        heading={sportsHeading}
        images={sportImages}
        moreSports={moreSports}
        tiles={tiles}
      />
      <ClubsSocieties
        clubs={clubs}
        eyebrow={activitiesEyebrow}
        heading={activitiesHeading}
        intro={activitiesIntro}
      />
      <HouseSystem
        eyebrow={housesEyebrow}
        heading={housesHeading}
        houses={withPublishedNames(HOUSES, houseNames)}
        intro={housesIntro}
      />
      {events ? <StudentEvents events={events} /> : null}
      {achievements.length > 0 && <Achievements achievements={achievements} />}
      {galleryItems && galleryItems.length > 0 && (
        <Gallery items={galleryItems} />
      )}
      <PrefectsCta
        body={prefectsBody}
        heading={prefectsHeading}
        image={prefectsImage}
      />
    </main>
    <SiteFooter contact={contact} />
  </>
);
