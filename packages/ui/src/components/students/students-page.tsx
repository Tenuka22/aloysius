import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import {
  STUDENTS_HERO_INTRO,
  STUDENTS_HERO_TITLE,
} from "../../content/students";
import { SkipLink } from "../primitives/layout";
import { PageHero } from "../site/page-hero";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { AnnualEncounters } from "./annual-encounters";
import { ClubsSocieties } from "./clubs-societies";
import type { ClubDescriptions } from "./clubs-societies";
import { HouseSystem } from "./house-system";
import { SportsGrid } from "./sports-grid";
import type { SportImages } from "./sports-grid";

const MAIN_ID = "main-content";

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
  /** CMS hero copy; the rest of the page is the design's own content. */
  heading?: string;
  tagline?: string;
  /** Sports photographs from the CMS, keyed by lower-cased sport name. */
  sportImages?: SportImages;
  /** Club descriptions from the CMS registry, keyed by lower-cased club name. */
  clubDescriptions?: ClubDescriptions;
}

/*
 * Section order and tones follow the approved design (Students.dc.html):
 *
 *   hero green -> sports cream -> clubs green gradient -> annual encounters
 *   green -> houses raised cream
 */
export const StudentsPage = ({
  contact,
  extraNavItems,
  heading = STUDENTS_HERO_TITLE,
  tagline = STUDENTS_HERO_INTRO,
  sportImages,
  clubDescriptions,
}: StudentsPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/students" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <PageHero
        crumb="Students"
        intro={tagline}
        title={heading}
        titleId="students-hero-title"
      />
      <SportsGrid images={sportImages} />
      <ClubsSocieties descriptions={clubDescriptions} />
      <AnnualEncounters />
      <HouseSystem />
    </main>
    <SiteFooter contact={contact} />
  </>
);
