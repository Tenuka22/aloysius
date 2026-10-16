import * as stylex from "@stylexjs/stylex";

import { TIMELINE } from "../../content/about";
import type {
  AboutHeaderProps,
  AboutImages,
  AboutTextContent,
} from "../../content/cms-to-about";
import type { NavItem } from "../../content/home";
import type { AcademicHead } from "../../content/people";
import type { PrincipalContent } from "../../content/principal";
import { SkipLink } from "../primitives/layout";
import { PrincipalMessage } from "../principal/principal-message";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { AboutHero } from "./about-hero";
import { AcademicHeads } from "./academic-heads";
import { Anthem } from "./anthem";
import { HistoryTimeline } from "./history-timeline";
import { MottoBanner } from "./motto-banner";
import { VisionMission } from "./vision-mission";

const MAIN_ID = "main-content";

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
});

export interface AboutPageProps {
  contact?: FooterContact;
  /** Editable image overrides resolved from CMS blocks, already defaulted. */
  images?: AboutImages;
  /** Editable text overrides resolved from CMS blocks. */
  text?: AboutTextContent;
  /**
   * The global Principal's Message block, resolved by the route from
   * `orpc.cms.getPrincipal` — the same content the homepage renders.
   */
  principal?: PrincipalContent;
  extraNavItems?: readonly NavItem[];
  /** The `about-header` CMS block, resolved by the route. */
  header?: AboutHeaderProps;
  /** The academic-heads roster, resolved by the route. */
  academicHeads?: readonly AcademicHead[];
}

export const AboutPage = ({
  contact,
  images,
  text,
  principal,
  extraNavItems,
  header,
  academicHeads,
}: AboutPageProps) => {
  const timeline = images
    ? TIMELINE.map((entry, index) => ({
        ...entry,
        image: [
          images.history1Image,
          images.history2Image,
          images.history3Image,
          images.history4Image,
        ][index],
      }))
    : TIMELINE;

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/about" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <AboutHero
          eyebrow={header?.eyebrow}
          heroImage={header?.heroImage}
          intro={header?.tagline}
          title={header?.heading}
        />
        <HistoryTimeline heading={text?.historyHeading} entries={timeline} />
        <VisionMission />
        <MottoBanner />
        {principal && !principal.hidden && (
          <PrincipalMessage
            content={principal}
            id="principal"
            variant="article"
          />
        )}
        {/*
          Directly under the Principal, and in place of the Administration
          section that used to sit at the foot of the page. The roster was a
          fixed list of nothing, so it rendered "Leadership profiles will be
          published here soon" under an otherwise finished page; it is now a
          CMS roster an editor fills in, and it sits with the Principal because
          that is who these people report to.
        */}
        <AcademicHeads heads={academicHeads} />
        <Anthem
          image={images?.anthemImage}
          sinhalaImage={images?.anthemSinhalaImage}
        />
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};
