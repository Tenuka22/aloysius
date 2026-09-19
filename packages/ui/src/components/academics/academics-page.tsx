import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { SkipLink } from "../primitives/layout";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { AcademicsHero } from "./academics-hero";
import { AlStreams } from "./al-streams";
import { ResultsCta } from "./results-cta";
import { StudySections } from "./study-sections";
import { SubjectDepartments } from "./subject-departments";

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
  /** Photographs for the departments section, once the CMS supplies them. */
  labImage?: ImageSource;
  libraryImage?: ImageSource;
}

export const AcademicsPage = ({
  contact,
  extraNavItems,
  labImage,
  libraryImage,
}: AcademicsPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/academics" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <AcademicsHero />
      <StudySections />
      <AlStreams />
      <SubjectDepartments labImage={labImage} libraryImage={libraryImage} />
      <ResultsCta />
    </main>
    <SiteFooter contact={contact} />
  </>
);
