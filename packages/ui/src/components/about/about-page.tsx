import * as stylex from "@stylexjs/stylex";

import type { LeadershipMember } from "../../content/about";
import { FOUNDERS, TIMELINE } from "../../content/about";
import type { AboutImages, AboutTextContent } from "../../content/cms-to-about";
import type { NavItem } from "../../content/home";
import { SkipLink } from "../primitives/layout";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { AboutHero } from "./about-hero";
import { Administration } from "./administration";
import { Anthem } from "./anthem";
import { Founders } from "./founders";
import { HistoryTimeline } from "./history-timeline";
import { MottoBanner } from "./motto-banner";
import { PrincipalNote } from "./principal-note";
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
  principalName?: string;
  leadership?: readonly LeadershipMember[];
  /** Editable image overrides resolved from CMS blocks, already defaulted. */
  images?: AboutImages;
  /** Editable text overrides resolved from CMS blocks. */
  text?: AboutTextContent;
  extraNavItems?: readonly NavItem[];
}

export const AboutPage = ({
  contact,
  principalName,
  leadership,
  images,
  text,
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
        <PrincipalNote name={principalName} />
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
