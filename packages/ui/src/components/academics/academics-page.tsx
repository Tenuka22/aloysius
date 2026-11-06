import * as stylex from "@stylexjs/stylex";

import {
  ACADEMICS_HERO_INTRO,
  ACADEMICS_HERO_TITLE,
} from "../../content/academics";
import type { Facility } from "../../content/academics";
import type { AcademicsHeaderProps } from "../../content/cms-to-pages";
import type { NavItem } from "../../content/home";
import { SkipLink } from "../primitives/layout";
import { PageHero } from "../site/page-hero";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { AlStreams } from "./al-streams";
import { FacilitiesShowcase } from "./facilities-showcase";
import { StudySections } from "./study-sections";

const MAIN_ID = "main-content";

const styles = stylex.create({
  /*
   * `tabIndex={-1}` on <main> is what lets the skip link move focus here, but
   * it also makes the whole region focusable, so the global focus ring would
   * draw a 3px outline around the entire page. Suppressed on `:focus` only -
   * `:focus-visible` still applies nowhere else, and every real control keeps
   * its ring.
   */
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
});

export interface AcademicsPageProps {
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
  /** The `academics-header` CMS block, resolved by the route. */
  header?: AcademicsHeaderProps;
  /** The facilities showcase rows, resolved by the route from `listFacilities`. */
  facilities?: readonly Facility[];
}

export const AcademicsPage = ({
  contact,
  extraNavItems,
  header,
  facilities,
}: AcademicsPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/academics" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <PageHero
        crumb="Academics"
        intro={header?.tagline ?? ACADEMICS_HERO_INTRO}
        title={header?.heading ?? ACADEMICS_HERO_TITLE}
        titleId="academics-hero-title"
      />
      <StudySections />
      <AlStreams />
      <FacilitiesShowcase facilities={facilities} />
    </main>
    <SiteFooter contact={contact} />
  </>
);
