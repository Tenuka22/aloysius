import * as stylex from "@stylexjs/stylex";

import {
  ALUMNI_HERO_INTRO,
  ALUMNI_HERO_TITLE,
  ALUMNI_NOTABLES_LABEL,
} from "../../content/alumni";
import type { NavItem } from "../../content/home";
import { SkipLink } from "../primitives/layout";
import { PageHero } from "../site/page-hero";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { Branches } from "./branches";
import type { BranchDetails } from "./branches";
import { Distinguished } from "./distinguished";
import type { NotablePortraits } from "./distinguished";

const MAIN_ID = "main-content";

/** The default title breaks after "Aloysian,"; a CMS-edited title is shown as is. */
const DEFAULT_TITLE_BREAK = "Once an Aloysian,";

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  button: {
    display: "inline-block",
    paddingBlock: "15px",
    paddingInline: "32px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      default: "rgba(255, 248, 231, 0.6)",
      ":hover": "#FFB203",
    },
    color: {
      default: "#FFF8E7",
      ":hover": "#FFB203",
    },
    fontWeight: 700,
    fontSize: "14px",
    textDecoration: "none",
  },
});

export interface AlumniPageProps {
  /** CMS hero copy; the rest of the page is the design's own content. */
  heading?: string;
  tagline?: string;
  /** Contact and page links for each branch, from the CMS, keyed by lower-cased name. */
  branchDetails?: BranchDetails;
  /** Portraits for the featured Aloysians, from the CMS, keyed by lower-cased name. */
  portraits?: NotablePortraits;
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
}

export const AlumniPage = ({
  heading = ALUMNI_HERO_TITLE,
  tagline = ALUMNI_HERO_INTRO,
  branchDetails,
  portraits,
  contact,
  extraNavItems,
}: AlumniPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/alumni" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <PageHero
        actions={
          <a href="#distinguished" {...stylex.props(styles.button)}>
            {ALUMNI_NOTABLES_LABEL}
          </a>
        }
        crumb="Alumni"
        intro={tagline}
        title={
          heading === ALUMNI_HERO_TITLE ? (
            <>
              {DEFAULT_TITLE_BREAK}
              <br />
              {heading.slice(DEFAULT_TITLE_BREAK.length).trim()}
            </>
          ) : (
            heading
          )
        }
        titleId="alumni-hero-title"
        titleWide
      />
      <Branches details={branchDetails} />
      <Distinguished portraits={portraits} />
    </main>
    <SiteFooter contact={contact} />
  </>
);
