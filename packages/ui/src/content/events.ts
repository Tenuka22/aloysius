/**
 * Content for the Events page.
 *
 * The same rule as `content/students.ts`: every string is a typed constant
 * carrying real copy, never a `[CMS: ...]` marker. This page's own copy is only
 * the masthead and the two band headings - the events and honours themselves are
 * records (`orpc.cms.listEvents` / `orpc.cms.listAchievements`) that
 * `/cms/events` already edits, so nothing here describes a date or a place.
 */

export const EVENTS_HERO_TITLE = "Events";
export const EVENTS_HERO_INTRO =
  "Assemblies, competitions, expeditions and the events our clubs run. Photographs of each are published as galleries.";

export const AGENDA_HEADING = "What is coming up";
/** Shown in place of the agenda when nothing is scheduled. */
export const AGENDA_EMPTY =
  "Nothing is scheduled at the moment. Check back closer to the season.";

/** The lead treatment over the soonest event. */
export const NEXT_UP_EYEBROW = "Next up";
export const NEXT_UP_DAYS_AGO = "Happening now";
export const NEXT_UP_TODAY = "Today";
export const NEXT_UP_TOMORROW = "Tomorrow";
export const NEXT_UP_SOON = "in days";

/** Past events, so the page is a diary rather than a to-do list. */
export const RECENT_HEADING = "Recently";
export const RECENT_INTRO =
  "What the college ran recently, with the photographs published afterwards.";

export const HONOURS_HEADING = "What our clubs have achieved";
export const HONOURS_INTRO =
  "School-wide honours recorded by the college, most recent first.";

/** The masthead's own anchor down to the honours band. */
export const HONOURS_ANCHOR_LABEL = "See the honours";
