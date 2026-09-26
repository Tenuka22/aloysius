import * as stylex from "@stylexjs/stylex";

import type { LeadershipMember } from "../../content/about";
import { FOUNDERS, TIMELINE } from "../../content/about";
import type { AboutImages, AboutTextContent } from "../../content/cms-to-about";
import type { NavItem } from "../../content/home";
import type { PrincipalContent } from "../../content/principal";
import { SkipLink } from "../primitives/layout";
import { PrincipalMessage } from "../principal/principal-message";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { AboutHero } from "./about-hero";
import { Administration } from "./administration";
import { Anthem } from "./anthem";
import { Founders } from "./founders";
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
  leadership?: readonly LeadershipMember[];
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
}

export const AboutPage = ({
  contact,
  leadership,
  images,
  text,
  principal,
  extraNavItems,
}: AboutPageProps) => {
  const founders = images
    ? FOUNDERS.map((founder, index) => ({
        ...founder,
        image: [images.founder1Image, images.founder2Image][index],
      }))
    : FOUNDERS;
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
        <AboutHero />
        <Founders
          eyebrow={text?.foundersEyebrow}
          heading={text?.foundersHeading}
          founders={founders}
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
        <Anthem
          image={images?.anthemImage}
          sinhalaImage={images?.anthemSinhalaImage}
        />
        <Administration members={leadership} />
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};
