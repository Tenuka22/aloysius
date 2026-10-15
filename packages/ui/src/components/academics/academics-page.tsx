import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { SkipLink } from "../primitives/layout";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { AcademicsHero } from "./academics-hero";
import type { AcademicsLeader } from "./academics-leadership";
import { AcademicsLeadership } from "./academics-leadership";
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
  /** Principal, Primary sectional head and Secondary deputy principal. */
  leaders?: readonly AcademicsLeader[];
}

export const AcademicsPage = ({
  contact,
  extraNavItems,
  leaders,
}: AcademicsPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/academics" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <AcademicsHero />
      <StudySections />
      {leaders && leaders.length > 0 && (
        <AcademicsLeadership leaders={leaders} />
      )}
      <AlStreams />
      <FacilitiesShowcase />
      <ResultsCta />
    </main>
    <SiteFooter contact={contact} />
  </>
);
