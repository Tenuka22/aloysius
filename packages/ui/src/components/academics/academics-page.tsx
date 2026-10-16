import * as stylex from "@stylexjs/stylex";

import type { AcademicsHeaderProps } from "../../content/cms-to-pages";
import type { NavItem } from "../../content/home";
import { SkipLink } from "../primitives/layout";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { AcademicsHero } from "./academics-hero";
import { AlStreams } from "./al-streams";
import { FacilitiesShowcase } from "./facilities-showcase";
import { ResultsCta } from "./results-cta";
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
  /** CMS photographs for the facilities showcase, keyed by facility id. */
  facilityImages?: Readonly<Record<string, ImageSource>>;
}

export const AcademicsPage = ({
  contact,
  extraNavItems,
  header,
  facilityImages,
}: AcademicsPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/academics" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <AcademicsHero
        eyebrow={header?.eyebrow}
        heroImage={header?.heroImage}
        intro={header?.tagline}
        title={header?.heading}
      />
      <StudySections />
      <AlStreams />
      <FacilitiesShowcase images={facilityImages} />
      <ResultsCta />
    </main>
    {/*
      No footer's "Visit the College" band here: the results CTA above is the
      same inverse green and full-bleed, so the two stacked read as one section
      that ran on past the end of its content.
    */}
    <SiteFooter contact={contact} showVisitBand={false} />
  </>
);
