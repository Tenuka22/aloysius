import * as stylex from "@stylexjs/stylex";

import { TIMELINE } from "../../content/about";
import type { TimelineEntry } from "../../content/about";
import type {
  AboutHeaderProps,
  AboutImages,
  AboutTextContent,
} from "../../content/cms-to-about";
import type { NavItem } from "../../content/home";
import type { LeadershipPerson } from "../../content/people";
import type { PrincipalContent } from "../../content/principal";
import { SkipLink } from "../primitives/layout";
import { PrincipalMessage } from "../principal/principal-message";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { AboutHero } from "./about-hero";
import { Administration } from "./administration";
import { Anthem } from "./anthem";
import { Crest } from "./crest";
import { HistoryTimeline } from "./history-timeline";
import { MottoBanner } from "./motto-banner";
import { PrincipalsRoll } from "./principals-roll";
import { VisionMission } from "./vision-mission";

const MAIN_ID = "main-content";

const NO_PEOPLE: readonly LeadershipPerson[] = [];

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
  /** Vice Principals and Sectional Heads, resolved by the route. */
  leadership?: readonly LeadershipPerson[];
  /** The history timeline's per-entry title/body, merged over the defaults. */
  timeline?: readonly TimelineEntry[];
}

export const AboutPage = ({
  contact,
  images,
  text,
  principal,
  extraNavItems,
  header,
  leadership = NO_PEOPLE,
  timeline: timelineOverride,
}: AboutPageProps) => {
  const baseTimeline = timelineOverride ?? TIMELINE;
  const timeline = images
    ? baseTimeline.map((entry, index) => ({
        ...entry,
        image: [
          images.history1Image,
          images.history2Image,
          images.history3Image,
          images.history4Image,
        ][index],
      }))
    : baseTimeline;

  /*
   * The Principal leads the Administration grid, from the same global block
   * as the message above, so the name and portrait are written once.
   */
  const administration: LeadershipPerson[] = [
    ...(principal && !principal.hidden && principal.name
      ? [
          {
            id: "principal",
            name: principal.name,
            role: "Principal",
            image: principal.portrait,
          },
        ]
      : []),
    ...leadership,
  ];

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/about" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <AboutHero intro={header?.tagline} title={header?.heading} />
        <HistoryTimeline heading={text?.historyHeading} entries={timeline} />
        <VisionMission
          mission={text?.missionStatement}
          vision={text?.visionStatement}
        />
        <MottoBanner />
        <Crest />
        {principal && !principal.hidden && (
          <PrincipalMessage
            content={principal}
            id="principal"
            variant="article"
          />
        )}
        <Administration people={administration} />
        <Anthem />
        <PrincipalsRoll />
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};
