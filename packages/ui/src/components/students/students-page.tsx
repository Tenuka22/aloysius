import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { SkipLink } from "../primitives/layout";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { ClubsSocieties } from "./clubs-societies";
import { HouseSystem } from "./house-system";
import { PrefectsCta } from "./prefects-cta";
import { SportsGrid } from "./sports-grid";
import type { SportImages } from "./sports-grid";
import { StudentsHero } from "./students-hero";

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
  /** Sports photographs keyed by tile id, once the CMS supplies them. */
  sportImages?: SportImages;
  /** Destination for the prefects call to action; omitted, no button renders. */
  prefectsHref?: string;
}

export const StudentsPage = ({
  contact,
  extraNavItems,
  sportImages,
  prefectsHref,
}: StudentsPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/students" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <StudentsHero />
      <SportsGrid images={sportImages} />
      <ClubsSocieties />
      <HouseSystem />
      <PrefectsCta href={prefectsHref} />
    </main>
    <SiteFooter contact={contact} />
  </>
);
