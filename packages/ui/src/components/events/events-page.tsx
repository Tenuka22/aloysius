import * as stylex from "@stylexjs/stylex";

import { HONOURS_ANCHOR_LABEL } from "../../content/events";
import type { NavItem } from "../../content/home";
import { SkipLink } from "../primitives/layout";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { EventAgenda } from "./event-agenda";
import type { AgendaEvent } from "./event-agenda";
import { EventHonours } from "./event-honours";
import type { AgendaAchievement } from "./event-honours";
import { NextEventLead } from "./event-lead";
import type { LeadEvent } from "./event-lead";
import { RecentEvents } from "./event-recent";
import type { RecentEvent } from "./event-recent";
import { EventsHero } from "./events-hero";

const MAIN_ID = "main-content";

/** A stable reference, so the default prop is not a new array on every render. */
const NO_ACHIEVEMENTS: readonly AgendaAchievement[] = [];
const NO_RECENT: readonly RecentEvent[] = [];

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

export type { AgendaEvent } from "./event-agenda";
export type { AgendaAchievement } from "./event-honours";
export type { LeadEvent } from "./event-lead";
export type { RecentEvent } from "./event-recent";

export interface EventsPageProps {
  /**
   * Every event still to come. The soonest of these leads the page when
   * `lead` is supplied, and the rest fill the agenda.
   */
  events: readonly AgendaEvent[];
  /** The soonest upcoming event, given the lead treatment. */
  lead?: LeadEvent;
  recent?: readonly RecentEvent[];
  achievements?: readonly AgendaAchievement[];
  heading?: string;
  tagline?: string;
  agendaHeading?: string;
  honoursHeading?: string;
  honoursIntro?: string;
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
}

/*
 * Five bands, paced rather than alternated.
 *
 * The masthead is a compact cream head; the soonest event is the one deep-green
 * band on the page, so it separates from everything around it by colour instead
 * of by a card; the agenda is a continuous date-led column on cream; the recent
 * band and the honours grid are quieter and carry the eye back down. A dense
 * passage (the agenda) earns a quiet one (honours), and the page ends on the
 * honours rather than trailing off after a list.
 *
 * `RecentEvents` and `EventHonours` render nothing when empty, so an
 * unpublished archive leaves the same shape with two bands missing rather than
 * two headings over nothing.
 */
export const EventsPage = ({
  events,
  lead,
  recent = NO_RECENT,
  achievements = NO_ACHIEVEMENTS,
  heading,
  tagline,
  agendaHeading,
  honoursHeading,
  honoursIntro,
  contact,
  extraNavItems,
}: EventsPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/events" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      {/*
        The jump link is only offered when there is an honours band to jump to -
        a link to a section this page did not render is a dead control.
      */}
      <EventsHero
        anchorLabel={achievements.length > 0 ? HONOURS_ANCHOR_LABEL : undefined}
        intro={tagline}
        title={heading}
      />
      {lead ? <NextEventLead event={lead} /> : null}
      <EventAgenda events={events} heading={agendaHeading} />
      <RecentEvents events={recent} />
      <EventHonours
        achievements={achievements}
        heading={honoursHeading}
        intro={honoursIntro}
      />
    </main>
    <SiteFooter contact={contact} />
  </>
);
